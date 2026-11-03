-- Tenoo SKU foundation: one existing product_slug remains the parent product key.
-- This additive migration does not rewrite historical orders or existing stock balances.
BEGIN;

CREATE TABLE IF NOT EXISTS public.product_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES public.product_status(product_slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  sku_code text NOT NULL UNIQUE CHECK (char_length(btrim(sku_code)) BETWEEN 3 AND 64),
  barcode text UNIQUE CHECK (barcode IS NULL OR barcode ~ '^(\\d{8}|\\d{12}|\\d{13}|\\d{14})
  pack_size_value numeric(10,3) NOT NULL CHECK (pack_size_value > 0),
  pack_size_unit text NOT NULL CHECK (pack_size_unit IN ('g', 'kg', 'ml', 'l', 'unit')),
  mrp numeric(10,2) NOT NULL CHECK (mrp > 0),
  online_price numeric(10,2) NOT NULL CHECK (online_price > 0 AND online_price <= mrp),
  retailer_price numeric(10,2) CHECK (retailer_price IS NULL OR retailer_price > 0),
  gst_rate numeric(5,2) NOT NULL DEFAULT 5 CHECK (gst_rate IN (0, 5, 12, 18, 28)),
  shipping_weight_kg numeric(10,3) CHECK (shipping_weight_kg IS NULL OR shipping_weight_kg > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_slug, pack_size_value, pack_size_unit)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_skus_one_default_per_product
  ON public.product_skus(product_slug) WHERE is_default;

CREATE INDEX IF NOT EXISTS product_skus_product_slug_idx
  ON public.product_skus(product_slug);

CREATE UNIQUE INDEX IF NOT EXISTS product_skus_code_ci_unique
  ON public.product_skus (pg_catalog.lower(sku_code));

CREATE TABLE IF NOT EXISTS public.sku_inventory (
  sku_id uuid PRIMARY KEY REFERENCES public.product_skus(id) ON DELETE RESTRICT,
  stock_quantity integer CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  reorder_level integer NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sku_stock_movements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku_id uuid NOT NULL REFERENCES public.product_skus(id) ON DELETE RESTRICT,
  movement_type text NOT NULL CHECK (movement_type IN ('opening', 'stock_in', 'sale', 'retailer_sale', 'return', 'adjustment', 'transfer')),
  quantity_delta integer NOT NULL CHECK (quantity_delta <> 0),
  reference_type text,
  reference_id text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sku_stock_movements_sku_created_idx
  ON public.sku_stock_movements(sku_id, created_at DESC);

ALTER TABLE public.product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_skus_admin_all ON public.product_skus
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

CREATE POLICY sku_inventory_admin_all ON public.sku_inventory
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

CREATE POLICY sku_stock_movements_admin_all ON public.sku_stock_movements
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

GRANT SELECT, INSERT, UPDATE ON public.product_skus TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sku_inventory TO authenticated;
GRANT SELECT, INSERT ON public.sku_stock_movements TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.sku_stock_movements_id_seq TO authenticated;

COMMENT ON TABLE public.product_skus IS
  'Child SKUs for an existing Tenoo parent product; product_slug preserves the existing catalogue identity.';
COMMENT ON TABLE public.sku_inventory IS
  'SKU-specific stock balances; legacy product_status stock remains authoritative until order flows are migrated.';
COMMENT ON TABLE public.sku_stock_movements IS
  'Append-only audit history for SKU inventory changes.';

-- Keep modification timestamps current for admin-managed SKU records.
CREATE OR REPLACE FUNCTION public.set_sku_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER product_skus_set_updated_at
  BEFORE UPDATE ON public.product_skus
  FOR EACH ROW EXECUTE FUNCTION public.set_sku_updated_at();

CREATE TRIGGER sku_inventory_set_updated_at
  BEFORE UPDATE ON public.sku_inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_sku_updated_at();

-- All manual quantity changes pass through this function so the movement
-- ledger receives an opening or adjustment record in the same transaction.
CREATE OR REPLACE FUNCTION public.tenoo_admin_set_sku_stock(
  p_sku_id uuid,
  p_stock_quantity integer,
  p_reorder_level integer DEFAULT 10,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  current_stock integer;
  movement_delta integer;
  movement_type text;
BEGIN
  IF (SELECT auth.jwt() ->> 'email') IS DISTINCT FROM 'info@tenoo.in' THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  IF p_stock_quantity IS NOT NULL AND p_stock_quantity < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative' USING ERRCODE = 'P0001';
  END IF;

  IF p_reorder_level IS NULL OR p_reorder_level < 0 THEN
    RAISE EXCEPTION 'Reorder level must be zero or greater' USING ERRCODE = 'P0001';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.product_skus WHERE id = p_sku_id) THEN
    RAISE EXCEPTION 'SKU not found' USING ERRCODE = 'P0001';
  END IF;

  SELECT stock_quantity
    INTO current_stock
  FROM public.sku_inventory
  WHERE sku_id = p_sku_id
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.sku_inventory(sku_id, stock_quantity, reorder_level)
    VALUES (p_sku_id, p_stock_quantity, p_reorder_level);

    IF p_stock_quantity IS NOT NULL AND p_stock_quantity > 0 THEN
      INSERT INTO public.sku_stock_movements(sku_id, movement_type, quantity_delta, notes, created_by)
      VALUES (p_sku_id, 'opening', p_stock_quantity,
        COALESCE(NULLIF(pg_catalog.btrim(p_notes), ''), 'Opening stock'), auth.uid());
    END IF;
  ELSE
    IF current_stock IS NULL AND p_stock_quantity IS NOT NULL THEN
      movement_type := 'opening';
      movement_delta := p_stock_quantity;
    ELSIF current_stock IS NOT NULL AND p_stock_quantity IS NOT NULL THEN
      movement_delta := p_stock_quantity - current_stock;
      movement_type := 'adjustment';
    ELSE
      movement_delta := NULL;
    END IF;

    UPDATE public.sku_inventory
    SET stock_quantity = p_stock_quantity,
        reorder_level = p_reorder_level
    WHERE sku_id = p_sku_id;

    IF movement_delta IS NOT NULL AND movement_delta <> 0 THEN
      INSERT INTO public.sku_stock_movements(sku_id, movement_type, quantity_delta, notes, created_by)
      VALUES (p_sku_id, movement_type, movement_delta,
        COALESCE(NULLIF(pg_catalog.btrim(p_notes), ''), 'Admin stock adjustment'), auth.uid());
    END IF;
  END IF;

  RETURN pg_catalog.jsonb_build_object('success', true);
END;
$function$;

REVOKE ALL ON FUNCTION public.tenoo_admin_set_sku_stock(uuid, integer, integer, text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tenoo_admin_set_sku_stock(uuid, integer, integer, text)
  TO authenticated;

COMMIT;
),
  pack_size_value numeric(10,3) NOT NULL CHECK (pack_size_value > 0),
  pack_size_unit text NOT NULL CHECK (pack_size_unit IN ('g', 'kg', 'ml', 'l', 'unit')),
  mrp numeric(10,2) NOT NULL CHECK (mrp > 0),
  online_price numeric(10,2) NOT NULL CHECK (online_price > 0 AND online_price <= mrp),
  retailer_price numeric(10,2) CHECK (retailer_price IS NULL OR retailer_price > 0),
  gst_rate numeric(5,2) NOT NULL DEFAULT 5 CHECK (gst_rate IN (0, 5, 12, 18, 28)),
  shipping_weight_kg numeric(10,3) CHECK (shipping_weight_kg IS NULL OR shipping_weight_kg > 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_slug, pack_size_value, pack_size_unit)
);

CREATE UNIQUE INDEX IF NOT EXISTS product_skus_one_default_per_product
  ON public.product_skus(product_slug) WHERE is_default;

CREATE INDEX IF NOT EXISTS product_skus_product_slug_idx
  ON public.product_skus(product_slug);

CREATE TABLE IF NOT EXISTS public.sku_inventory (
  sku_id uuid PRIMARY KEY REFERENCES public.product_skus(id) ON DELETE RESTRICT,
  stock_quantity integer CHECK (stock_quantity IS NULL OR stock_quantity >= 0),
  reorder_level integer NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sku_stock_movements (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sku_id uuid NOT NULL REFERENCES public.product_skus(id) ON DELETE RESTRICT,
  movement_type text NOT NULL CHECK (movement_type IN ('opening', 'stock_in', 'sale', 'retailer_sale', 'return', 'adjustment', 'transfer')),
  quantity_delta integer NOT NULL CHECK (quantity_delta <> 0),
  reference_type text,
  reference_id text,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sku_stock_movements_sku_created_idx
  ON public.sku_stock_movements(sku_id, created_at DESC);

ALTER TABLE public.product_skus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_skus_admin_all ON public.product_skus
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

CREATE POLICY sku_inventory_admin_all ON public.sku_inventory
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

CREATE POLICY sku_stock_movements_admin_all ON public.sku_stock_movements
  FOR ALL TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

GRANT SELECT, INSERT, UPDATE ON public.product_skus TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.sku_inventory TO authenticated;
GRANT SELECT, INSERT ON public.sku_stock_movements TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.sku_stock_movements_id_seq TO authenticated;

COMMENT ON TABLE public.product_skus IS
  'Child SKUs for an existing Tenoo parent product; product_slug preserves the existing catalogue identity.';
COMMENT ON TABLE public.sku_inventory IS
  'SKU-specific stock balances; legacy product_status stock remains authoritative until order flows are migrated.';
COMMENT ON TABLE public.sku_stock_movements IS
  'Append-only audit history for SKU inventory changes.';

COMMIT;
