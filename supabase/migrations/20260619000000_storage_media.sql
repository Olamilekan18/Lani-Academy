-- ============================================================
-- LANI Academy — Media storage (creative assets, brochures, materials)
-- ============================================================
-- Creates a public "media" bucket and access policies, and adds a
-- url column to cms_assets so uploaded files can be linked.

-- Column for the uploaded file's public URL
ALTER TABLE public.cms_assets ADD COLUMN IF NOT EXISTS url TEXT;

-- Public storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read media (public assets)
DROP POLICY IF EXISTS "Public read media" ON storage.objects;
CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Signed-in users (admins, facilitators) can upload
DROP POLICY IF EXISTS "Authenticated upload media" ON storage.objects;
CREATE POLICY "Authenticated upload media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');

-- Signed-in users can update/replace media
DROP POLICY IF EXISTS "Authenticated update media" ON storage.objects;
CREATE POLICY "Authenticated update media" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'media');

-- Only admins/super_admins can delete media
DROP POLICY IF EXISTS "Admins delete media" ON storage.objects;
CREATE POLICY "Admins delete media" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'media'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE public.profiles.id = auth.uid()
        AND public.profiles.role IN ('admin', 'super_admin')
    )
  );
