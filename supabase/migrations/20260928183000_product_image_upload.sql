-- Add admin-managed primary product image storage.
BEGIN;

ALTER TABLE public.product_status
  ADD COLUMN IF NOT EXISTS image_url text;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text primary key,
  name text not null,
  owner uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  public boolean not null default false,
  avif_autodetection boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can upload product images'
  ) THEN
    CREATE POLICY "Admins can upload product images"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'product-images'
        AND (auth.jwt() ->> 'email') = 'info@tenoo.in'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can update product images'
  ) THEN
    CREATE POLICY "Admins can update product images"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'product-images'
        AND (auth.jwt() ->> 'email') = 'info@tenoo.in'
      )
      WITH CHECK (
        bucket_id = 'product-images'
        AND (auth.jwt() ->> 'email') = 'info@tenoo.in'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Admins can delete product images'
  ) THEN
    CREATE POLICY "Admins can delete product images"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'product-images'
        AND (auth.jwt() ->> 'email') = 'info@tenoo.in'
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anyone can view product images'
  ) THEN
    CREATE POLICY "Anyone can view product images"
      ON storage.objects
      FOR SELECT
      TO anon, authenticated
      USING (bucket_id = 'product-images');
  END IF;
END
$$;

COMMIT;
