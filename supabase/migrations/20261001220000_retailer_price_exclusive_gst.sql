-- Apply existing unapplied retailer credit automatically to new non-prepaid orders.
BEGIN;

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
  unapplied_credit_available numeric := 0;
  credit_applied numeric := 0;
  remaining_credit numeric := 0;
  payment_row record;
  payment_unapplied numeric;
  allocation numeric;
  initial_payment_allocated numeric := 0;
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

    taxable_total := taxable_total + item_price * item_quantity;
  END LOOP;

  -- Retailer prices are stored and entered excluding GST.
  -- Add 5% GST to calculate the final retailer bill total.
  gross_total := round(taxable_total * 1.05, 2);
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

  -- Existing unapplied credit can be used on a new credit/partial/COD order.
  -- Prepaid keeps its explicit full-payment semantics and does not consume credit.
  IF normalized_payment_type <> 'prepaid' THEN
    SELECT GREATEST(
      COALESCE((SELECT SUM(p.amount) FROM public.retailer_payments p WHERE p.retailer_id = p_retailer_id), 0)
      - COALESCE((
        SELECT SUM(a.amount)
        FROM public.retailer_payment_allocations a
        JOIN public.retailer_payments p ON p.id = a.retailer_payment_id
        WHERE p.retailer_id = p_retailer_id
      ), 0),
      0
    )
    INTO unapplied_credit_available;

    credit_applied := LEAST(unapplied_credit_available, gross_total - p_initial_payment);
  END IF;

  IF normalized_payment_type IN ('credit', 'partial') AND credit_limit_value > 0
    AND existing_outstanding + gross_total - credit_applied - p_initial_payment > credit_limit_value THEN
    RAISE EXCEPTION 'Credit limit exceeded for this retailer' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.retailer_orders
  SET subtotal = round(taxable_total, 2),
      taxable_value = round(taxable_total, 2),
      gst_total = gst_total_value,
      cgst = cgst_value,
      sgst = sgst_value,
      igst = igst_value,
      total = round(gross_total, 2),
      payment_status = 'unpaid'
  WHERE id = order_id;

  -- Allocate existing unapplied payments FIFO to this new order.
  IF credit_applied > 0 THEN
    remaining_credit := credit_applied;

    FOR payment_row IN
      SELECT p.id, p.amount
      FROM public.retailer_payments p
      WHERE p.retailer_id = p_retailer_id
        AND p.amount > COALESCE((
          SELECT SUM(a.amount)
          FROM public.retailer_payment_allocations a
          WHERE a.retailer_payment_id = p.id
        ), 0)
      ORDER BY p.created_at, p.id
      FOR UPDATE
    LOOP
      payment_unapplied := GREATEST(
        payment_row.amount - COALESCE((
          SELECT SUM(a.amount)
          FROM public.retailer_payment_allocations a
          WHERE a.retailer_payment_id = payment_row.id
        ), 0),
        0
      );

      allocation := LEAST(remaining_credit, payment_unapplied);

      IF allocation > 0 THEN
        INSERT INTO public.retailer_payment_allocations (
          retailer_payment_id, retailer_order_id, amount
        )
        VALUES (payment_row.id, order_id, allocation);

        remaining_credit := remaining_credit - allocation;
      END IF;

      EXIT WHEN remaining_credit <= 0;
    END LOOP;
  END IF;

  -- Record any new initial payment and allocate it to this order.
  IF p_initial_payment > 0 THEN
    INSERT INTO public.retailer_payments (
      retailer_id, amount, payment_method, reference, notes
    )
    VALUES (
      p_retailer_id, round(p_initial_payment, 2), normalized_payment_method,
      NULLIF(btrim(p_initial_payment_reference), ''), 'Initial payment for retailer order #' || order_id
    )
    RETURNING id INTO payment_id;

    initial_payment_allocated := LEAST(p_initial_payment, gross_total - credit_applied);

    IF initial_payment_allocated > 0 THEN
      INSERT INTO public.retailer_payment_allocations (
        retailer_payment_id, retailer_order_id, amount
      )
      VALUES (payment_id, order_id, round(initial_payment_allocated, 2));
    END IF;
  END IF;

  UPDATE public.retailer_orders
  SET payment_status = CASE
    WHEN credit_applied + p_initial_payment >= gross_total THEN 'paid'
    WHEN credit_applied + p_initial_payment > 0 THEN 'partial'
    ELSE 'unpaid'
  END
  WHERE id = order_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'order_id', order_id,
    'total', round(gross_total, 2),
    'initial_payment', round(p_initial_payment, 2),
    'credit_applied', round(credit_applied, 2),
    'unapplied_credit_remaining', round(GREATEST(unapplied_credit_available - credit_applied, 0), 2)
  );
END;
$function$;

COMMIT;
