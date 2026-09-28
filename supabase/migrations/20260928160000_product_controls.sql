-- Add admin-managed product controls beyond pricing.
BEGIN;

ALTER TABLE public.product_status
  ADD COLUMN IF NOT EXISTS retailer_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS offer_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS offer_label text,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shipping_weight_kg numeric(10,3);

ALTER TABLE public.product_status
  ADD CONSTRAINT product_status_retailer_price_positive
  CHECK (retailer_price IS NULL OR retailer_price > 0);

ALTER TABLE public.product_status
  ADD CONSTRAINT product_status_shipping_weight_positive
  CHECK (shipping_weight_kg IS NULL OR shipping_weight_kg > 0);

ALTER TABLE public.product_status
  ADD CONSTRAINT product_status_offer_label_length
  CHECK (offer_label IS NULL OR char_length(offer_label) <= 80);

UPDATE public.product_status
SET
  offer_enabled = CASE
    WHEN price IS NOT NULL
      AND mrp IS NOT NULL
      AND price < mrp
    THEN true
    ELSE false
  END,
  shipping_weight_kg = CASE product_slug
    WHEN 'mudavaattu-kizhangu-soup-mix' THEN 0.250
    ELSE 0.300
  END
WHERE product_slug IN (
  'millet-abc',
  'pink-abc',
  'black-rice-milk-mix',
  'cotton-milk-mix',
  'nutaura',
  'pirandai-rice-mix',
  'mudavattu-kilangu-rice-mix',
  'mudavaattu-kizhangu-soup-mix'
);

COMMIT;
