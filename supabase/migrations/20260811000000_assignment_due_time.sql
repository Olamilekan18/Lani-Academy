-- Add due_time column to assignments table
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS due_time TEXT;
