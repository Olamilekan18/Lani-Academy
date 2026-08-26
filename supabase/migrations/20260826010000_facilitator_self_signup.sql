-- ============================================================
-- Facilitator / organization self-signup + admin role control
-- ============================================================
-- Context: the 2026-08-09 security hardening (H1) blocked ALL self-service
-- role changes to stop privilege escalation. That also broke the intended
-- facilitator and organization self-signup flows, which set the account's
-- role right after registration.
--
-- Desired model (product owner): a new user may auto-approve themselves into
-- a non-privileged role (learner / facilitator / organization) ONCE, at
-- signup. Admins can later revoke (demote to learner) or re-assign roles, and
-- that decision sticks — a user cannot self-promote again after an admin has
-- set their role. Administrative roles (admin / super_admin) can NEVER be
-- self-assigned.

-- 1. Track whether a profile's role has been set by an admin. Once locked,
--    only admins (or the service role) may change the role again — this is
--    what makes an admin "revoke" stick.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_locked BOOLEAN NOT NULL DEFAULT false;

-- 2. Admin check as a SECURITY DEFINER helper (avoids RLS recursion when used
--    inside a policy on the profiles table itself).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
$$;

-- 3. Role-change trigger.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Nothing to police unless the role is actually changing.
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  -- Trusted server-side / service-role operations (auth.uid() IS NULL) pass
  -- through: DB bootstrap, SQL editor, and Edge Functions.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();

  -- Admins may set any role. Mark the target profile as admin-controlled so
  -- the user can no longer self-select a role (revoke / assignment sticks).
  IF caller_role IN ('admin', 'super_admin') THEN
    NEW.role_locked := true;
    RETURN NEW;
  END IF;

  -- Non-admin caller (self-service) from here on.

  -- Never allow self-assignment of administrative roles.
  IF NEW.role IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Not permitted to assign administrative roles.';
  END IF;

  -- Allow the one-time signup selection: still on the default 'learner' role
  -- and not locked by an admin. This is the facilitator / organization
  -- auto-approval path.
  IF OLD.role = 'learner' AND OLD.role_locked = false THEN
    RETURN NEW;
  END IF;

  -- Any other self-service role change (e.g. re-promoting after an admin
  -- revoke, or switching roles later) is rejected.
  RAISE EXCEPTION 'Not permitted to change account role.';
END;
$$;

DROP TRIGGER IF EXISTS enforce_role_escalation ON public.profiles;
CREATE TRIGGER enforce_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_escalation();

-- 4. Let admins update any profile (needed to revoke / re-assign roles).
--    The self-update policy remains for regular users.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());
