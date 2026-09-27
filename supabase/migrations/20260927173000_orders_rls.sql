-- Keep guest checkout while preventing clients from inserting orders for other users
-- or setting an initial status other than pending.
BEGIN;

ALTER POLICY "Allow guests and users to create orders"
  ON public.orders
  WITH CHECK (
    (
      auth.role() = 'anon'
      AND user_id IS NULL
      AND order_status = 'pending'
    )
    OR
    (
      auth.role() = 'authenticated'
      AND user_id = (SELECT auth.uid())
      AND order_status = 'pending'
    )
  );

COMMIT;
