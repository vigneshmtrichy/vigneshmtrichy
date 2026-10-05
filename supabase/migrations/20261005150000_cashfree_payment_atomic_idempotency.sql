BEGIN;

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
  qty integer;
  stock integer;
  current_status text;
  created_id bigint;
BEGIN
  SELECT *
  INTO intent
  FROM public.cashfree_payment_intents
  WHERE id = p_payment_intent_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'message', 'Payment intent not found.'
    );
  END IF;

  -- Idempotency guard: a concurrent webhook/return verification that reaches
  -- this function after the first transaction commits gets the existing order.
  IF intent.order_id IS NOT NULL THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', true,
      'order_id', intent.order_id
    );
  END IF;

  IF intent.status <> 'pending' THEN
    RETURN pg_catalog.jsonb_build_object(
      'success', false,
      'message', 'Payment intent is not pending.'
    );
  END IF;

  -- Lock every product row before checking or changing stock.
  FOR item IN
    SELECT element
    FROM pg_catalog.jsonb_array_elements(intent.items) AS items(element)
    ORDER BY element ->> 'product_slug'
  LOOP
    slug := item ->> 'product_slug';
    qty := NULLIF(item ->> 'quantity', '')::integer;

    SELECT p.stock_quantity, p.status
    INTO stock, current_status
    FROM public.product_status p
    WHERE p.product_slug = slug
    FOR UPDATE;

    IF FOUND AND current_status IN ('hidden', 'coming-soon', 'out-of-stock') THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'message', 'A product in this order is no longer available.'
      );
    END IF;

    IF FOUND AND stock IS NOT NULL AND stock < qty THEN
      RETURN pg_catalog.jsonb_build_object(
        'success', false,
        'message', 'There is not enough stock to fulfil this paid order.'
      );
    END IF;
  END LOOP;

  -- Reserve/decrement stock exactly once, inside this transaction.
  FOR item IN
    SELECT element
    FROM pg_catalog.jsonb_array_elements(intent.items) AS items(element)
    ORDER BY element ->> 'product_slug'
  LOOP
    slug := item ->> 'product_slug';
    qty := (item ->> 'quantity')::integer;

    UPDATE public.product_status p
    SET stock_quantity = p.stock_quantity - qty,
        status = CASE
          WHEN p.stock_quantity - qty = 0 THEN 'out-of-stock'
          ELSE p.status
        END
    WHERE p.product_slug = slug
      AND p.stock_quantity IS NOT NULL;
  END LOOP;

  INSERT INTO public.orders (
    user_id, customer_name, customer_email, phone, address, pincode, city, state,
    items, mrp_total, product_total, taxable_value, gst_total, cgst, sgst, igst,
    delivery_charge, total, payment_method, order_status, inventory_reserved, pending_expires_at
  )
  VALUES (
    intent.user_id, intent.customer_name, intent.customer_email, intent.phone,
    intent.address, intent.pincode, intent.city, intent.state, intent.items,
    intent.mrp_total, intent.product_total, intent.taxable_value, intent.gst_total,
    intent.cgst, intent.sgst, intent.igst, intent.delivery_charge, intent.total,
    'Cashfree', 'confirmed', true, NULL
  )
  RETURNING id INTO created_id;

  -- Critical: mark the payment intent as consumed in the SAME transaction
  -- as order creation and stock deduction.
  UPDATE public.cashfree_payment_intents
  SET status = 'paid',
      order_id = created_id,
      cashfree_payment_id = COALESCE(p_cashfree_payment_id, cashfree_payment_id),
      cashfree_payment_status = COALESCE(p_cashfree_payment_status, cashfree_payment_status),
      updated_at = pg_catalog.now()
  WHERE id = intent.id;

  RETURN pg_catalog.jsonb_build_object(
    'success', true,
    'order_id', created_id
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.create_paid_order_with_stock(bigint) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_paid_order_with_stock(bigint, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_paid_order_with_stock(bigint, text, text) TO service_role;

COMMIT;
