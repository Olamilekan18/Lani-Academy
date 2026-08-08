-- ============================================================
-- 31. Admin audit log
-- ============================================================
-- Records privileged actions (role changes, course edits/archives, cert revokes,
-- broadcasts, etc.). Any authenticated user can append; only admins can read.

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY DEFAULT 'aud-' || encode(gen_random_bytes(6), 'hex'),
    actor_email TEXT,
    actor_role TEXT,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    detail TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Append-only for any signed-in user (actions are logged from the app).
DROP POLICY IF EXISTS "Authenticated can append audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can append audit logs" ON public.audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

-- Only admins can read the log.
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE public.profiles.id = auth.uid()
              AND (public.profiles.role = 'admin' OR public.profiles.role = 'super_admin')
        )
    );

CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs (created_at DESC);
