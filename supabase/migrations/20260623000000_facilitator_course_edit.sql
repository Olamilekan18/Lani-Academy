-- ============================================================
-- LANI Academy — allow assigned facilitators to edit their courses
-- (e.g. manage the curriculum/modules). Admins retain full control.
-- Safe to re-run.
-- ============================================================

DROP POLICY IF EXISTS "Facilitators update assigned courses" ON public.courses;
CREATE POLICY "Facilitators update assigned courses" ON public.courses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.facilitator_assignments fa
      WHERE fa.course_id = public.courses.id
        AND fa.facilitator_email = auth.email()
    )
  );
