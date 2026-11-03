-- Phase 2 foundation: SKU-aware order snapshots and online stock reservation.
-- Existing rows remain nullable/legacy; no historical SKU is inferred.
BEGIN;

ALTER TABLE public.retailer_order_items
  ADD COLUMN IF NOT EXISTS sku_id uuid REFERENCES public.product_skus(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS retailer_order_items_sku_id_idx
  ON public.retailer_order_items(sku_id) WHERE sku_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.retailer_sku_prices (
  retailer_id uuid NOT NULL REFERENCES public.retailers(id) ON DELETE CASCADE,
  sku_id uuid NOT NULL REFERENCES public.product_skus(id) ON DELETE CASCADE,
  unit_price numeric(10,2) NOT NULL CHECK (unit_price > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (retailer_id, sku_id)
);

ALTER TABLE public.retailer_sku_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY retailer_sku_prices_admin_all ON public.retailer_sku_prices
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retailer_sku_prices TO authenticated;

-- Online manual/WhatsApp order creation: SKU stock is authoritative when a
-- SKU inventory row has a quantity; otherwise preserve legacy parent stock.
CREATE OR REPLACE FUNCTION public.create_order_with_stock(p_order jsonb, p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  item jsonb;
  item_slug text;
  item_sku uuid;
  item_quantity integer;
  current_stock integer;
  current_status text;
  sku_status text;
  sku_parent text;
  sku_stock integer;
  created_order_id bigint;
BEGIN
  IF pg_catalog.jsonb_typeof(p_items) <> 'array'
    OR pg_catalog.jsonb_array_length(p_items) = 0 THEN
    RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Your cart is invalid. Please refresh and try again.');
  END IF;

  FOR item IN
    SELECT element FROM pg_catalog.jsonb_array_elements(p_items) AS items(element)
    ORDER BY COALESCE(element ->> 'sku_id', element ->> 'product_slug')
  LOOP
    item_slug := item ->> 'product_slug';
    item_sku := NULLIF(item ->> 'sku_id', '')::uuid;
    item_quantity := NULLIF(item ->> 'quantity', '')::integer;
    IF item_slug IS NULL OR item_quantity IS NULL OR item_quantity < 1 THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Your cart has an invalid product or quantity.');
    END IF;

    SELECT ps.stock_quantity, ps.status
      INTO current_stock, current_status
    FROM public.product_status ps
    WHERE ps.product_slug = item_slug
    FOR UPDATE;
    IF NOT FOUND OR current_status IN ('hidden', 'coming-soon') THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'A product in your cart is no longer available. Please refresh your cart.');
    END IF;

    IF item_sku IS NOT NULL THEN
      SELECT s.product_slug, s.status
        INTO sku_parent, sku_status
      FROM public.product_skus s
      WHERE s.id = item_sku
      FOR UPDATE;
      IF NOT FOUND OR sku_parent <> item_slug OR sku_status <> 'active' THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'A selected pack is no longer available. Please refresh your cart.');
      END IF;

      SELECT stock_quantity INTO sku_stock
      FROM public.sku_inventory
      WHERE sku_id = item_sku
      FOR UPDATE;
      IF FOUND AND sku_stock IS NOT NULL THEN
        IF sku_stock < item_quantity THEN
          RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'There is not enough stock for the selected pack.');
        END IF;
      ELSIF current_status = 'out-of-stock' OR (current_stock IS NOT NULL AND current_stock < item_quantity) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'There is not enough stock for one of the products in your cart.');
      END IF;
    ELSIF current_status = 'out-of-stock' OR (current_stock IS NOT NULL AND current_stock < item_quantity) THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'There is not enough stock for one of the products in your cart.');
    END IF;
  END LOOP;

  FOR item IN
    SELECT element FROM pg_catalog.jsonb_array_elements(p_items) AS items(element)
    ORDER BY COALESCE(element ->> 'sku_id', element ->> 'product_slug')
  LOOP
    item_slug := item ->> 'product_slug';
    item_sku := NULLIF(item ->> 'sku_id', '')::uuid;
    item_quantity := (item ->> 'quantity')::integer;
    IF item_sku IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.sku_inventory WHERE sku_id = item_sku AND stock_quantity IS NOT NULL
    ) THEN
      UPDATE public.sku_inventory
      SET stock_quantity = stock_quantity - item_quantity
      WHERE sku_id = item_sku;
      INSERT INTO public.sku_stock_movements(sku_id, movement_type, quantity_delta, reference_type, notes)
      VALUES (item_sku, 'sale', -item_quantity, 'online_order', 'Reserved for online order');
    ELSE
      UPDATE public.product_status
      SET stock_quantity = stock_quantity - item_quantity,
          status = CASE WHEN stock_quantity - item_quantity = 0 THEN 'out-of-stock' ELSE status END
      WHERE product_slug = item_slug AND stock_quantity IS NOT NULL;
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    user_id, customer_name, customer_email, phone, address, pincode, city, state,
    items, mrp_total, product_total, taxable_value, gst_total, cgst, sgst, igst,
    delivery_charge, total, payment_method, order_status, inventory_reserved
  )
  VALUES (
    NULLIF(p_order ->> 'user_id', '')::uuid, p_order ->> 'customer_name',
    p_order ->> 'customer_email', p_order ->> 'phone', p_order ->> 'address',
    p_order ->> 'pincode', p_order ->> 'city', p_order ->> 'state',
    p_order -> 'items', (p_order ->> 'mrp_total')::numeric,
    (p_order ->> 'product_total')::numeric, (p_order ->> 'taxable_value')::numeric,
    (p_order ->> 'gst_total')::numeric, (p_order ->> 'cgst')::numeric,
    (p_order ->> 'sgst')::numeric, (p_order ->> 'igst')::numeric,
    (p_order ->> 'delivery_charge')::numeric, (p_order ->> 'total')::numeric,
    'WhatsApp', 'pending', true
  )
  RETURNING id INTO created_order_id;

  RETURN pg_catalog.jsonb_build_object('success', true, 'order_id', created_order_id);
