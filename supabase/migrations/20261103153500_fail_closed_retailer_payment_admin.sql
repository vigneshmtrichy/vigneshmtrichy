DO $migration$
DECLARE definition text;
BEGIN
  SELECT pg_catalog.pg_get_functiondef('public.record_retailer_payment(uuid,numeric,text,text,text)'::regprocedure)
  INTO definition;
  definition := pg_catalog.replace(
    definition,
    $old$IF (SELECT auth.jwt() ->> 'email') <> 'info@tenoo.in' THEN$old$,
    $new$IF (SELECT auth.jwt() ->> 'email') IS DISTINCT FROM 'info@tenoo.in' THEN$new$
  );
  EXECUTE definition;
END;
$migration$;
ALTER FUNCTION public.set_business_expense_updated_at() SET search_path = '';
ALTER FUNCTION public.set_gst_reporting_updated_at() SET search_path = '';