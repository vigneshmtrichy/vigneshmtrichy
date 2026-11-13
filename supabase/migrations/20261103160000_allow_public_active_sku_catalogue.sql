-- Allow storefront visitors to read only the public fields of active SKUs.
-- Inventory, retailer pricing, barcode and internal audit fields remain private.
BEGIN;

DROP POLICY IF EXISTS product_skus_public_active_select ON public.product_skus;
CREATE POLICY product_skus_public_active_select
  ON public.product_skus
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Do not expose the whole SKU row to anonymous clients.
REVOKE ALL ON TABLE public.product_skus FROM anon;
GRANT SELECT (
  id,
  product_slug,
  sku_code,
  pack_size_value,
  pack_size_unit,
  mrp,
  online_price,
  gst_rate,
  shipping_weight_kg,
  is_default,
  status
) ON TABLE public.product_skus TO anon;

COMMIT;
