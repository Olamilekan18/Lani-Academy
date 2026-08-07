-- ============================================================
-- Schedule daily class reminders via pg_cron + pg_net
-- Run once in the Supabase SQL Editor after deploying the function:
--    supabase functions deploy send-class-reminders
--    supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="LANI Academy <noreply@yourdomain.com>"
--
-- Replace <PROJECT_REF> with your project ref and <ANON_OR_SERVICE_KEY>
-- with a key allowed to invoke the function (anon is fine; the function
-- itself uses the service role internally).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any previous schedule with the same name
SELECT cron.unschedule('lani-class-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'lani-class-reminders');

-- Run every day at 08:00 UTC
SELECT cron.schedule(
  'lani-class-reminders',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://<PROJECT_REF>.functions.supabase.co/send-class-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <ANON_OR_SERVICE_KEY>'
    ),
    body    := '{}'::jsonb
  );
  $$
);
