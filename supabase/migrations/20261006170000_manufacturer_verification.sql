-- Admin-managed manufacturer verification codes.
BEGIN;

CREATE TABLE IF NOT EXISTS public.manufacturer_verification (
  code text PRIMARY KEY,
  manufacturer text NOT NULL,
  address text[] NOT NULL DEFAULT '{}',
  fssai text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manufacturer_verification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS manufacturer_verification_public_read ON public.manufacturer_verification;
DROP POLICY IF EXISTS manufacturer_verification_admin_insert ON public.manufacturer_verification;
DROP POLICY IF EXISTS manufacturer_verification_admin_update ON public.manufacturer_verification;
DROP POLICY IF EXISTS manufacturer_verification_admin_delete ON public.manufacturer_verification;

CREATE POLICY manufacturer_verification_public_read ON public.manufacturer_verification
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY manufacturer_verification_admin_insert ON public.manufacturer_verification
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

CREATE POLICY manufacturer_verification_admin_update ON public.manufacturer_verification
  FOR UPDATE TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

CREATE POLICY manufacturer_verification_admin_delete ON public.manufacturer_verification
  FOR DELETE TO authenticated
  USING ((SELECT auth.jwt() ->> 'email') = 'info@tenoo.in');

INSERT INTO public.manufacturer_verification (code, manufacturer, address, fssai)
VALUES
('TD','Tiny Dot Foods Private Limited',ARRAY['51, Kavarai Street','Athipet','Chennai – 600058'],'12425999000009'),
('VMK','Veetoon Health Foods',ARRAY['Tiruppur Dt – 638105','Tamil Nadu, India'],'12423027001124'),
('VAP','Veetoon Health Foods',ARRAY['Tiruppur Dt – 638105','Tamil Nadu, India'],'12423027001124')
ON CONFLICT (code) DO UPDATE SET
manufacturer=EXCLUDED.manufacturer,address=EXCLUDED.address,fssai=EXCLUDED.fssai,updated_at=now();

COMMIT;
