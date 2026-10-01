-- Fix retailer payment allocation, credit accounting, deterministic stock locking and GST split.
BEGIN;

ALTER TABLE public.retailer_orders
  ADD COLUMN IF NOT EXISTS cgst numeric(12,2) NOT NULL DEFAULT 0 CHECK (cgst >= 0),
  ADD COLUMN IF NOT EXISTS sgst numeric(12,2) NOT NULL DEFAULT 0 CHECK (sgst >= 0),
  ADD COLUMN IF NOT EXISTS igst numeric(12,2) NOT NULL DEFAULT 0 CHECK (igst >= 0),
  ADD COLUMN IF NOT EXISTS place_of_supply_state text;

CREATE INDEX IF NOT EXISTS retailer_payment_allocations_order_idx
  ON public.retailer_payment_allocations(retailer_order_id);

CREATE OR REPLACE VIEW public.retailer_balances
WITH (security_invoker = true)
AS
SELECT
  r.id AS retailer_id,
  COALESCE(SUM(o.total) FILTER (WHERE o.order_status <> 'cancelled'), 0) AS invoiced_total,
  COALESCE((
    SELECT SUM(a.amount)
    FROM public.retailer_payment_allocations a
    JOIN public.retailer_payments p ON p.id = a.retailer_payment_id
    WHERE p.retailer_id = r.id
  ), 0) AS paid_total,
  GREATEST(
    COALESCE(SUM(o.total) FILTER (WHERE o.order_status <> 'cancelled'), 0)
      - COALESCE((
        SELECT SUM(a.amount)
        FROM public.retailer_payment_allocations a
        JOIN public.retailer_payments p ON p.id = a.retailer_payment_id
        WHERE p.retailer_id = r.id
      ), 0),
    0
  ) AS outstanding_balance,
  GREATEST(
    COALESCE((SELECT SUM(p.amount) FROM public.retailer_payments p WHERE p.retailer_id = r.id), 0)
      - COALESCE((
        SELECT SUM(a.amount)
        FROM public.retailer_payment_allocations a
        JOIN public.retailer_payments p ON p.id = a.retailer_payment_id
        WHERE p.retailer_id = r.id
      ), 0),
    0
  ) AS unapplied_credit
FROM public.retailers r
LEFT JOIN public.retailer_orders o ON o.retailer_id = r.id
GROUP BY r.id;

