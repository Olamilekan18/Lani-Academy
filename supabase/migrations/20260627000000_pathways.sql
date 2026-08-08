-- ============================================================
-- LANI Academy — Learning pathways / course bundles
-- Curated sequences of courses. Public reads published; admins manage.
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.pathways (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  image TEXT,
  course_ids JSONB DEFAULT '[]',
  price NUMERIC DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.pathways ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published pathways are public" ON public.pathways;
CREATE POLICY "Published pathways are public" ON public.pathways FOR SELECT USING (
  published = true
  OR EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

DROP POLICY IF EXISTS "Admins manage pathways" ON public.pathways;
CREATE POLICY "Admins manage pathways" ON public.pathways FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);
