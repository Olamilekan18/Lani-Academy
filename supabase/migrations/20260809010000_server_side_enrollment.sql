-- ============================================================
-- 35. Server-side enrolment lockdown (audit remediation C2) — 2026-08-09
-- ============================================================
-- Enrolments and their transactions are now created exclusively by the
-- `enroll` Edge Function (service role) AFTER the payment is verified against
-- the gateway. Remove the learner self-insert policies so a determined
-- authenticated user can no longer insert their own enrolment/transaction
-- rows directly through the anon key + RLS.
--
-- Unaffected (keep their own policies):
--   • Admins            — "Admins can view and edit all enrollments" / "... transactions"
--   • Organizations     — "Organizations can sponsor enrollments" / "... record sponsored transactions"
--   • The enroll fn     — uses the service role, which bypasses RLS entirely.

DROP POLICY IF EXISTS "Learners can insert their own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Learners can record transactions" ON public.transactions;
