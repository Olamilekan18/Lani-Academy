-- ============================================================
-- LANI Academy — Session attendance
-- Facilitators/admins mark attendance per session; learners see their own.
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.attendance (
  session_id TEXT REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  learner_email TEXT NOT NULL,
  learner_name TEXT,
  course_id TEXT,
  status TEXT CHECK (status IN ('Present','Absent')) DEFAULT 'Present',
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (session_id, learner_email)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Learners view their attendance" ON public.attendance;
CREATE POLICY "Learners view their attendance" ON public.attendance FOR SELECT USING (auth.email() = learner_email);

DROP POLICY IF EXISTS "Staff view attendance" ON public.attendance;
CREATE POLICY "Staff view attendance" ON public.attendance FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin','facilitator'))
);

DROP POLICY IF EXISTS "Staff manage attendance" ON public.attendance;
CREATE POLICY "Staff manage attendance" ON public.attendance FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin','facilitator'))
);
