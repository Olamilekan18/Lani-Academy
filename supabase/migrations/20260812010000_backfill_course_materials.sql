-- Course materials are now attached PER LESSON (each lesson gets its own file),
-- not as one shared course-level set. Per-lesson sample files are seeded through
-- the real upload path with:  npm run seed:materials
--
-- This migration only:
--   1. clears any leftover shared course-level SAMPLE material_files (so the old
--      duplicated "Course Handbook / Session Slides" set no longer shows on every
--      lesson). Real course-level files uploaded by staff are self-hosted in the
--      media bucket and are left untouched.
--   2. sets a default lesson video where none exists.
--
-- Safe + idempotent.

-- 1. Remove the legacy shared course-level sample (external sample hosts only).
UPDATE public.courses
SET material_files = '[]'::jsonb
WHERE material_files IS NOT NULL
  AND material_files <> '[]'::jsonb
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_array_elements(material_files) AS f
    WHERE (f->>'url') NOT LIKE '%w3.org%'
      AND (f->>'url') NOT LIKE '%mozilla.github.io%'
  );

-- 2. Default lesson video for courses that have none.
UPDATE public.courses
SET video_url = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
WHERE video_url IS NULL OR video_url = '';
