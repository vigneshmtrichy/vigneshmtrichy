-- Tenoo business expense / purchase bill ledger for quarterly GST tracking.
BEGIN;

CREATE TABLE public.business_expenses (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  invoice_number text,
  invoice_date date NOT NULL,
  supplier_name text NOT NULL CHECK (char_length(btrim(supplier_name)) BETWEEN 1 AND 200),
  supplier_gstin text,
  category text NOT NULL DEFAULT 'Other' CHECK (category IN ('Designing','Packaging','Raw Material','Courier','Software','Marketing','Other')),
  taxable_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (taxable_amount >= 0),
  cgst numeric(14,2) NOT NULL DEFAULT 0 CHECK (cgst >= 0),
  sgst numeric(14,2) NOT NULL DEFAULT 0 CHECK (sgst >= 0),
  igst numeric(14,2) NOT NULL DEFAULT 0 CHECK (igst >= 0),
  total_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  itc_status text NOT NULL DEFAULT 'Pending' CHECK (itc_status IN ('Pending','Yes','No')),
  gstr2b_status text NOT NULL DEFAULT 'Not checked' CHECK (gstr2b_status IN ('Not checked','Matched','Not reflected','Mismatch')),
  payment_status text NOT NULL DEFAULT 'Paid' CHECK (payment_status IN ('Paid','Pending')),
  payment_date date,
  payment_mode text CHECK (payment_mode IS NULL OR payment_mode IN ('UPI','Bank transfer','Cash','Card','Cheque','Other')),
  invoice_file_path text,
  invoice_file_name text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX business_expenses_invoice_date_idx ON public.business_expenses(invoice_date DESC);
CREATE INDEX business_expenses_supplier_idx ON public.business_expenses(lower(supplier_name));
CREATE INDEX business_expenses_gstr2b_idx ON public.business_expenses(gstr2b_status);

CREATE OR REPLACE FUNCTION public.set_business_expense_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE TRIGGER business_expenses_updated_at
BEFORE UPDATE ON public.business_expenses
FOR EACH ROW EXECUTE FUNCTION public.set_business_expense_updated_at();

ALTER TABLE public.business_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY business_expenses_admin_all ON public.business_expenses
FOR ALL TO authenticated
USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('business-bills','business-bills',false,10485760,ARRAY['application/pdf','image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public=false,
  file_size_limit=10485760,
  allowed_mime_types=ARRAY['application/pdf','image/jpeg','image/png','image/webp'];

CREATE POLICY business_bills_admin_select ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id='business-bills' AND (SELECT auth.jwt() ->> 'email')='info@tenoo.in');

CREATE POLICY business_bills_admin_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id='business-bills' AND (SELECT auth.jwt() ->> 'email')='info@tenoo.in');

CREATE POLICY business_bills_admin_update ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id='business-bills' AND (SELECT auth.jwt() ->> 'email')='info@tenoo.in')
WITH CHECK (bucket_id='business-bills' AND (SELECT auth.jwt() ->> 'email')='info@tenoo.in');

CREATE POLICY business_bills_admin_delete ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id='business-bills' AND (SELECT auth.jwt() ->> 'email')='info@tenoo.in');

COMMIT;