-- Subject Matter Experts (SMEs) shown on the landing page and managed in admin.

CREATE TABLE IF NOT EXISTS public.smes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT,
  expertise TEXT,
  bio TEXT,
  image TEXT,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.smes ENABLE ROW LEVEL SECURITY;

-- Published experts are public; admins can see all.
DROP POLICY IF EXISTS "Published smes are public" ON public.smes;
CREATE POLICY "Published smes are public" ON public.smes FOR SELECT USING (
  published = true
  OR EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

-- Only admins/super admins can create, update or delete experts.
DROP POLICY IF EXISTS "Admins manage smes" ON public.smes;
CREATE POLICY "Admins manage smes" ON public.smes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);
