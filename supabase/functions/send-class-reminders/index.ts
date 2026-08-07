// LANI Academy — send-class-reminders Edge Function
// Emails a reminder to enrolled learners for every session happening the
// next calendar day. Intended to be invoked once daily by pg_cron.
//
// Deploy:  supabase functions deploy send-class-reminders
// Secrets: RESEND_API_KEY, EMAIL_FROM (SUPABASE_URL and
//          SUPABASE_SERVICE_ROLE_KEY are provided automatically).
// Returns {skipped:true} when keys are missing so it never hard-fails.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "LANI Academy <onboarding@resend.dev>";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

async function rest(path: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: SERVICE_KEY!, Authorization: `Bearer ${SERVICE_KEY}` },
  });
  if (!res.ok) return [];
  return await res.json();
}

function reminderHtml(name: string, courseTitle: string, sessionTitle: string, date: string, time: string, venue: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;">
    <div style="background:#0f2442;border-radius:16px 16px 0 0;padding:22px 26px;color:#fff;">
      <span style="font-weight:800;font-size:20px;">LANI</span>
      <span style="color:#c9972b;font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-left:6px;">Academy</span>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:26px;color:#334155;line-height:1.7;">
      <h1 style="color:#0f2442;font-size:19px;margin:0 0 10px;">Session reminder</h1>
      <p>Hi ${name},</p>
      <p>This is a reminder for your upcoming session in <strong>${courseTitle}</strong>.</p>
      <p><strong>${sessionTitle}</strong><br/>${date} · ${time}${venue ? ` · ${venue}` : ""}</p>
      <p style="font-size:12px;color:#94a3b8;">LANI Academy · automated reminder.</p>
    </div>
  </div>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!SUPABASE_URL || !SERVICE_KEY || !RESEND_API_KEY) {
    return json({ skipped: true, reason: "Missing SUPABASE or RESEND configuration" });
  }

  // Tomorrow in YYYY-MM-DD
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const tomorrow = d.toISOString().split("T")[0];

  const events = await rest(`calendar_events?date=eq.${tomorrow}&select=*`);
  let sent = 0;

  for (const ev of events) {
    const enrollments = await rest(`enrollments?course_id=eq.${ev.course_id}&select=learner_email,learner_name`);
    for (const en of enrollments) {
      if (!en.learner_email) continue;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to: en.learner_email,
          subject: `Reminder: ${ev.title} — ${ev.date}`,
          html: reminderHtml(en.learner_name || "there", ev.course_title, ev.title, ev.date, ev.time, ev.venue),
        }),
      });
      if (res.ok) sent++;
    }
  }

  return json({ ok: true, date: tomorrow, events: events.length, emailsSent: sent });
});
