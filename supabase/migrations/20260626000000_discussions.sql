-- ============================================================
-- LANI Academy — Course discussion forums (per-course Q&A)
-- Enrolled learners + assigned staff can read and post; one level of replies.
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.discussions (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT,
  author_email TEXT NOT NULL,
  author_name TEXT,
  author_role TEXT,
  body TEXT NOT NULL,
  parent_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View course discussions" ON public.discussions;
CREATE POLICY "View course discussions" ON public.discussions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = public.discussions.course_id AND e.learner_email = auth.email())
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('facilitator','admin','super_admin'))
);

DROP POLICY IF EXISTS "Post course discussions" ON public.discussions;
CREATE POLICY "Post course discussions" ON public.discussions FOR INSERT WITH CHECK (
  author_email = auth.email() AND (
    EXISTS (SELECT 1 FROM public.enrollments e WHERE e.course_id = public.discussions.course_id AND e.learner_email = auth.email())
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('facilitator','admin','super_admin'))
  )
);

DROP POLICY IF EXISTS "Delete own or staff discussions" ON public.discussions;
CREATE POLICY "Delete own or staff discussions" ON public.discussions FOR DELETE USING (
  author_email = auth.email()
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role IN ('facilitator','admin','super_admin'))
);
