-- Store editable selling prices for Tenoo products in the admin-managed product_status table.
BEGIN;

ALTER TABLE public.product_status
  ADD COLUMN mrp numeric(10,2),
  ADD COLUMN price numeric(10,2);

ALTER TABLE public.product_status
  ADD CONSTRAINT product_status_mrp_positive
  CHECK (mrp IS NULL OR mrp > 0);

ALTER TABLE public.product_status
  ADD CONSTRAINT product_status_price_positive
  CHECK (price IS NULL OR price > 0);

ALTER TABLE public.product_status
  ADD CONSTRAINT product_status_price_not_above_mrp
  CHECK (
    price IS NULL
    OR mrp IS NULL
    OR price <= mrp
  );

UPDATE public.product_status AS ps
SET
  mrp = values.mrp,
  price = values.price
FROM (
  VALUES
    ('millet-abc', 429.00, 365.00),
    ('pink-abc', 449.00, 375.00),
    ('black-rice-milk-mix', 455.00, 379.00),
    ('cotton-milk-mix', 399.00, 349.00),
    ('nutaura', 699.00, 599.00),
    ('pirandai-rice-mix', 339.00, 289.00),
    ('mudavattu-kilangu-rice-mix', 459.00, 399.00),
    ('mudavaattu-kizhangu-soup-mix', 429.00, 379.00)
) AS values(product_slug, mrp, price)
WHERE ps.product_slug = values.product_slug;

INSERT INTO public.product_status (
  product_slug,
  mrp,
  price,
  status,
  updated_at
)
SELECT
  values.product_slug,
  values.mrp,
  values.price,
  'active',
  pg_catalog.now()
FROM (
  VALUES
    ('millet-abc', 429.00, 365.00),
    ('pink-abc', 449.00, 375.00),
    ('black-rice-milk-mix', 455.00, 379.00),
    ('cotton-milk-mix', 399.00, 349.00),
    ('nutaura', 699.00, 599.00),
    ('pirandai-rice-mix', 339.00, 289.00),
    ('mudavattu-kilangu-rice-mix', 459.00, 399.00),
    ('mudavaattu-kizhangu-soup-mix', 429.00, 379.00)
) AS values(product_slug, mrp, price)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.product_status AS existing
  WHERE existing.product_slug = values.product_slug
);

COMMIT;
