-- Add managed inventory counts and reserve stock atomically when orders are submitted.
BEGIN;

ALTER TABLE public.product_status
  ADD COLUMN stock_quantity integer
  CONSTRAINT product_status_stock_quantity_nonnegative
  CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

-- NULL means inventory has not been set for a product yet.
ALTER TABLE public.orders
  ADD COLUMN inventory_reserved boolean NOT NULL DEFAULT false;

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

  -- Lock tracked product rows in a stable order so concurrent orders cannot oversell.
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

  -- Only products with a configured quantity are inventory-tracked.
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
    inventory_reserved
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
    true
  )
  RETURNING id INTO created_order_id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'order_id', created_order_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.create_order_with_stock(jsonb, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_order_with_stock(jsonb, jsonb)
  TO service_role;

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
    -- Re-opening a cancelled order must reserve its stock again.
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

CREATE TRIGGER orders_sync_inventory_status
  BEFORE UPDATE OF order_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_order_inventory();

REVOKE ALL ON FUNCTION public.sync_order_inventory()
  FROM PUBLIC, anon, authenticated;

COMMIT;