CREATE OR REPLACE FUNCTION public.create_retailer_order_with_stock(
  p_retailer_id uuid,
  p_items jsonb,
  p_payment_type text DEFAULT 'credit',
  p_due_date date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_initial_payment numeric DEFAULT 0,
  p_initial_payment_method text DEFAULT 'upi',
  p_initial_payment_reference text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  item jsonb;
  item_slug text;
  item_quantity integer;
  item_price numeric;
  item_name text;
  current_stock integer;
  current_status text;
  order_id bigint;
  payment_id bigint;
  gross_total numeric := 0;
  taxable_total numeric := 0;
  gst_total_value numeric := 0;
  cgst_value numeric := 0;
  sgst_value numeric := 0;
  igst_value numeric := 0;
  payment_days integer;
  credit_limit_value numeric;
  existing_outstanding numeric;
  retailer_state text;
  normalized_payment_type text;
  normalized_payment_method text;
BEGIN
  IF (SELECT auth.jwt() ->> 'email') <> 'info@tenoo.in' THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.retailers WHERE id = p_retailer_id AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Retailer is not active' USING ERRCODE = 'P0001';
  END IF;

  IF pg_catalog.jsonb_typeof(p_items) <> 'array'
    OR pg_catalog.jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one product is required' USING ERRCODE = 'P0001';
  END IF;

  IF p_initial_payment IS NULL OR p_initial_payment < 0 THEN
    RAISE EXCEPTION 'Initial payment cannot be negative' USING ERRCODE = 'P0001';
  END IF;

  normalized_payment_type := CASE
    WHEN p_payment_type IN ('prepaid', 'credit', 'partial', 'cod') THEN p_payment_type
    ELSE 'credit'
  END;

  normalized_payment_method := CASE
    WHEN p_initial_payment_method IN ('cash', 'upi', 'bank-transfer', 'cheque', 'other')
      THEN p_initial_payment_method
    ELSE 'other'
  END;

  SELECT payment_terms_days, credit_limit, state
    INTO payment_days, credit_limit_value, retailer_state
  FROM public.retailers
  WHERE id = p_retailer_id
  FOR UPDATE;

  -- Lock product rows in deterministic order to avoid concurrent-order deadlocks.
  FOR item IN
    SELECT element
    FROM pg_catalog.jsonb_array_elements(p_items) AS items(element)
    ORDER BY element ->> 'product_slug'
  LOOP
    item_slug := item ->> 'product_slug';
    item_quantity := NULLIF(item ->> 'quantity', '')::integer;

    IF item_slug IS NULL OR item_quantity IS NULL OR item_quantity < 1 THEN
      RAISE EXCEPTION 'Invalid product or quantity' USING ERRCODE = 'P0001';
    END IF;

    SELECT ps.stock_quantity, ps.status,
           COALESCE(rpp.unit_price, ps.retailer_price, ps.price),
           COALESCE(ps.display_name, ps.product_slug)
      INTO current_stock, current_status, item_price, item_name
    FROM public.product_status ps
    LEFT JOIN public.retailer_product_prices rpp
      ON rpp.retailer_id = p_retailer_id AND rpp.product_slug = ps.product_slug
    WHERE ps.product_slug = item_slug
    FOR UPDATE OF ps;

    IF NOT FOUND OR item_price IS NULL OR item_price <= 0
      OR current_status IN ('hidden', 'coming-soon', 'out-of-stock') THEN
      RAISE EXCEPTION 'Product % is unavailable for retailer ordering', item_slug USING ERRCODE = 'P0001';
    END IF;

    IF current_stock IS NOT NULL AND current_stock < item_quantity THEN
      RAISE EXCEPTION 'Not enough stock for %', item_slug USING ERRCODE = 'P0001';
    END IF;
  END LOOP;

  INSERT INTO public.retailer_orders (
    retailer_id, payment_type, payment_status, due_date, notes, place_of_supply_state
  )
  VALUES (
    p_retailer_id,
    normalized_payment_type,
    'unpaid',
    COALESCE(p_due_date, CASE WHEN payment_days > 0 THEN current_date + payment_days ELSE NULL END),
    NULLIF(btrim(COALESCE(p_notes, '')), ''),
    NULLIF(btrim(retailer_state), '')
  )
  RETURNING id INTO order_id;

  -- Stock rows are already locked above, so this second pass only decrements them.
  FOR item IN
    SELECT element
    FROM pg_catalog.jsonb_array_elements(p_items) AS items(element)
    ORDER BY element ->> 'product_slug'
  LOOP
    item_slug := item ->> 'product_slug';
    item_quantity := (item ->> 'quantity')::integer;

    SELECT COALESCE(rpp.unit_price, ps.retailer_price, ps.price),
           COALESCE(ps.display_name, ps.product_slug)
      INTO item_price, item_name
    FROM public.product_status ps
    LEFT JOIN public.retailer_product_prices rpp
      ON rpp.retailer_id = p_retailer_id AND rpp.product_slug = ps.product_slug
    WHERE ps.product_slug = item_slug;

    UPDATE public.product_status
    SET stock_quantity = stock_quantity - item_quantity,
        status = CASE WHEN stock_quantity - item_quantity = 0 THEN 'out-of-stock' ELSE status END
    WHERE product_slug = item_slug AND stock_quantity IS NOT NULL;

    INSERT INTO public.retailer_order_items (
      retailer_order_id, product_slug, product_name, quantity, unit_price, gst_rate, line_total
    )
    VALUES (
      order_id, item_slug, item_name, item_quantity, item_price, 5,
      round(item_price * item_quantity, 2)
    );

    gross_total := gross_total + item_price * item_quantity;
    taxable_total := taxable_total + (item_price * item_quantity) / 1.05;
  END LOOP;

  gst_total_value := round(gross_total - taxable_total, 2);

  IF upper(regexp_replace(COALESCE(retailer_state, ''), '[[:space:]]+', ' ', 'g')) IN ('TAMIL NADU', 'TN') THEN
    cgst_value := round(gst_total_value / 2, 2);
    sgst_value := gst_total_value - cgst_value;
    igst_value := 0;
  ELSE
    cgst_value := 0;
    sgst_value := 0;
    igst_value := gst_total_value;
  END IF;

  IF normalized_payment_type = 'prepaid' AND round(p_initial_payment, 2) <> round(gross_total, 2) THEN
    RAISE EXCEPTION 'Prepaid orders require full payment of the order total' USING ERRCODE = 'P0001';
  END IF;

  IF normalized_payment_type = 'partial'
    AND (p_initial_payment <= 0 OR p_initial_payment >= gross_total) THEN
    RAISE EXCEPTION 'Partial payment must be greater than zero and less than the order total' USING ERRCODE = 'P0001';
  END IF;

  IF normalized_payment_type IN ('credit', 'cod') AND p_initial_payment > 0 THEN
    RAISE EXCEPTION 'Initial payment is not supported for credit or COD orders; record it after creation' USING ERRCODE = 'P0001';
  END IF;

  SELECT
    GREATEST(
      COALESCE(SUM(o.total) FILTER (WHERE o.order_status <> 'cancelled'), 0)
        - COALESCE((
          SELECT SUM(a.amount)
          FROM public.retailer_payment_allocations a
          JOIN public.retailer_payments p ON p.id = a.retailer_payment_id
          WHERE p.retailer_id = p_retailer_id
        ), 0),
      0
    )
  INTO existing_outstanding
  FROM public.retailer_orders o
  WHERE o.retailer_id = p_retailer_id;

  IF normalized_payment_type IN ('credit', 'partial') AND credit_limit_value > 0
    AND existing_outstanding + gross_total - p_initial_payment > credit_limit_value THEN
    RAISE EXCEPTION 'Credit limit exceeded for this retailer' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.retailer_orders
  SET subtotal = round(gross_total, 2),
      taxable_value = round(taxable_total, 2),
      gst_total = gst_total_value,
      cgst = cgst_value,
      sgst = sgst_value,
      igst = igst_value,
      total = round(gross_total, 2),
      payment_status = CASE
        WHEN p_initial_payment >= gross_total AND gross_total > 0 THEN 'paid'
        WHEN p_initial_payment > 0 THEN 'partial'
        ELSE 'unpaid'
      END
  WHERE id = order_id;

  IF p_initial_payment > 0 THEN
    INSERT INTO public.retailer_payments (
      retailer_id, amount, payment_method, reference, notes
    )
    VALUES (
      p_retailer_id, round(p_initial_payment, 2), normalized_payment_method,
      NULLIF(btrim(p_initial_payment_reference), ''), 'Initial payment for retailer order #' || order_id
    )
    RETURNING id INTO payment_id;

    INSERT INTO public.retailer_payment_allocations (
      retailer_payment_id, retailer_order_id, amount
    )
    VALUES (payment_id, order_id, round(p_initial_payment, 2));
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'order_id', order_id,
    'total', round(gross_total, 2),
    'initial_payment', round(p_initial_payment, 2)
  );
