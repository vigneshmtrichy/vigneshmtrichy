-- Support up to five admin-managed product gallery images.
BEGIN;

ALTER TABLE public.product_status
  ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT NULL;

ALTER TABLE public.product_status
  ADD CONSTRAINT product_status_image_urls_count
  CHECK (image_urls IS NULL OR cardinality(image_urls) <= 5);

UPDATE public.product_status
SET image_urls = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND (image_urls IS NULL OR cardinality(image_urls) = 0);

COMMIT;
