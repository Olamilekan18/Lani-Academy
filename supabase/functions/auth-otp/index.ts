// LANI Academy — auth-otp Edge Function (audit remediation C1)
// Real, server-side email two-factor. Replaces the previous client-side OTP,
// which generated AND verified the code in the browser (trivially bypassable).
//
// Codes are cryptographically random, stored HASHED in public.email_otps
// (service-role only), expire after 10 minutes, are single-use, and are
// attempt-limited. The browser never sees the code.
//
// Deploy:   supabase functions deploy auth-otp
// Secrets:  RESEND_API_KEY, EMAIL_FROM (for delivery),
//           OTP_PEPPER (optional extra secret mixed into the hash).
//           SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are provided automatically.
//
// Actions:  { action: "issue",  email, name? }        → { sent: boolean }
//           { action: "verify", email, code }          → { verified: boolean }

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM") ?? "LANI Academy <onboarding@resend.dev>";
const OTP_PEPPER = Deno.env.get("OTP_PEPPER") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((s) => s.trim()).filter(Boolean);

const TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RATE_MAX = 6;               // issue/verify calls per window per IP
const RATE_WINDOW_MS = 60_000;
const rate = new Map<string, number[]>();

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
const isEmail = (s: unknown): s is string =>
  typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 320;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rate.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rate.set(ip, hits);
  return hits.length > RATE_MAX;
}

function genCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, "0");
}
async function hashCode(email: string, code: string): Promise<string> {
  const data = new TextEncoder().encode(`${OTP_PEPPER}:${email.toLowerCase()}:${code}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function otpEmailHtml(name: string, code: string) {
  const NAVY = "#0f2442", GOLD = "#c9972b";
  return `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;">
    <div style="background:${NAVY};border-radius:16px 16px 0 0;padding:22px 26px;color:#fff;">
      <span style="font-weight:800;font-size:20px;">LANI</span>
      <span style="color:${GOLD};font-size:11px;letter-spacing:3px;text-transform:uppercase;margin-left:6px;">Academy</span>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:26px;color:#334155;line-height:1.7;">
      <h1 style="color:${NAVY};font-size:19px;margin:0 0 10px;">Verify your sign-in</h1>
      <p>Hi ${name || "there"},</p>
      <p>Use the verification code below to complete your sign-in. It expires in 10 minutes.</p>
      <div style="margin:24px 0;text-align:center;">
        <span style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;color:${NAVY};font-size:30px;font-weight:800;letter-spacing:10px;padding:16px 24px;border-radius:12px;">${code}</span>
      </div>
      <p style="font-size:13px;color:#64748b;">If you didn't request this, please change your password.</p>
    </div>
  </div>`;
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Server not configured" }, 500, origin);

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) return json({ error: "Too many requests" }, 429, origin);

  let payload: any;
  try { payload = await req.json(); }
  catch { return json({ error: "Invalid JSON" }, 400, origin); }

  const action = String(payload?.action ?? "");
  const email = String(payload?.email ?? "").toLowerCase();
  if (!isEmail(email)) return json({ error: "Invalid email" }, 400, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  if (action === "issue") {
    const code = genCode();
    const code_hash = await hashCode(email, code);
    const expires_at = new Date(Date.now() + TTL_MS).toISOString();

    // Invalidate any previous outstanding codes for this email.
    await admin.from("email_otps").update({ consumed: true }).eq("email", email).eq("consumed", false);
    const { error } = await admin.from("email_otps").insert({ email, code_hash, expires_at });
    if (error) return json({ error: "Could not issue code" }, 500, origin);

    if (!RESEND_API_KEY) return json({ sent: false, skipped: true, reason: "RESEND_API_KEY not set" }, 200, origin);
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: EMAIL_FROM, to: email,
          subject: "Your LANI Academy verification code",
          html: otpEmailHtml(String(payload?.name ?? ""), code),
        }),
      });
      return json({ sent: res.ok }, 200, origin);
    } catch {
      return json({ sent: false }, 200, origin);
    }
  }

  if (action === "verify") {
    const code = String(payload?.code ?? "").trim();
    if (!/^\d{6}$/.test(code)) return json({ verified: false, reason: "Invalid code format" }, 200, origin);

    const { data: rows } = await admin
      .from("email_otps")
      .select("*")
      .eq("email", email)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);

    const row = rows?.[0];
    if (!row) return json({ verified: false, reason: "No code issued" }, 200, origin);
    if (new Date(row.expires_at).getTime() < Date.now())
      return json({ verified: false, reason: "Code expired" }, 200, origin);
    if (row.attempts >= MAX_ATTEMPTS) {
      await admin.from("email_otps").update({ consumed: true }).eq("id", row.id);
      return json({ verified: false, reason: "Too many attempts" }, 200, origin);
    }

    const match = (await hashCode(email, code)) === row.code_hash;
    if (!match) {
      await admin.from("email_otps").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return json({ verified: false, reason: "Incorrect code" }, 200, origin);
    }

    await admin.from("email_otps").update({ consumed: true }).eq("id", row.id);
    return json({ verified: true }, 200, origin);
  }

  return json({ error: "Unknown action" }, 400, origin);
});
