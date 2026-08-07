// LANI Academy — send-email Edge Function
// Sends transactional email via Resend (https://resend.com).
//
// Deploy:   supabase functions deploy send-email
// Secrets:  supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="LANI Academy <noreply@yourdomain.com>"
//
// Until RESEND_API_KEY is set the function returns 200 with {skipped:true}
// so the app keeps working (emails are simply not sent).

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "LANI Academy <onboarding@resend.dev>";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { to, subject, html } = await req.json();
    if (!to || !subject || !html) return json({ error: "Missing to, subject or html" }, 400);

    // Graceful no-op when not configured yet
    if (!RESEND_API_KEY) return json({ skipped: true, reason: "RESEND_API_KEY not set" });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
    });

    const data = await res.json();
    if (!res.ok) return json({ error: data }, res.status);
    return json({ ok: true, id: data.id });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
