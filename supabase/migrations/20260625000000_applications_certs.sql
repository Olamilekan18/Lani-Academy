-- ============================================================
-- LANI Academy — application attachments + certificate categories
-- Safe to re-run.
-- ============================================================

-- Uploaded supporting documents for applications (CV, ID, pitch deck, etc.)
ALTER TABLE public.programme_applications ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Certificate category / type
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Completion';
