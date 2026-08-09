-- ============================================================
-- Apply in Supabase → SQL Editor to fix:
--   1. Facilitator "Avg. Completion" + "Learner Progress" (empty/0%)
--   2. Learner "Day Streak" stuck at 0
-- Idempotent and safe to re-run.
-- ============================================================

-- 1) Let facilitators read enrollments for their assigned courses.
DROP POLICY IF EXISTS "Facilitators can view enrollments for assigned courses" ON public.enrollments;
CREATE POLICY "Facilitators can view enrollments for assigned courses" ON public.enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.facilitator_assignments fa
      WHERE fa.course_id = public.enrollments.course_id
        AND fa.facilitator_email = auth.email()
    )
  );

-- 2) Ensure the streak table + policies exist (no-op if already applied).
CREATE TABLE IF NOT EXISTS public.learner_activity (
    learner_email TEXT NOT NULL,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (learner_email, activity_date)
);

ALTER TABLE public.learner_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners manage their own activity" ON public.learner_activity;
CREATE POLICY "Learners manage their own activity" ON public.learner_activity
    FOR ALL USING (auth.email() = learner_email)
    WITH CHECK (auth.email() = learner_email);

DROP POLICY IF EXISTS "Admins can read activity" ON public.learner_activity;
CREATE POLICY "Admins can read activity" ON public.learner_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
              AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );
