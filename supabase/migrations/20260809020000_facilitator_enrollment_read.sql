-- ============================================================
-- 35. Facilitator visibility into enrollments
-- ============================================================
-- Facilitators need to read the enrollments of courses they are assigned
-- to, so the Facilitator Dashboard can show "Avg. Completion" and the
-- "Learner Progress" table. Previously no policy granted this, so the
-- client query returned zero rows for facilitators (RLS-filtered),
-- leaving those views empty/0%.
--
-- Scoped to assigned courses via facilitator_assignments — least privilege.

DROP POLICY IF EXISTS "Facilitators can view enrollments for assigned courses" ON public.enrollments;
CREATE POLICY "Facilitators can view enrollments for assigned courses" ON public.enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.facilitator_assignments fa
      WHERE fa.course_id = public.enrollments.course_id
        AND fa.facilitator_email = auth.email()
    )
  );
