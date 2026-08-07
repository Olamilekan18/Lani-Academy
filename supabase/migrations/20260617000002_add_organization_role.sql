-- Migration: Add organization role and sponsor_organisation to enrollments
-- Description: Supports corporate/organization client signup and dashboard features.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('learner', 'facilitator', 'admin', 'super_admin', 'organization'));

ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS sponsor_organisation TEXT;
