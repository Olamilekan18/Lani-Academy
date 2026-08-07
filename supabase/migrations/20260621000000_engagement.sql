-- ============================================================
-- LANI Academy — Engagement features
-- Promo codes, wishlists, newsletter, and course feedback surveys.
-- Safe to re-run.
-- ============================================================

-- ── Promo codes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.promo_codes (
  code TEXT PRIMARY KEY,
  description TEXT,
  discount_percent INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at DATE,
  max_uses INTEGER DEFAULT 0,   -- 0 = unlimited
  uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Promo codes are readable" ON public.promo_codes;
CREATE POLICY "Promo codes are readable" ON public.promo_codes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage promo codes" ON public.promo_codes;
CREATE POLICY "Admins manage promo codes" ON public.promo_codes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

-- ── Wishlists ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.wishlists (
  learner_email TEXT NOT NULL,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (learner_email, course_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users view their wishlist" ON public.wishlists;
CREATE POLICY "Users view their wishlist" ON public.wishlists FOR SELECT USING (auth.email() = learner_email);
DROP POLICY IF EXISTS "Users add to their wishlist" ON public.wishlists;
CREATE POLICY "Users add to their wishlist" ON public.wishlists FOR INSERT WITH CHECK (auth.email() = learner_email);
DROP POLICY IF EXISTS "Users remove from their wishlist" ON public.wishlists;
CREATE POLICY "Users remove from their wishlist" ON public.wishlists FOR DELETE USING (auth.email() = learner_email);

-- ── Newsletter subscribers ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins read subscribers" ON public.newsletter_subscribers;
CREATE POLICY "Admins read subscribers" ON public.newsletter_subscribers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin'))
);

-- ── Surveys ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.surveys (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES public.courses(id) ON DELETE CASCADE,
  course_title TEXT,
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('Pre','Post','Feedback')) DEFAULT 'Feedback',
  questions JSONB DEFAULT '[]',  -- array of { id, prompt }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Surveys are viewable by everyone" ON public.surveys;
CREATE POLICY "Surveys are viewable by everyone" ON public.surveys FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins and facilitators manage surveys" ON public.surveys;
CREATE POLICY "Admins and facilitators manage surveys" ON public.surveys FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin','facilitator'))
);

CREATE TABLE IF NOT EXISTS public.survey_responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT REFERENCES public.surveys(id) ON DELETE CASCADE,
  course_id TEXT,
  learner_email TEXT,
  learner_name TEXT,
  ratings JSONB DEFAULT '[]',  -- array of numbers aligned to questions
  comment TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Learners submit survey responses" ON public.survey_responses;
CREATE POLICY "Learners submit survey responses" ON public.survey_responses FOR INSERT WITH CHECK (auth.email() = learner_email OR auth.uid() IS NULL);
DROP POLICY IF EXISTS "Learners view their responses" ON public.survey_responses;
CREATE POLICY "Learners view their responses" ON public.survey_responses FOR SELECT USING (auth.email() = learner_email);
DROP POLICY IF EXISTS "Admins and facilitators view responses" ON public.survey_responses;
CREATE POLICY "Admins and facilitators view responses" ON public.survey_responses FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('admin','super_admin','facilitator'))
);
