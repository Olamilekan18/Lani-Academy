// LANI Academy — issue-certificate Edge Function (audit remediation)
// Issues a completion certificate ENTIRELY server-side. Certificates are
// admin-managed at the RLS level, so a learner cannot (and should not) insert
// one directly. This function authenticates the caller from their JWT, confirms
// server-side that they have actually completed the course (enrolment
// progress = 100%), then inserts the certificate with the service role.
//
// Deploy:   supabase functions deploy issue-certificate
// Secrets:  SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_ANON_KEY auto.
//
// Request:  { courseId }
// Response: { ok, certificate?, alreadyIssued?, reason? }

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

function corsHeaders(origin: string | null) {
  const allow =
    ALLOWED_ORIGINS.length === 0 ? "*"
      : origin && ALLOWED_ORIGINS.includes(origin) ? origin
        : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}
function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}
const rand = (n = 6) => Array.from(crypto.getRandomValues(new Uint8Array(n)))
  .map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, n).toUpperCase();

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) return json({ error: "Server not configured" }, 500, origin);

  // ── 1. Authenticate the caller from the JWT ──
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ ok: false, reason: "Unauthorized" }, 401, origin);

  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: userErr } = await asUser.auth.getUser(token);
  if (userErr || !user?.email) return json({ ok: false, reason: "Unauthorized" }, 401, origin);

  let payload: any;
  try { payload = await req.json(); }
  catch { return json({ ok: false, reason: "Invalid JSON" }, 400, origin); }

  const courseId = String(payload?.courseId ?? "");
  if (!courseId) return json({ ok: false, reason: "Missing courseId" }, 400, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const learnerEmail = user.email;

  // ── 2. Verify completion server-side (don't trust client progress) ──
  const { data: enrollment } = await admin
    .from("enrollments").select("progress, learner_name")
    .eq("course_id", courseId).eq("learner_email", learnerEmail).maybeSingle();
  if (!enrollment) return json({ ok: false, reason: "Not enrolled in this course" }, 403, origin);
  if (Number(enrollment.progress) < 100)
    return json({ ok: false, reason: "Course not yet completed" }, 403, origin);

  // ── 3. Idempotency ──
  const { data: existing } = await admin
    .from("certificates").select("*")
    .eq("course_id", courseId).eq("learner_email", learnerEmail).maybeSingle();
  if (existing) return json({ ok: true, certificate: existing, alreadyIssued: true }, 200, origin);

  const { data: course } = await admin.from("courses").select("title").eq("id", courseId).maybeSingle();
  const courseTitle = course?.title || courseId;
  const learnerName = enrollment.learner_name || learnerEmail.split("@")[0];

  // ── 4. Issue the certificate (service role bypasses the admin-only RLS) ──
  const certId = `LANI-CERT-${rand(6)}`;
  const { data: certificate, error: certErr } = await admin.from("certificates").insert({
    id: certId,
    learner_name: learnerName,
    learner_email: learnerEmail,
    course_id: courseId,
    course_title: courseTitle,
    status: "Issued",
  }).select().maybeSingle();
  if (certErr) return json({ ok: false, reason: `Could not issue certificate: ${certErr.message}` }, 500, origin);

  // ── 5. In-app notification (service role) ──
  await admin.from("notifications").insert({
    type: "certificate",
    title: "Certificate issued",
    body: `Your certificate for ${courseTitle} is ready.`,
    read: false,
    learner_email: learnerEmail,
  });

  return json({ ok: true, certificate }, 200, origin);
});
