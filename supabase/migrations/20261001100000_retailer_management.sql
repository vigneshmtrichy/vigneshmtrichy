-- Retailer accounts, trade orders, price overrides and payment ledger.
BEGIN;

CREATE TABLE public.retailers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL CHECK (char_length(btrim(business_name)) BETWEEN 1 AND 160),
  contact_name text,
  phone text NOT NULL CHECK (char_length(btrim(phone)) BETWEEN 6 AND 20),
  whatsapp text,
  email text,
  gstin text,
  billing_name text,
  address text,
  city text,
  state text,
  pincode text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('prospect', 'active', 'on-hold', 'inactive')),
  payment_terms_days integer NOT NULL DEFAULT 0 CHECK (payment_terms_days BETWEEN 0 AND 120),
  credit_limit numeric(12,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.retailer_product_prices (
  retailer_id uuid NOT NULL REFERENCES public.retailers(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  unit_price numeric(10,2) NOT NULL CHECK (unit_price > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (retailer_id, product_slug)
);

CREATE TABLE public.retailer_orders (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  retailer_id uuid NOT NULL REFERENCES public.retailers(id),
  order_status text NOT NULL DEFAULT 'confirmed' CHECK (order_status IN ('draft', 'confirmed', 'packing', 'dispatched', 'delivered', 'cancelled')),
  payment_type text NOT NULL DEFAULT 'credit' CHECK (payment_type IN ('prepaid', 'credit', 'partial', 'cod')),
  payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  due_date date,
  subtotal numeric(12,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  taxable_value numeric(12,2) NOT NULL DEFAULT 0 CHECK (taxable_value >= 0),
  gst_total numeric(12,2) NOT NULL DEFAULT 0 CHECK (gst_total >= 0),
  total numeric(12,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  inventory_reserved boolean NOT NULL DEFAULT true,
  courier_name text,
  tracking_number text,
  dispatch_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.retailer_order_items (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  retailer_order_id bigint NOT NULL REFERENCES public.retailer_orders(id) ON DELETE CASCADE,
  product_slug text NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(10,2) NOT NULL CHECK (unit_price > 0),
  gst_rate numeric(5,2) NOT NULL DEFAULT 5 CHECK (gst_rate BETWEEN 0 AND 100),
  line_total numeric(12,2) NOT NULL CHECK (line_total >= 0)
);

CREATE TABLE public.retailer_payments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  retailer_id uuid NOT NULL REFERENCES public.retailers(id),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL DEFAULT current_date,
  payment_method text NOT NULL DEFAULT 'bank-transfer' CHECK (payment_method IN ('cash', 'upi', 'bank-transfer', 'cheque', 'other')),
  reference text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.retailer_payment_allocations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  retailer_payment_id bigint NOT NULL REFERENCES public.retailer_payments(id) ON DELETE CASCADE,
  retailer_order_id bigint NOT NULL REFERENCES public.retailer_orders(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  UNIQUE (retailer_payment_id, retailer_order_id)
);

CREATE INDEX retailer_orders_retailer_created_idx ON public.retailer_orders(retailer_id, created_at DESC);
CREATE INDEX retailer_orders_due_date_idx ON public.retailer_orders(due_date) WHERE order_status <> 'cancelled';
CREATE INDEX retailer_payments_retailer_date_idx ON public.retailer_payments(retailer_id, payment_date DESC);

CREATE OR REPLACE VIEW public.retailer_balances
WITH (security_invoker = true)
AS
SELECT
  r.id AS retailer_id,
  COALESCE(SUM(o.total) FILTER (WHERE o.order_status <> 'cancelled'), 0) AS invoiced_total,
  COALESCE((SELECT SUM(p.amount) FROM public.retailer_payments p WHERE p.retailer_id = r.id), 0) AS paid_total,
  COALESCE(SUM(o.total) FILTER (WHERE o.order_status <> 'cancelled'), 0)
    - COALESCE((SELECT SUM(p.amount) FROM public.retailer_payments p WHERE p.retailer_id = r.id), 0) AS outstanding_balance
FROM public.retailers r
LEFT JOIN public.retailer_orders o ON o.retailer_id = r.id
GROUP BY r.id;

CREATE OR REPLACE FUNCTION public.create_retailer_order_with_stock(
  p_retailer_id uuid,
  p_items jsonb,
  p_payment_type text DEFAULT 'credit',
  p_due_date date DEFAULT NULL,
  p_notes text DEFAULT NULL
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
  gross_total numeric := 0;
  taxable_total numeric := 0;
  gst_total_value numeric := 0;
  payment_days integer;
  credit_limit_value numeric;
  existing_outstanding numeric;
BEGIN
  IF (SELECT auth.jwt() ->> 'email') <> 'info@tenoo.in' THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.retailers WHERE id = p_retailer_id AND status = 'active') THEN
    RAISE EXCEPTION 'Retailer is not active' USING ERRCODE = 'P0001';
  END IF;
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'At least one product is required' USING ERRCODE = 'P0001';
  END IF;

  SELECT payment_terms_days, credit_limit INTO payment_days, credit_limit_value FROM public.retailers WHERE id = p_retailer_id;

  INSERT INTO public.retailer_orders (retailer_id, payment_type, due_date, notes)
  VALUES (
    p_retailer_id,
    CASE WHEN p_payment_type IN ('prepaid', 'credit', 'partial', 'cod') THEN p_payment_type ELSE 'credit' END,
    COALESCE(p_due_date, CASE WHEN payment_days > 0 THEN current_date + payment_days ELSE NULL END),
    NULLIF(btrim(COALESCE(p_notes, '')), '')
  ) RETURNING id INTO order_id;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    item_slug := item ->> 'product_slug';
    item_quantity := NULLIF(item ->> 'quantity', '')::integer;
    IF item_slug IS NULL OR item_quantity IS NULL OR item_quantity < 1 THEN
      RAISE EXCEPTION 'Invalid product or quantity' USING ERRCODE = 'P0001';
    END IF;

    SELECT ps.stock_quantity, ps.status, COALESCE(rpp.unit_price, ps.retailer_price, ps.price), COALESCE(ps.display_name, ps.product_slug)
      INTO current_stock, current_status, item_price, item_name
    FROM public.product_status ps
    LEFT JOIN public.retailer_product_prices rpp
      ON rpp.retailer_id = p_retailer_id AND rpp.product_slug = ps.product_slug
    WHERE ps.product_slug = item_slug
    FOR UPDATE OF ps;

    IF NOT FOUND OR item_price IS NULL OR item_price <= 0 OR current_status IN ('hidden', 'coming-soon', 'out-of-stock') THEN
      RAISE EXCEPTION 'Product % is unavailable for retailer ordering', item_slug USING ERRCODE = 'P0001';
    END IF;
    IF current_stock IS NOT NULL AND current_stock < item_quantity THEN
      RAISE EXCEPTION 'Not enough stock for %', item_slug USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.product_status
    SET stock_quantity = stock_quantity - item_quantity,
        status = CASE WHEN stock_quantity - item_quantity = 0 THEN 'out-of-stock' ELSE status END
    WHERE product_slug = item_slug AND stock_quantity IS NOT NULL;

    INSERT INTO public.retailer_order_items (retailer_order_id, product_slug, product_name, quantity, unit_price, gst_rate, line_total)
    VALUES (order_id, item_slug, item_name, item_quantity, item_price, 5, round(item_price * item_quantity, 2));

    gross_total := gross_total + item_price * item_quantity;
    taxable_total := taxable_total + (item_price * item_quantity) / 1.05;
  END LOOP;

  gst_total_value := gross_total - taxable_total;

  IF p_payment_type IN ('credit', 'partial') AND credit_limit_value > 0 THEN
    SELECT
      COALESCE(SUM(total) FILTER (WHERE order_status <> 'cancelled'), 0)
      - COALESCE((SELECT SUM(amount) FROM public.retailer_payments WHERE retailer_id = p_retailer_id), 0)
    INTO existing_outstanding
    FROM public.retailer_orders
    WHERE retailer_id = p_retailer_id;

    IF existing_outstanding + gross_total > credit_limit_value THEN
      RAISE EXCEPTION 'Credit limit exceeded for this retailer' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  UPDATE public.retailer_orders
  SET subtotal = round(gross_total, 2), taxable_value = round(taxable_total, 2), gst_total = round(gst_total_value, 2), total = round(gross_total, 2)
  WHERE id = order_id;

  RETURN jsonb_build_object('success', true, 'order_id', order_id);
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
  IF OLD.order_status IS NOT DISTINCT FROM NEW.order_status THEN RETURN NEW; END IF;
  IF OLD.order_status = 'cancelled' AND NEW.order_status <> 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled retailer orders cannot be reopened; create a new order instead' USING ERRCODE = 'P0001';
  END IF;
  IF NEW.order_status = 'cancelled' AND OLD.order_status <> 'cancelled' AND OLD.inventory_reserved THEN
    FOR item IN SELECT product_slug, quantity FROM public.retailer_order_items WHERE retailer_order_id = OLD.id LOOP
      UPDATE public.product_status
      SET stock_quantity = stock_quantity + item.quantity,
          status = CASE WHEN status = 'out-of-stock' AND stock_quantity = 0 THEN 'active' ELSE status END
      WHERE product_slug = item.product_slug AND stock_quantity IS NOT NULL;
    END LOOP;
    NEW.inventory_reserved := false;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER retailer_orders_sync_inventory_status
  BEFORE UPDATE OF order_status ON public.retailer_orders
  FOR EACH ROW EXECUTE FUNCTION public.sync_retailer_order_inventory();

ALTER TABLE public.retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retailer_payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY retailers_admin_all ON public.retailers FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');
CREATE POLICY retailer_prices_admin_all ON public.retailer_product_prices FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');
CREATE POLICY retailer_orders_admin_all ON public.retailer_orders FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');
CREATE POLICY retailer_order_items_admin_all ON public.retailer_order_items FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');
CREATE POLICY retailer_payments_admin_all ON public.retailer_payments FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');
CREATE POLICY retailer_payment_allocations_admin_all ON public.retailer_payment_allocations FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

REVOKE ALL ON FUNCTION public.create_retailer_order_with_stock(uuid, jsonb, text, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_retailer_order_with_stock(uuid, jsonb, text, date, text) TO authenticated;

COMMIT;