END;
$function$;

-- Cancellation/reopen keeps the exact SKU snapshot and updates its ledger once.
CREATE OR REPLACE FUNCTION public.sync_order_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  item jsonb;
  item_slug text;
  item_sku uuid;
  item_quantity integer;
  current_stock integer;
  current_status text;
  sku_stock integer;
  sku_status text;
  sku_parent text;
BEGIN
  IF OLD.order_status IS NOT DISTINCT FROM NEW.order_status THEN RETURN NEW; END IF;

  IF NEW.order_status = 'pending' THEN
    IF NEW.pending_expires_at IS NULL OR NEW.pending_expires_at <= pg_catalog.now() THEN
      NEW.pending_expires_at := pg_catalog.now() + interval '24 hours';
    END IF;
  ELSE
    NEW.pending_expires_at := NULL;
  END IF;

  IF NEW.order_status = 'cancelled' AND OLD.order_status <> 'cancelled' AND OLD.inventory_reserved THEN
    FOR item IN SELECT element FROM pg_catalog.jsonb_array_elements(OLD.items) AS items(element)
      ORDER BY COALESCE(element ->> 'sku_id', element ->> 'product_slug')
    LOOP
      item_slug := item ->> 'product_slug';
      item_sku := NULLIF(item ->> 'sku_id', '')::uuid;
      item_quantity := NULLIF(item ->> 'quantity', '')::integer;
      IF item_sku IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sku_inventory WHERE sku_id = item_sku AND stock_quantity IS NOT NULL
      ) THEN
        UPDATE public.sku_inventory SET stock_quantity = stock_quantity + item_quantity WHERE sku_id = item_sku;
        INSERT INTO public.sku_stock_movements(sku_id, movement_type, quantity_delta, reference_type, reference_id, notes)
        VALUES (item_sku, 'return', item_quantity, 'online_order', OLD.id::text, 'Restored after online order cancellation');
      ELSE
        UPDATE public.product_status
        SET stock_quantity = stock_quantity + item_quantity,
            status = CASE WHEN status = 'out-of-stock' AND stock_quantity = 0 THEN 'active' ELSE status END
        WHERE product_slug = item_slug AND stock_quantity IS NOT NULL;
      END IF;
    END LOOP;
    NEW.inventory_reserved := false;

  ELSIF OLD.order_status = 'cancelled' AND NEW.order_status <> 'cancelled' AND NOT OLD.inventory_reserved THEN
    FOR item IN SELECT element FROM pg_catalog.jsonb_array_elements(OLD.items) AS items(element)
      ORDER BY COALESCE(element ->> 'sku_id', element ->> 'product_slug')
    LOOP
      item_slug := item ->> 'product_slug';
      item_sku := NULLIF(item ->> 'sku_id', '')::uuid;
      item_quantity := NULLIF(item ->> 'quantity', '')::integer;
      IF item_sku IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sku_inventory WHERE sku_id = item_sku AND stock_quantity IS NOT NULL
      ) THEN
        SELECT stock_quantity INTO sku_stock FROM public.sku_inventory WHERE sku_id = item_sku FOR UPDATE;
        SELECT product_slug, status INTO sku_parent, sku_status FROM public.product_skus WHERE id = item_sku FOR UPDATE;
        IF NOT FOUND OR sku_parent <> item_slug OR sku_status <> 'active' OR sku_stock < item_quantity THEN
          RAISE EXCEPTION 'Not enough stock to reopen this order' USING ERRCODE = 'P0001';
        END IF;
      ELSE
        SELECT stock_quantity, status INTO current_stock, current_status
        FROM public.product_status WHERE product_slug = item_slug FOR UPDATE;
        IF FOUND AND current_stock IS NOT NULL AND (current_stock < item_quantity OR current_status IN ('hidden','coming-soon','out-of-stock')) THEN
          RAISE EXCEPTION 'Not enough stock to reopen this order' USING ERRCODE = 'P0001';
        END IF;
      END IF;
    END LOOP;

    FOR item IN SELECT element FROM pg_catalog.jsonb_array_elements(OLD.items) AS items(element)
      ORDER BY COALESCE(element ->> 'sku_id', element ->> 'product_slug')
    LOOP
      item_slug := item ->> 'product_slug';
      item_sku := NULLIF(item ->> 'sku_id', '')::uuid;
      item_quantity := NULLIF(item ->> 'quantity', '')::integer;
      IF item_sku IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.sku_inventory WHERE sku_id = item_sku AND stock_quantity IS NOT NULL
      ) THEN
        UPDATE public.sku_inventory SET stock_quantity = stock_quantity - item_quantity WHERE sku_id = item_sku;
        INSERT INTO public.sku_stock_movements(sku_id, movement_type, quantity_delta, reference_type, reference_id, notes)
        VALUES (item_sku, 'sale', -item_quantity, 'online_order', OLD.id::text, 'Re-reserved after reopening online order');
      ELSE
        UPDATE public.product_status
        SET stock_quantity = stock_quantity - item_quantity,
            status = CASE WHEN stock_quantity - item_quantity = 0 THEN 'out-of-stock' ELSE status END
        WHERE product_slug = item_slug AND stock_quantity IS NOT NULL;
      END IF;
    END LOOP;
    NEW.inventory_reserved := true;
  END IF;
  RETURN NEW;
