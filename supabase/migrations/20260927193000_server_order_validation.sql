-- Route all order creation through the server so prices and totals cannot be client-supplied.
BEGIN;

DROP POLICY IF EXISTS "Allow guests and users to create orders"
  ON public.orders;

REVOKE INSERT ON TABLE public.orders FROM PUBLIC, anon, authenticated;

COMMIT;
