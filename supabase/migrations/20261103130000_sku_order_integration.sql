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
    IF NOT FOUND OR current_status IN ('hidden', 'coming-soon', 'out-of-stock') THEN
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
      ELSIF current_stock IS NOT NULL AND current_stock < item_quantity THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'There is not enough stock for one of the products in your cart.');
      END IF;
    ELSIF current_stock IS NOT NULL AND current_stock < item_quantity THEN
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
    SELECT stock_quantity, status INTO stock, current_status FROM public.product_status WHERE product_slug = slug FOR UPDATE;
    IF NOT FOUND OR current_status IN ('hidden','coming-soon','out-of-stock') THEN
      RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'A product in this order is no longer available.');
    END IF;
    IF sku IS NOT NULL THEN
      SELECT product_slug, status INTO sku_parent, sku_status FROM public.product_skus WHERE id = sku FOR UPDATE;
      IF NOT FOUND OR sku_parent <> slug OR sku_status <> 'active' THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'A selected pack is no longer available.');
      END IF;
      SELECT stock_quantity INTO stock FROM public.sku_inventory WHERE sku_id = sku FOR UPDATE;
      IF FOUND AND stock IS NOT NULL AND stock < qty THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'There is not enough stock to fulfil this paid pack.');
      ELSIF (NOT FOUND OR stock IS NULL) AND stock IS NOT NULL AND stock < qty THEN
        RETURN pg_catalog.jsonb_build_object('success', false, 'message', 'There is not enough stock to fulfil this paid order.');
      END IF;
    ELSIF stock IS NOT NULL AND stock < qty THEN
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

COMMIT;
