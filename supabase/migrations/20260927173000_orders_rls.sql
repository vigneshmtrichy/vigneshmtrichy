-- Restrict direct browser access to orders to the owning customer and the Tenoo admin.
-- Drop prior policies so an older permissive policy cannot bypass these rules:
-- PostgreSQL combines permissive policies with OR.
BEGIN;

DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'orders'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.orders',
      existing_policy.policyname
    );
  END LOOP;
END
$$;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_admin_all
  ON public.orders
  FOR ALL
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

CREATE POLICY orders_customer_read_own
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY orders_customer_insert_own
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND order_status = 'pending'
  );

-- Checkout supports guest orders; allow guests to submit, but not read or change orders.
CREATE POLICY orders_guest_insert
  ON public.orders
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND order_status = 'pending'
  );

COMMIT;
