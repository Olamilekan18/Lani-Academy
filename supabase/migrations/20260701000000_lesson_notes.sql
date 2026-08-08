-- ============================================================
-- 30. Lesson bookmarks & notes
-- ============================================================
-- Private, per-learner notes and bookmarks attached to a lesson within a course.
-- Owner-only visibility.

CREATE TABLE IF NOT EXISTS public.lesson_notes (
    id TEXT PRIMARY KEY DEFAULT 'note-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12),
    learner_email TEXT NOT NULL,
    course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
    lesson_title TEXT NOT NULL,
    body TEXT DEFAULT '',
    bookmarked BOOLEAN DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (learner_email, course_id, lesson_title)
);

ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners manage their own notes" ON public.lesson_notes;
CREATE POLICY "Learners manage their own notes" ON public.lesson_notes
    FOR ALL USING (auth.email() = learner_email)
    WITH CHECK (auth.email() = learner_email);

CREATE INDEX IF NOT EXISTS idx_lesson_notes_owner ON public.lesson_notes (learner_email, course_id);
