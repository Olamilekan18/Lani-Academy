-- ============================================================
-- LANI Academy — Content (articles + downloadable resources)
-- Managed from the admin portal, shown on the Resources page.
-- Safe to re-run.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.content (
  id TEXT PRIMARY KEY,
  type TEXT CHECK (type IN ('Article','Guide','Brochure','Flyer')) DEFAULT 'Article',
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT,
  category TEXT,
  image_url TEXT,
  file_url TEXT,
  author TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published content is public" ON public.content;
CREATE POLICY "Published content is public" ON public.content FOR SELECT USING (
  published = true
  OR EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

DROP POLICY IF EXISTS "Admins manage content" ON public.content;
CREATE POLICY "Admins manage content" ON public.content FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);
