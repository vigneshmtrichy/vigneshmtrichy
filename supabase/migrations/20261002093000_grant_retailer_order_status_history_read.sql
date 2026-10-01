-- Allow the admin dashboard to read retailer order status history through PostgREST.
-- The existing RLS policy remains admin-only.
grant usage on schema public to authenticated;
grant select on public.retailer_order_status_history to authenticated;

notify pgrst, 'reload schema';
