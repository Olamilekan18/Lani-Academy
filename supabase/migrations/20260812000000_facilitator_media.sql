-- Facilitator media: optional intro video + CV/resume on profiles.
-- Idempotent so it is safe to run on existing databases.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS intro_video_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cv_url TEXT;