END;
$function$;

-- Keep the original 5-argument RPC compatible with existing callers.
CREATE OR REPLACE FUNCTION public.create_retailer_order_with_stock(
  p_retailer_id uuid,
  p_items jsonb,
  p_payment_type text DEFAULT 'credit',
  p_due_date date DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT public.create_retailer_order_with_stock(
    p_retailer_id, p_items, p_payment_type, p_due_date, p_notes, 0, 'other', NULL
  );
$function$;

CREATE OR REPLACE FUNCTION public.record_retailer_payment(
  p_retailer_id uuid,
  p_amount numeric,
  p_payment_method text DEFAULT 'upi',
  p_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  payment_id bigint;
  remaining numeric;
  order_row record;
  order_due numeric;
  allocation numeric;
  allocated_total numeric;
  normalized_method text;
BEGIN
  IF (SELECT auth.jwt() ->> 'email') <> 'info@tenoo.in' THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.retailers WHERE id = p_retailer_id) THEN
    RAISE EXCEPTION 'Retailer not found' USING ERRCODE = 'P0001';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be greater than zero' USING ERRCODE = 'P0001';
  END IF;

  normalized_method := CASE
    WHEN p_payment_method IN ('cash', 'upi', 'bank-transfer', 'cheque', 'other')
      THEN p_payment_method
    ELSE 'other'
  END;

  INSERT INTO public.retailer_payments (
    retailer_id, amount, payment_method, reference, notes
  )
  VALUES (
    p_retailer_id, round(p_amount, 2), normalized_method,
    NULLIF(btrim(p_reference), ''), NULLIF(btrim(p_notes), '')
  )
  RETURNING id INTO payment_id;

  remaining := round(p_amount, 2);

  FOR order_row IN
    SELECT o.id, o.total
    FROM public.retailer_orders o
    WHERE o.retailer_id = p_retailer_id
      AND o.order_status <> 'cancelled'
      AND o.payment_status <> 'paid'
    ORDER BY o.due_date NULLS LAST, o.created_at, o.id
    FOR UPDATE OF o
  LOOP
    SELECT GREATEST(
      order_row.total - COALESCE(SUM(a.amount), 0), 0
    )
    INTO order_due
    FROM public.retailer_payment_allocations a
    WHERE a.retailer_order_id = order_row.id;

    IF order_due <= 0 THEN
      UPDATE public.retailer_orders SET payment_status = 'paid' WHERE id = order_row.id;
      CONTINUE;
    END IF;

    allocation := LEAST(remaining, order_due);

    IF allocation > 0 THEN
      INSERT INTO public.retailer_payment_allocations (
        retailer_payment_id, retailer_order_id, amount
      )
      VALUES (payment_id, order_row.id, allocation);

      SELECT COALESCE(SUM(a.amount), 0)
      INTO allocated_total
      FROM public.retailer_payment_allocations a
      WHERE a.retailer_order_id = order_row.id;

      UPDATE public.retailer_orders
      SET payment_status = CASE
        WHEN allocated_total >= total THEN 'paid'
        WHEN allocated_total > 0 THEN 'partial'
        ELSE 'unpaid'
      END
      WHERE id = order_row.id;

      remaining := remaining - allocation;
    END IF;

    EXIT WHEN remaining <= 0;
  END LOOP;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'payment_id', payment_id,
    'applied_amount', round(p_amount - remaining, 2),
    'unapplied_amount', round(remaining, 2)
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_retailer_order_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE item record;
BEGIN
  IF OLD.order_status IS NOT DISTINCT FROM NEW.order_status THEN
    RETURN NEW;
  END IF;

  IF OLD.order_status = 'cancelled' AND NEW.order_status <> 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled retailer orders cannot be reopened; create a new order instead' USING ERRCODE = 'P0001';
  END IF;

  IF NEW.order_status = 'cancelled'
    AND OLD.order_status <> 'cancelled'
    AND OLD.inventory_reserved THEN
    FOR item IN
      SELECT product_slug, quantity
      FROM public.retailer_order_items
      WHERE retailer_order_id = OLD.id
      ORDER BY product_slug
    LOOP
      UPDATE public.product_status
      SET stock_quantity = stock_quantity + item.quantity,
          status = CASE
            WHEN status = 'out-of-stock' AND stock_quantity = 0 THEN 'active'
            ELSE status
          END
      WHERE product_slug = item.product_slug AND stock_quantity IS NOT NULL;
    END LOOP;
    NEW.inventory_reserved := false;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_retailer_order_with_stock(uuid, jsonb, text, date, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_retailer_order_with_stock(uuid, jsonb, text, date, text, numeric, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_retailer_payment(uuid, numeric, text, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.create_retailer_order_with_stock(uuid, jsonb, text, date, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_retailer_order_with_stock(uuid, jsonb, text, date, text, numeric, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_retailer_payment(uuid, numeric, text, text, text) TO authenticated;

COMMIT;
