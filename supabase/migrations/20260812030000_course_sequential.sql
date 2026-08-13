-- Sequential module progression: when true, learners must finish each module
-- before the next unlocks. (Per-module/lesson videos live inside the existing
-- modules JSONB, so they need no schema change.)

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS sequential BOOLEAN DEFAULT false;
