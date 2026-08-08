-- ============================================================
-- LANI Academy — Analytics events (views, checkout funnel)
-- Anyone can log an event; only admins can read them.
-- Safe to re-run.
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,               -- 'view' | 'checkout_start' | 'checkout_complete'
  course_id TEXT,
  learner_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log events" ON public.analytics_events;
CREATE POLICY "Anyone can log events" ON public.analytics_events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read events" ON public.analytics_events;
CREATE POLICY "Admins read events" ON public.analytics_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON public.analytics_events(type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_course ON public.analytics_events(course_id);
