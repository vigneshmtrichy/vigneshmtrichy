-- Add admin-managed display name, featured order and badges.
BEGIN;

ALTER TABLE public.product_status
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS featured_priority integer,
  ADD COLUMN IF NOT EXISTS badges text[] DEFAULT NULL;

ALTER TABLE public.product_status
  ADD CONSTRAINT product_status_display_name_length
  CHECK (display_name IS NULL OR char_length(btrim(display_name)) BETWEEN 1 AND 120);

ALTER TABLE public.product_status
  ADD CONSTRAINT product_status_featured_priority_positive
  CHECK (featured_priority IS NULL OR featured_priority > 0);

ALTER TABLE public.product_status
  ADD CONSTRAINT product_status_badges_count
  CHECK (badges IS NULL OR cardinality(badges) <= 6);

COMMIT;
