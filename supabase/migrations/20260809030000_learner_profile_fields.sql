-- ============================================================
-- 36. Extended learner profile fields
-- ============================================================
-- Capture richer learner information at signup and on the profile page:
-- location (country / state / city), gender, and date of birth.
-- Phone / organisation / job_title already exist on public.profiles.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state_region TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth DATE;
