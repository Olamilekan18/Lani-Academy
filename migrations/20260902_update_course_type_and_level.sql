-- Migration: Update course type and level CHECK constraints
-- Date: 2026-09-02

-- Step 1: Drop the existing check constraints by exact name
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_type_check;
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_level_check;

-- Step 2: Backfill old values
UPDATE public.courses
SET type = 'Certification Preparatory Class'
WHERE type = 'Certification Prep';

-- Step 3: Re-add constraints with the new allowed values
ALTER TABLE public.courses ADD CONSTRAINT courses_type_check
  CHECK (type IN ('Open Programme', 'Certification Preparatory Class', 'Bootcamp', 'Corporate', 'Sponsored'));

ALTER TABLE public.courses ADD CONSTRAINT courses_level_check
  CHECK (level IN ('Foundation', 'Intermediate', 'Advanced', 'Executive', 'PT1', 'PT2', 'Others'));
