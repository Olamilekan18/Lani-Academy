-- Add due_time column to quizzes table
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS due_time TEXT;
