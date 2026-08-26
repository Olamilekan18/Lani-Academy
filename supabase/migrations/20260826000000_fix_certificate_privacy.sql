-- ============================================================
-- Fix certificate privacy leak
-- ============================================================
-- Previously the certificates table had:
--   CREATE POLICY "Certificates are publicly viewable for verification"
--     ON public.certificates FOR SELECT USING (true);
-- That policy let ANY visitor (even anonymous) read EVERY certificate row
-- via the REST API, including every learner's name, email, and courses.
-- Combined with the client's unfiltered `select *`, one learner could see
-- another learner's certificates in their own wallet.
--
-- This migration removes that blanket-read policy and scopes certificate
-- reads to the owning learner (matching the pattern used by every other
-- learner-owned table), while keeping admins' full access. Public
-- verification (lookup by exact certificate ID) is preserved through a
-- SECURITY DEFINER function that returns only the single matching row.

-- 1. Remove the blanket public-read policy (the leak).
DROP POLICY IF EXISTS "Certificates are publicly viewable for verification" ON public.certificates;

-- 2. Learners can read only their own certificates.
DROP POLICY IF EXISTS "Learners can view their own certificates" ON public.certificates;
CREATE POLICY "Learners can view their own certificates" ON public.certificates
    FOR SELECT USING (auth.email() = learner_email);

-- (The existing "Admins can manage certificates" FOR ALL policy remains and
--  continues to give admins/super_admins full read + write access.)

-- 3. Public verification by exact certificate ID, without exposing the table.
--    SECURITY DEFINER lets this bypass RLS to return a single row matched by
--    exact (case-insensitive) ID — you must already know the certificate ID,
--    so it cannot be used to enumerate or dump the table.
CREATE OR REPLACE FUNCTION public.verify_certificate(cert_id TEXT)
RETURNS SETOF public.certificates
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public AS $$
    SELECT *
    FROM public.certificates
    WHERE cert_id IS NOT NULL
      AND btrim(cert_id) <> ''
      AND lower(id) = lower(btrim(cert_id))
    LIMIT 1;
$$;

-- Anonymous and authenticated visitors may verify a certificate by ID.
GRANT EXECUTE ON FUNCTION public.verify_certificate(TEXT) TO anon, authenticated;
