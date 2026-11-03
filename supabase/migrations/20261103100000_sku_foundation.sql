-- Tenoo SKU foundation: one existing product_slug remains the parent product key.
-- This additive migration does not rewrite historical orders or existing stock balances.
BEGIN;

CREATE TABLE IF NOT EXISTS public.product_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL REFERENCES public.product_status(product_slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  sku_code text NOT NULL UNIQUE CHECK (char_length(btrim(sku_code)) BETWEEN 3 AND 64),
  barcode text UNIQUE CHECK (barcode IS NULL OR barcode ~ '^[0-9]{8,14}$'),
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
