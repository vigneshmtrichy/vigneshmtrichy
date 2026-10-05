-- Harden customer order/profile access and make admin access database-enforced.
BEGIN;

-- Orders:
-- Customers may only read their own authenticated orders.
-- The Tenoo admin may read and update all orders.
-- Order creation remains server-only via the existing service-role RPC.
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

CREATE POLICY orders_customer_select
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY orders_admin_select
  ON public.orders
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

CREATE POLICY orders_admin_update
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

REVOKE INSERT, UPDATE, DELETE ON TABLE public.orders FROM anon;
REVOKE INSERT ON TABLE public.orders FROM authenticated;

-- Customer profiles:
-- A signed-in customer can only read/create/update their own profile.
DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'customer_profiles'
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.customer_profiles',
      existing_policy.policyname
    );
  END LOOP;
END
$$;

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY customer_profiles_own_select
  ON public.customer_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY customer_profiles_own_insert
  ON public.customer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY customer_profiles_own_update
  ON public.customer_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.customer_profiles FROM anon;

COMMIT;