END;
$function$;

-- Cashfree creates the order only after payment is verified. Keep its existing
-- payment-intent lock/idempotency contract while using SKU-aware stock.
CREATE OR REPLACE FUNCTION public.create_paid_order_with_stock(
  p_payment_intent_id bigint,
  p_cashfree_payment_id text DEFAULT NULL,
  p_cashfree_payment_status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  intent record;
  item jsonb;
  slug text;
  sku uuid;
  qty integer;
  stock integer;
  parent_stock integer;
  current_status text;
  sku_status text;
  sku_parent text;
  created_id bigint;
BEGIN
  SELECT * INTO intent FROM public.cashfree_payment_intents WHERE id = p_payment_intent_id FOR UPDATE;
  IF NOT FOUND THEN RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Payment intent not found.'); END IF;
  IF intent.order_id IS NOT NULL THEN RETURN pg_catalog.jsonb_build_object('success', true, 'order_id', intent.order_id); END IF;
  IF intent.status <> 'pending' THEN RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Payment intent is not pending.'); END IF;

  FOR item IN SELECT element FROM pg_catalog.jsonb_array_elements(intent.items) AS items(element)
    ORDER BY COALESCE(element ->> 'sku_id', element ->> 'product_slug')
  LOOP
    slug := item ->> 'product_slug';
    sku := NULLIF(item ->> 'sku_id', '')::uuid;
    qty := NULLIF(item ->> 'quantity', '')::integer;
    IF slug IS NULL OR qty IS NULL OR qty < 1 THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'Invalid item in paid order.');
    END IF;
    SELECT stock_quantity, status INTO parent_stock, current_status FROM public.product_status WHERE product_slug = slug FOR UPDATE;
    IF NOT FOUND OR current_status IN ('hidden','coming-soon') THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'A product in this order is no longer available.');
    END IF;
    IF sku IS NOT NULL THEN
      SELECT product_slug, status INTO sku_parent, sku_status FROM public.product_skus WHERE id = sku FOR UPDATE;
      IF NOT FOUND OR sku_parent <> slug OR sku_status <> 'active' THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'A selected pack is no longer available.');
      END IF;
      SELECT stock_quantity INTO stock FROM public.sku_inventory WHERE sku_id = sku FOR UPDATE;
      IF FOUND AND stock IS NOT NULL THEN
        IF stock < qty THEN
          RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'There is not enough stock to fulfil this paid pack.');
        END IF;
      ELSIF current_status = 'out-of-stock' OR (parent_stock IS NOT NULL AND parent_stock < qty) THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'There is not enough stock to fulfil this paid order.');
      END IF;
    ELSIF current_status = 'out-of-stock' OR (parent_stock IS NOT NULL AND parent_stock < qty) THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'There is not enough stock to fulfil this paid order.');
    END IF;
  END LOOP;

  FOR item IN SELECT element FROM pg_catalog.jsonb_array_elements(intent.items) AS items(element)
    ORDER BY COALESCE(element ->> 'sku_id', element ->> 'product_slug')
  LOOP
    slug := item ->> 'product_slug';
    sku := NULLIF(item ->> 'sku_id', '')::uuid;
    qty := (item ->> 'quantity')::integer;
    IF sku IS NOT NULL AND EXISTS (SELECT 1 FROM public.sku_inventory WHERE sku_id = sku AND stock_quantity IS NOT NULL) THEN
      UPDATE public.sku_inventory SET stock_quantity = stock_quantity - qty WHERE sku_id = sku;
      INSERT INTO public.sku_stock_movements(sku_id, movement_type, quantity_delta, reference_type, notes)
      VALUES (sku, 'sale', -qty, 'online_order', 'Reserved for Cashfree-paid order');
    ELSE
      UPDATE public.product_status SET stock_quantity = stock_quantity - qty,
        status = CASE WHEN stock_quantity - qty = 0 THEN 'out-of-stock' ELSE status END
      WHERE product_slug = slug AND stock_quantity IS NOT NULL;
    END IF;
  END LOOP;

  INSERT INTO public.orders (
    user_id, customer_name, customer_email, phone, address, pincode, city, state,
    items, mrp_total, product_total, taxable_value, gst_total, cgst, sgst, igst,
    delivery_charge, total, payment_method, order_status, inventory_reserved, pending_expires_at
  ) VALUES (
    intent.user_id, intent.customer_name, intent.customer_email, intent.phone,
    intent.address, intent.pincode, intent.city, intent.state, intent.items,
    intent.mrp_total, intent.product_total, intent.taxable_value, intent.gst_total,
    intent.cgst, intent.sgst, intent.igst, intent.delivery_charge, intent.total,
    'Cashfree', 'confirmed', true, NULL
  ) RETURNING id INTO created_id;

  UPDATE public.cashfree_payment_intents SET status = 'paid', order_id = created_id,
    cashfree_payment_id = COALESCE(p_cashfree_payment_id, cashfree_payment_id),
    cashfree_payment_status = COALESCE(p_cashfree_payment_status, cashfree_payment_status),
    updated_at = pg_catalog.now()
  WHERE id = intent.id;

  RETURN pg_catalog.jsonb_build_object('success', true, 'order_id', created_id);
