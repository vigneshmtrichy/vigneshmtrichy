-- Add a server-enforced expiry for pending WhatsApp orders.
BEGIN;

ALTER TABLE public.orders
  ADD COLUMN pending_expires_at timestamptz;

CREATE INDEX orders_pending_expiry_idx
  ON public.orders (order_status, pending_expires_at)
  WHERE order_status = 'pending';

-- Existing pending orders get a 24-hour confirmation window.
UPDATE public.orders
SET pending_expires_at = created_at + interval '24 hours'
WHERE order_status = 'pending'
  AND pending_expires_at IS NULL;

CREATE OR REPLACE FUNCTION public.create_order_with_stock(
  p_order jsonb,
  p_items jsonb
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
  current_stock integer;
  current_status text;
  created_order_id bigint;
BEGIN
  IF pg_catalog.jsonb_typeof(p_items) <> 'array'
    OR pg_catalog.jsonb_array_length(p_items) = 0 THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'message', 'Your cart is invalid. Please refresh and try again.'
    );
  END IF;

  FOR item IN
    SELECT element
    FROM pg_catalog.jsonb_array_elements(p_items) AS items(element)
    ORDER BY element ->> 'product_slug'
  LOOP
    item_slug := item ->> 'product_slug';
    item_quantity := NULLIF(item ->> 'quantity', '')::integer;

    IF item_slug IS NULL OR item_quantity IS NULL OR item_quantity < 1 THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'message', 'Your cart has an invalid product or quantity.'
      );
    END IF;

    SELECT product.stock_quantity, product.status
      INTO current_stock, current_status
    FROM public.product_status AS product
    WHERE product.product_slug = item_slug
    FOR UPDATE;

    IF FOUND THEN
      IF current_status IN ('hidden', 'coming-soon', 'out-of-stock') THEN
        RETURN pg_catalog.jsonb_build_object(
          'success', false,
          'message', 'A product in your cart is no longer available. Please refresh your cart.'
        );
      END IF;

      IF current_stock IS NOT NULL AND current_stock < item_quantity THEN
        RETURN pg_catalog.jsonb_build_object(
          'success', false,
          'message', 'There is not enough stock for one of the products in your cart. Please update the quantity and try again.'
        );
      END IF;
    END IF;
  END LOOP;

  FOR item IN
    SELECT element
    FROM pg_catalog.jsonb_array_elements(p_items) AS items(element)
    ORDER BY element ->> 'product_slug'
  LOOP
    item_slug := item ->> 'product_slug';
    item_quantity := (item ->> 'quantity')::integer;

    UPDATE public.product_status AS product
    SET stock_quantity = product.stock_quantity - item_quantity,
        status = CASE
          WHEN product.stock_quantity - item_quantity = 0 THEN 'out-of-stock'
          ELSE product.status
        END
    WHERE product.product_slug = item_slug
      AND product.stock_quantity IS NOT NULL;
  END LOOP;

  INSERT INTO public.orders (
    user_id,
    customer_name,
    customer_email,
    phone,
    address,
    pincode,
    city,
    state,
    items,
    mrp_total,
    product_total,
    taxable_value,
    gst_total,
    cgst,
    sgst,
    igst,
    delivery_charge,
    total,
    payment_method,
    order_status,
    inventory_reserved,
    pending_expires_at
  )
  VALUES (
    NULLIF(p_order ->> 'user_id', '')::uuid,
    p_order ->> 'customer_name',
    p_order ->> 'customer_email',
    p_order ->> 'phone',
    p_order ->> 'address',
    p_order ->> 'pincode',
    p_order ->> 'city',
    p_order ->> 'state',
    p_order -> 'items',
    (p_order ->> 'mrp_total')::numeric,
    (p_order ->> 'product_total')::numeric,
    (p_order ->> 'taxable_value')::numeric,
    (p_order ->> 'gst_total')::numeric,
    (p_order ->> 'cgst')::numeric,
    (p_order ->> 'sgst')::numeric,
    (p_order ->> 'igst')::numeric,
    (p_order ->> 'delivery_charge')::numeric,
    (p_order ->> 'total')::numeric,
    'WhatsApp',
    'pending',
    true,
    pg_catalog.now() + interval '24 hours'
  )
  RETURNING id INTO created_order_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'order_id', created_order_id
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.sync_order_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  item jsonb;
  item_slug text;
  item_quantity integer;
  current_stock integer;
  current_status text;
BEGIN
  IF OLD.order_status IS NOT DISTINCT FROM NEW.order_status THEN
    RETURN NEW;
  END IF;

  IF NEW.order_status = 'pending' THEN
    IF NEW.pending_expires_at IS NULL
      OR NEW.pending_expires_at <= pg_catalog.now() THEN
      NEW.pending_expires_at := pg_catalog.now() + interval '24 hours';
    END IF;
  ELSE
    NEW.pending_expires_at := NULL;
  END IF;

  IF NEW.order_status = 'cancelled'
    AND OLD.order_status <> 'cancelled'
    AND OLD.inventory_reserved THEN
    FOR item IN
      SELECT element
      FROM pg_catalog.jsonb_array_elements(OLD.items) AS items(element)
      ORDER BY element ->> 'product_slug'
    LOOP
      item_slug := item ->> 'product_slug';
      item_quantity := NULLIF(item ->> 'quantity', '')::integer;

      UPDATE public.product_status AS product
      SET stock_quantity = product.stock_quantity + item_quantity,
          status = CASE
            WHEN product.status = 'out-of-stock'
              AND product.stock_quantity = 0
              THEN 'active'
            ELSE product.status
          END
      WHERE product.product_slug = item_slug
        AND product.stock_quantity IS NOT NULL;
    END LOOP;

    NEW.inventory_reserved := false;
  ELSIF OLD.order_status = 'cancelled'
    AND NEW.order_status <> 'cancelled'
    AND NOT OLD.inventory_reserved THEN
    FOR item IN
      SELECT element
      FROM pg_catalog.jsonb_array_elements(OLD.items) AS items(element)
      ORDER BY element ->> 'product_slug'
    LOOP
      item_slug := item ->> 'product_slug';
      item_quantity := NULLIF(item ->> 'quantity', '')::integer;

      SELECT product.stock_quantity, product.status
        INTO current_stock, current_status
      FROM public.product_status AS product
      WHERE product.product_slug = item_slug
      FOR UPDATE;

      IF FOUND AND current_stock IS NOT NULL
        AND (current_stock < item_quantity
          OR current_status IN ('hidden', 'coming-soon', 'out-of-stock')) THEN
        RAISE EXCEPTION 'Not enough stock to reopen this order'
          USING ERRCODE = 'P0001';
      END IF;
    END LOOP;

    FOR item IN
      SELECT element
      FROM pg_catalog.jsonb_array_elements(OLD.items) AS items(element)
      ORDER BY element ->> 'product_slug'
    LOOP
      item_slug := item ->> 'product_slug';
      item_quantity := NULLIF(item ->> 'quantity', '')::integer;

      UPDATE public.product_status AS product
      SET stock_quantity = product.stock_quantity - item_quantity,
          status = CASE
            WHEN product.stock_quantity - item_quantity = 0 THEN 'out-of-stock'
            ELSE product.status
          END
      WHERE product.product_slug = item_slug
        AND product.stock_quantity IS NOT NULL;
    END LOOP;

    NEW.inventory_reserved := true;
  END IF;

  RETURN NEW;
END;
$function$;

COMMIT;
