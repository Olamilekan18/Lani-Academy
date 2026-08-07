-- ============================================================
-- LANI Academy — Course media (intro video + downloadable materials)
-- ============================================================
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS material_files JSONB DEFAULT '[]';