END;
$function$;


-- SKU-aware retailer order RPC. Existing 5- and 8-argument signatures remain compatible.
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
  item_sku uuid;
  item_quantity integer;
  item_price numeric;
  item_name text;
  current_stock integer;
  sku_stock integer;
  sku_status text;
  sku_parent text;
  item_gst numeric;
  stock_found boolean;
  product_found boolean;
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
    item_sku := NULLIF(item ->> 'sku_id', '')::uuid;
    item_quantity := NULLIF(item ->> 'quantity', '')::integer;

    IF item_slug IS NULL OR item_quantity IS NULL OR item_quantity < 1 THEN
      RAISE EXCEPTION 'Invalid product or quantity' USING ERRCODE = 'P0001';
    END IF;

    SELECT ps.stock_quantity, ps.status,
           COALESCE(rsp.unit_price, rpp.unit_price, s.retailer_price, ps.retailer_price, ps.price),
           COALESCE(ps.display_name, ps.product_slug) || CASE WHEN s.id IS NULL THEN '' ELSE ' · ' || s.pack_size_value::text || s.pack_size_unit END,
           COALESCE(s.gst_rate, ps.gst_rate, 5)
      INTO current_stock, current_status, item_price, item_name, item_gst
    FROM public.product_status ps
    LEFT JOIN public.product_skus s
      ON s.id = item_sku AND s.product_slug = ps.product_slug AND s.status = 'active'
    LEFT JOIN public.retailer_sku_prices rsp
      ON rsp.retailer_id = p_retailer_id AND rsp.sku_id = s.id
    LEFT JOIN public.retailer_product_prices rpp
      ON rpp.retailer_id = p_retailer_id AND rpp.product_slug = ps.product_slug
    WHERE ps.product_slug = item_slug
    FOR UPDATE OF ps;

    IF item_sku IS NOT NULL THEN
      SELECT product_slug, status INTO sku_parent, sku_status
      FROM public.product_skus WHERE id = item_sku FOR UPDATE;
      IF NOT FOUND OR sku_parent <> item_slug OR sku_status <> 'active' THEN
        RAISE EXCEPTION 'Selected SKU is unavailable for retailer ordering' USING ERRCODE = 'P0001';
      END IF;
      SELECT stock_quantity INTO sku_stock FROM public.sku_inventory WHERE sku_id = item_sku FOR UPDATE;
      stock_found := FOUND;
      IF stock_found AND sku_stock IS NOT NULL THEN
        IF sku_stock < item_quantity THEN RAISE EXCEPTION 'Not enough SKU stock for %', item_slug USING ERRCODE = 'P0001'; END IF;
      ELSIF current_status = 'out-of-stock' OR (current_stock IS NOT NULL AND current_stock < item_quantity) THEN
        RAISE EXCEPTION 'Not enough stock for %', item_slug USING ERRCODE = 'P0001';
      END IF;
    END IF;

    product_found := FOUND;

    IF NOT product_found OR item_price IS NULL OR item_price <= 0
      OR current_status IN ('hidden', 'coming-soon') OR (item_sku IS NULL AND current_status = 'out-of-stock') THEN
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
    item_sku := NULLIF(item ->> 'sku_id', '')::uuid;
    item_quantity := (item ->> 'quantity')::integer;

    SELECT COALESCE(rsp.unit_price, rpp.unit_price, s.retailer_price, ps.retailer_price, ps.price),
           COALESCE(ps.display_name, ps.product_slug) || CASE WHEN s.id IS NULL THEN '' ELSE ' · ' || s.pack_size_value::text || s.pack_size_unit END,
           COALESCE(s.gst_rate, ps.gst_rate, 5)
      INTO item_price, item_name, item_gst
    FROM public.product_status ps
    LEFT JOIN public.product_skus s
      ON s.id = item_sku AND s.product_slug = ps.product_slug AND s.status = 'active'
    LEFT JOIN public.retailer_sku_prices rsp
      ON rsp.retailer_id = p_retailer_id AND rsp.sku_id = s.id
    LEFT JOIN public.retailer_product_prices rpp
      ON rpp.retailer_id = p_retailer_id AND rpp.product_slug = ps.product_slug
    WHERE ps.product_slug = item_slug;

    IF item_sku IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.sku_inventory WHERE sku_id = item_sku AND stock_quantity IS NOT NULL
    ) THEN
      UPDATE public.sku_inventory SET stock_quantity = stock_quantity - item_quantity WHERE sku_id = item_sku;
      INSERT INTO public.sku_stock_movements(sku_id, movement_type, quantity_delta, reference_type, notes)
      VALUES (item_sku, 'retailer_sale', -item_quantity, 'retailer_order', 'Reserved for retailer order');
    ELSE
      UPDATE public.product_status
      SET stock_quantity = stock_quantity - item_quantity,
          status = CASE WHEN stock_quantity - item_quantity = 0 THEN 'out-of-stock' ELSE status END
      WHERE product_slug = item_slug AND stock_quantity IS NOT NULL;
    END IF;

    INSERT INTO public.retailer_order_items (
      retailer_order_id, product_slug, sku_id, product_name, quantity, unit_price, gst_rate, line_total
    )
    VALUES (
      order_id, item_slug, item_sku, item_name, item_quantity, item_price, item_gst,
      round(item_price * item_quantity, 2)
    );

    gross_total := gross_total + item_price * item_quantity;
    taxable_total := taxable_total + (item_price * item_quantity) / (1 + item_gst / 100);
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

COMMIT;
