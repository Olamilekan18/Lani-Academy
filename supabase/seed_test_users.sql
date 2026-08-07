-- ============================================================
-- LANI Academy — Seed test users (one per role)
-- ============================================================
-- Run this in the Supabase SQL Editor.
-- Creates three confirmed email/password accounts so you can log in
-- and test the Learner, Facilitator and Admin portals immediately.
-- Safe to re-run: it deletes and recreates the test accounts each time.
--
--   Learner      →  learner@lani.test      /  Learner123!
--   Facilitator  →  facilitator@lani.test  /  Facilitator123!
--   Admin        →  admin@lani.test        /  Admin123!
--
-- ⚠️  These are TEST credentials. Change the passwords (or delete these
--     users) before using this project in production.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Remove any existing copies (cascades to profiles + identities)
DELETE FROM auth.users
WHERE email IN ('learner@lani.test', 'facilitator@lani.test', 'admin@lani.test');

-- Helper: create a confirmed email/password user (+ matching identity)
CREATE OR REPLACE FUNCTION public.__seed_user(p_email text, p_password text, p_name text)
RETURNS uuid LANGUAGE plpgsql AS $$
DECLARE
  new_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
    p_email, crypt(p_password, gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('full_name', p_name)::jsonb,
    '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), new_id, new_id::text,
    json_build_object('sub', new_id::text, 'email', p_email)::jsonb,
    'email', now(), now(), now()
  );

  RETURN new_id;
END $$;

-- Create the three accounts (the handle_new_user trigger creates their profiles)
SELECT public.__seed_user('learner@lani.test',     'Learner123!',     'Test Learner');
SELECT public.__seed_user('facilitator@lani.test', 'Facilitator123!', 'Test Facilitator');
SELECT public.__seed_user('admin@lani.test',        'Admin123!',       'Test Admin');

-- Assign roles (profiles are created as 'learner' by default)
UPDATE public.profiles
   SET role = 'facilitator',
       bio = 'Experienced LANI facilitator (test account).',
       qualifications = 'M.Sc., Certified Corporate Trainer'
 WHERE email = 'facilitator@lani.test';

UPDATE public.profiles
   SET role = 'super_admin'
 WHERE email = 'admin@lani.test';

-- learner@lani.test intentionally stays 'learner'

-- Tidy up the helper
DROP FUNCTION public.__seed_user(text, text, text);

-- Verify
SELECT email, role, full_name FROM public.profiles
WHERE email IN ('learner@lani.test', 'facilitator@lani.test', 'admin@lani.test')
ORDER BY role;
