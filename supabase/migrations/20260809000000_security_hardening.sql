-- ============================================================
-- 34. Security hardening (audit remediation — 2026-08-09)
-- ============================================================
-- Addresses:
--   C3 — removes anonymous "guest" INSERT clauses that let anyone
--        write rows for any learner_email (forged enrolments/txns).
--   H1 — blocks self-service role changes (privilege escalation to
--        facilitator/organization/admin) and adds WITH CHECK.
--   H3 — stops bulk PII exposure: profiles are no longer world-readable.
--   M1 — pins search_path on SECURITY DEFINER functions.
--   C1 — email_otps table backing real, server-side 2FA.
-- ============================================================

-- ── Helper: is the caller staff? (SECURITY DEFINER avoids RLS recursion) ──
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'facilitator')
  );
$$;

-- ── H3: restrict profile visibility ─────────────────────────
-- Owners see their own row; staff see all; the public can only see
-- facilitator profiles (needed for public course/instructor pages).
-- Learner PII (email, phone, org, etc.) is no longer world-readable.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner, staff, or if facilitator" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner, staff, or if facilitator" ON public.profiles
    FOR SELECT USING (
        auth.uid() = id
        OR role = 'facilitator'
        OR public.is_staff()
    );

-- ── H1: add WITH CHECK to the self-update policy ────────────
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ── H1 + M1: block ALL self-service role changes ────────────
-- Only admins/super_admins (or the server via service role, where
-- auth.uid() is null) may change a role. Previously only admin/
-- super_admin targets were blocked, so a learner could self-promote
-- to 'facilitator' or 'organization'.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_role TEXT;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND auth.uid() IS NOT NULL THEN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' AND caller_role IS DISTINCT FROM 'super_admin' THEN
      RAISE EXCEPTION 'Not permitted to change account role.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_escalation ON public.profiles;
CREATE TRIGGER enforce_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_escalation();

-- ── M1: pin search_path on the new-user handler ─────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        'learner'
    );
    RETURN NEW;
END;
$$;

-- ── C3: remove anonymous guest-insert clauses ───────────────
-- Writers must now be the authenticated owner of the row. Admin and
-- organization-sponsor inserts keep their own dedicated policies.
DROP POLICY IF EXISTS "Learners can insert their own enrollments" ON public.enrollments;
CREATE POLICY "Learners can insert their own enrollments" ON public.enrollments
    FOR INSERT WITH CHECK (auth.email() = learner_email);

DROP POLICY IF EXISTS "Learners can record transactions" ON public.transactions;
CREATE POLICY "Learners can record transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.email() = learner_email);

DROP POLICY IF EXISTS "Learners can insert attempts" ON public.quiz_attempts;
CREATE POLICY "Learners can insert attempts" ON public.quiz_attempts
    FOR INSERT WITH CHECK (auth.email() = learner_email);

DROP POLICY IF EXISTS "Learners can insert submissions" ON public.assignment_submissions;
CREATE POLICY "Learners can insert submissions" ON public.assignment_submissions
    FOR INSERT WITH CHECK (auth.email() = learner_email);

DROP POLICY IF EXISTS "Learners submit survey responses" ON public.survey_responses;
CREATE POLICY "Learners submit survey responses" ON public.survey_responses
    FOR INSERT WITH CHECK (auth.email() = learner_email);

-- ============================================================
-- C1: server-side email OTP store (backs real 2FA)
-- ============================================================
-- Codes are stored hashed. No client (anon/authenticated) may read or
-- write this table — only the auth-otp Edge Function via the service
-- role, which bypasses RLS. RLS is enabled with no policies = deny all.
CREATE TABLE IF NOT EXISTS public.email_otps (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    consumed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_otps_lookup ON public.email_otps (email, expires_at);

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: only the service role (Edge Function) touches this table.
