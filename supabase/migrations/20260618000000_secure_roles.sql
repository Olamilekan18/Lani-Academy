-- LANI Academy — Secure role assignment
-- Prevents privilege escalation: a signed-in user may self-select the
-- non-privileged roles (learner, facilitator, organization) but can NEVER
-- grant themselves 'admin' or 'super_admin'. Only existing admins may do that.
-- This enforces role-based security at the database layer, independent of the client.

-- Trusted server-side / SQL-Editor operations (auth.uid() IS NULL, which
-- already requires the service role and passes RLS) are allowed through so
-- the first admin can be bootstrapped.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
DECLARE
  caller_role TEXT;
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND NEW.role IN ('admin', 'super_admin')
     AND auth.uid() IS NOT NULL THEN
    SELECT role INTO caller_role FROM public.profiles WHERE id = auth.uid();
    IF caller_role IS DISTINCT FROM 'admin' AND caller_role IS DISTINCT FROM 'super_admin' THEN
      RAISE EXCEPTION 'Not permitted to assign administrative roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_role_escalation ON public.profiles;
CREATE TRIGGER enforce_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.prevent_role_escalation();

-- Optional: seed your first super admin (run once, replace the email).
-- UPDATE public.profiles SET role = 'super_admin' WHERE email = 'you@lani.ng';
