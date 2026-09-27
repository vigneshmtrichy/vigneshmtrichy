-- Preserve public storefront reads while limiting product status writes to the Tenoo admin.
BEGIN;

-- Remove overlapping legacy policies so permissive policies cannot grant broad writes.
DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'product_status'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.product_status',
      existing_policy.policyname
    );
  END LOOP;
END
$$;

ALTER TABLE public.product_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY product_status_public_read
  ON public.product_status
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY product_status_admin_insert
  ON public.product_status
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

CREATE POLICY product_status_admin_update
  ON public.product_status
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

COMMIT;
