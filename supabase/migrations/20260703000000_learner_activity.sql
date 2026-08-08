-- ============================================================
-- 32. Learner activity (backend login/activity streak)
-- ============================================================
-- One row per learner per active day. Used to compute a cross-device
-- learning streak. Owner-only; admins may read for analytics.

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
