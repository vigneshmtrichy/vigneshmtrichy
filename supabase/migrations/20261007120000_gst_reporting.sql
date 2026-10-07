-- GST reporting master, credit/debit notes and quarterly closing checklist.
BEGIN;

ALTER TABLE public.product_status
  ADD COLUMN IF NOT EXISTS hsn_code text,
  ADD COLUMN IF NOT EXISTS uqc text NOT NULL DEFAULT 'PCS';

CREATE TABLE IF NOT EXISTS public.gst_credit_debit_notes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  note_type text NOT NULL CHECK (note_type IN ('Credit Note','Debit Note')),
  note_number text NOT NULL CHECK (char_length(btrim(note_number)) BETWEEN 1 AND 80),
  note_date date NOT NULL,
  party_type text NOT NULL CHECK (party_type IN ('B2B','B2C')),
  party_name text NOT NULL CHECK (char_length(btrim(party_name)) BETWEEN 1 AND 200),
  party_gstin text,
  reference_invoice text,
  taxable_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (taxable_amount >= 0),
  cgst numeric(14,2) NOT NULL DEFAULT 0 CHECK (cgst >= 0),
  sgst numeric(14,2) NOT NULL DEFAULT 0 CHECK (sgst >= 0),
  igst numeric(14,2) NOT NULL DEFAULT 0 CHECK (igst >= 0),
  reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(note_type, note_number)
);

CREATE INDEX IF NOT EXISTS gst_credit_debit_notes_date_idx
  ON public.gst_credit_debit_notes(note_date DESC);

CREATE INDEX IF NOT EXISTS gst_credit_debit_notes_party_idx
  ON public.gst_credit_debit_notes(lower(party_name));

CREATE TABLE IF NOT EXISTS public.gst_quarter_closings (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  financial_year text NOT NULL,
  quarter text NOT NULL CHECK (quarter IN ('Q1','Q2','Q3','Q4')),
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  closed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(financial_year, quarter)
);

CREATE OR REPLACE FUNCTION public.set_gst_reporting_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS gst_credit_debit_notes_updated_at ON public.gst_credit_debit_notes;
CREATE TRIGGER gst_credit_debit_notes_updated_at
BEFORE UPDATE ON public.gst_credit_debit_notes
FOR EACH ROW EXECUTE FUNCTION public.set_gst_reporting_updated_at();

DROP TRIGGER IF EXISTS gst_quarter_closings_updated_at ON public.gst_quarter_closings;
CREATE TRIGGER gst_quarter_closings_updated_at
BEFORE UPDATE ON public.gst_quarter_closings
FOR EACH ROW EXECUTE FUNCTION public.set_gst_reporting_updated_at();

ALTER TABLE public.gst_credit_debit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gst_quarter_closings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS gst_credit_debit_notes_admin_all ON public.gst_credit_debit_notes;
CREATE POLICY gst_credit_debit_notes_admin_all
ON public.gst_credit_debit_notes
FOR ALL TO authenticated
USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

DROP POLICY IF EXISTS gst_quarter_closings_admin_all ON public.gst_quarter_closings;
CREATE POLICY gst_quarter_closings_admin_all
ON public.gst_quarter_closings
FOR ALL TO authenticated
USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.gst_credit_debit_notes, public.gst_quarter_closings
TO authenticated;

GRANT USAGE, SELECT
ON ALL SEQUENCES IN SCHEMA public
TO authenticated;

COMMIT;
