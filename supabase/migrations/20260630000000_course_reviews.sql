-- ============================================================
-- 29. Course ratings & reviews
-- ============================================================
-- Learners who are enrolled in a course can leave one star rating + comment.
-- Reviews are publicly readable so average ratings can show on course cards.

CREATE TABLE IF NOT EXISTS public.course_reviews (
    id TEXT PRIMARY KEY DEFAULT 'rev-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12),
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    learner_email TEXT NOT NULL,
    learner_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (course_id, learner_email)
);

ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews are publicly viewable" ON public.course_reviews;
CREATE POLICY "Reviews are publicly viewable" ON public.course_reviews
    FOR SELECT USING (true);

-- A learner may review a course only if they are enrolled in it.
DROP POLICY IF EXISTS "Enrolled learners can write reviews" ON public.course_reviews;
CREATE POLICY "Enrolled learners can write reviews" ON public.course_reviews
    FOR INSERT WITH CHECK (
        auth.email() = learner_email
        AND EXISTS (
            SELECT 1 FROM public.enrollments e
            WHERE e.course_id = course_reviews.course_id
              AND e.learner_email = auth.email()
        )
    );

DROP POLICY IF EXISTS "Learners can update their own review" ON public.course_reviews;
CREATE POLICY "Learners can update their own review" ON public.course_reviews
    FOR UPDATE USING (auth.email() = learner_email);

DROP POLICY IF EXISTS "Learners can delete their own review" ON public.course_reviews;
CREATE POLICY "Learners can delete their own review" ON public.course_reviews
    FOR DELETE USING (auth.email() = learner_email);

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.course_reviews;
CREATE POLICY "Admins can manage reviews" ON public.course_reviews
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
              AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );

CREATE INDEX IF NOT EXISTS idx_course_reviews_course ON public.course_reviews (course_id);
