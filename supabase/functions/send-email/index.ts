// LANI Academy — send-email Edge Function (hardened 2026-08-09)
// Sends transactional email via Resend (https://resend.com).
//
// Security model (audit remediation H2 — was an open HTML relay):
//   • TEMPLATE mode  {template, to, data}  — renders a fixed, LANI-branded
//     template server-side. No arbitrary HTML, so it can't be abused for
//     phishing. Allowed unauthenticated (used by public contact/lead forms).
//   • RAW mode       {to, subject, html}   — arbitrary HTML. REQUIRES a valid
//     authenticated (non-anon) user JWT. Used by logged-in transactional
//     sends and admin broadcasts.
//   • Strict CORS origin allow-list, payload size caps, recipient validation,
//     and best-effort in-memory rate limiting.
//
// Deploy:   supabase functions deploy send-email
// Secrets:  supabase secrets set RESEND_API_KEY=re_xxx \
//             EMAIL_FROM="LANI Academy <noreply@yourdomain.com>" \
//             ALLOWED_ORIGINS="https://lani.ng,https://www.lani.ng"
//
// Until RESEND_API_KEY is set the function returns 200 {skipped:true}
// so the app keeps working (emails are simply not sent).

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "LANI Academy <onboarding@resend.dev>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

// ── Limits ──────────────────────────────────────────────────
const MAX_SUBJECT = 300;
const MAX_HTML = 100_000;
const MAX_RECIPIENTS = 5;
const RATE_MAX = 20;                 // sends per window per IP (best-effort)
const RATE_WINDOW_MS = 60_000;
const rate = new Map<string, number[]>();

function corsHeaders(origin: string | null) {
  // Reflect the origin only when it is explicitly allowed. If no allow-list is
  // configured, fall back to "*" (dev convenience) — set ALLOWED_ORIGINS in prod.
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
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

const isEmail = (s: unknown): s is string =>
  typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 320;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rate.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rate.set(ip, hits);
  return hits.length > RATE_MAX;
}

// ── Server-side templates (safe, fixed content) ─────────────
const NAVY = "#0f2442", GOLD = "#c9972b";
const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function shell(heading: string, bodyHtml: string) {
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;">
    <div style="background:${NAVY};border-radius:16px 16px 0 0;padding:22px 26px;color:#fff;">
      <span style="font-weight:800;font-size:20px;">LANI</span>
      <span style="color:${GOLD};font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-left:6px;">Academy</span>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:26px;color:#334155;line-height:1.7;">
      <h1 style="color:${NAVY};font-size:19px;margin:0 0 10px;">${esc(heading)}</h1>
      ${bodyHtml}
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0 12px;" />
      <p style="font-size:11px;color:#94a3b8;margin:0;">LANI Academy · info@lani.ng</p>
    </div>
  </div>`;
}

type Tmpl = { subject: string; html: string };
const TEMPLATES: Record<string, (d: Record<string, unknown>) => Tmpl> = {
  welcome: (d) => {
    const role = String(d.role ?? "learner");
    const label = role === "facilitator" ? "Facilitator" : role === "organization" ? "Organisation" : "Learner";
    return {
      subject: "Welcome to LANI Academy 🎓",
      html: shell("Welcome aboard", `<p>Hi ${esc(d.name)},</p>
        <p>Welcome to <strong>LANI Academy</strong> — your ${esc(label.toLowerCase())} account is ready.
        Explore programmes, track your progress, and earn verifiable certificates.</p>
        <p>If you didn't create this account, please ignore this email.</p>`),
    };
  },
  lead_ack: (d) => ({
    subject: "We've received your training request",
    html: shell("Thanks for reaching out", `<p>Hi ${esc(d.name)},</p>
      <p>Thank you for your enquiry${d.organisation ? ` on behalf of <strong>${esc(d.organisation)}</strong>` : ""}.
      A LANI Academy consultant will get back to you within 48 business hours.</p>`),
  }),
  otp: (d) => ({
    subject: `Your LANI Academy verification code: ${esc(d.code)}`,
    html: shell("Verify your sign-in", `<p>Hi ${esc(d.name ?? "there")},</p>
      <p>Use the verification code below to complete your sign-in. It expires in ${esc(d.minutes ?? 10)} minutes.</p>
      <div style="margin:24px 0;text-align:center;">
        <span style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;color:${NAVY};font-size:30px;font-weight:800;letter-spacing:10px;padding:16px 24px;border-radius:12px;">${esc(d.code)}</span>
      </div>
      <p style="font-size:13px;color:#64748b;">If you didn't request this, please change your password.</p>`),
  }),
};

async function sendViaResend(to: string | string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return json({ error: "Rate limit exceeded" }, 429, origin);

  let payload: Record<string, unknown>;
  try { payload = await req.json(); }
  catch { return json({ error: "Invalid JSON" }, 400, origin); }

  const { to, template, data, subject, html } = payload as any;

  // Recipient validation (string or small array)
  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0 || recipients.length > MAX_RECIPIENTS || !recipients.every(isEmail)) {
    return json({ error: "Invalid or too many recipients" }, 400, origin);
  }

  let finalSubject: string, finalHtml: string;

  if (typeof template === "string") {
    // ── TEMPLATE mode: safe, no auth required ──
    const build = TEMPLATES[template];
    if (!build) return json({ error: `Unknown template: ${template}` }, 400, origin);
    const t = build((data ?? {}) as Record<string, unknown>);
    finalSubject = t.subject;
    finalHtml = t.html;
  } else {
    // ── RAW mode: arbitrary HTML → require an authenticated non-anon user ──
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token || !SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ error: "Unauthorized" }, 401, origin);
    }
    const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error } = await client.auth.getUser(token);
    if (error || !user) return json({ error: "Unauthorized" }, 401, origin);

    if (typeof subject !== "string" || typeof html !== "string") {
      return json({ error: "Missing subject or html" }, 400, origin);
    }
    if (subject.length > MAX_SUBJECT || html.length > MAX_HTML) {
      return json({ error: "Payload too large" }, 413, origin);
    }
    finalSubject = subject;
    finalHtml = html;
  }

  // Graceful no-op when Resend isn't configured yet
  if (!RESEND_API_KEY) return json({ skipped: true, reason: "RESEND_API_KEY not set" }, 200, origin);

  try {
    const r = await sendViaResend(recipients.length === 1 ? recipients[0] : recipients, finalSubject, finalHtml);
    if (!r.ok) return json({ error: r.data }, r.status, origin);
    return json({ ok: true, id: (r.data as any).id }, 200, origin);
  } catch (e) {
    return json({ error: String(e) }, 500, origin);
  }
});
