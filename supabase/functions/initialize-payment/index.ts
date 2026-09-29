// LANI Academy — initialize-payment Edge Function
// Creates Paystack transactions server-side so the browser cannot choose the
// amount, learner identity, course metadata, or payment reference.

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((value) => value.trim()).filter(Boolean);

function corsHeaders(origin: string | null) {
  const allow = ALLOWED_ORIGINS.length === 0
    ? "*"
    : origin && ALLOWED_ORIGINS.includes(origin)
      ? origin
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

function randomHex(bytes = 8) {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ ok: false, reason: "Method not allowed" }, 405, origin);
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
    return json({ ok: false, reason: "Payment server is not configured" }, 503, origin);
  }
  if (!/^sk_(test|live)_/.test(PAYSTACK_SECRET)) {
    return json({ ok: false, reason: "Paystack is not configured" }, 503, origin);
  }

  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ ok: false, reason: "Unauthorized" }, 401, origin);

  const asUser = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: userError } = await asUser.auth.getUser(token);
  if (userError || !user?.email) return json({ ok: false, reason: "Unauthorized" }, 401, origin);

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return json({ ok: false, reason: "Invalid JSON" }, 400, origin);
  }

  const courseId = String(payload.courseId ?? "").trim();
  const promoCode = String(payload.promoCode ?? "").trim().toUpperCase();
  if (!courseId) return json({ ok: false, reason: "Missing courseId" }, 400, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title, code, price, status")
    .eq("id", courseId)
    .maybeSingle();
  if (courseError || !course) return json({ ok: false, reason: "Course not found" }, 404, origin);
  if (course.status && course.status !== "Open") {
    return json({ ok: false, reason: "This course is not currently open for enrolment" }, 409, origin);
  }

  const email = user.email.toLowerCase().trim();
  const { data: existingEnrollment } = await admin.from("enrollments")
    .select("id")
    .eq("course_id", courseId)
    .eq("learner_email", email)
    .maybeSingle();
  if (existingEnrollment) {
    return json({ ok: false, reason: "You are already enrolled in this course" }, 409, origin);
  }

  const basePrice = Number(course.price) || 0;
  let amount = basePrice;
  if (promoCode && basePrice > 0) {
    const { data: promo } = await admin
      .from("promo_codes")
      .select("code, active, expires_at, max_uses, uses, discount_percent")
      .eq("code", promoCode)
      .maybeSingle();
    const valid = promo?.active
      && (!promo.expires_at || new Date(promo.expires_at) >= new Date())
      && (!promo.max_uses || (promo.uses || 0) < promo.max_uses)
      && typeof promo.discount_percent === "number"
      && promo.discount_percent >= 0
      && promo.discount_percent <= 100;
    if (!valid) return json({ ok: false, reason: "Promo code is invalid or expired" }, 409, origin);
    amount = Math.max(0, Math.round(basePrice * (1 - promo.discount_percent / 100)));
  }

  const reference = `LANI-PSTK-${Date.now()}-${randomHex(6)}`;
  if (amount <= 0) {
    return json({ ok: true, free: true, reference, amount: 0 }, 200, origin);
  }

  const metadata = {
    integration: "lani-academy-v1",
    course_id: course.id,
    learner_email: email,
    promo_code: promoCode || null,
    expected_amount: amount,
    custom_fields: [
      { display_name: "Course", variable_name: "course", value: `${course.code} — ${course.title}` },
      ...(promoCode
        ? [{ display_name: "Promo Code", variable_name: "promo_code", value: promoCode }]
        : []),
    ],
  };

  try {
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: String(Math.round(amount * 100)),
        currency: "NGN",
        reference,
        channels: ["card", "bank", "ussd", "bank_transfer"],
        metadata,
      }),
    });
    const body = await response.json().catch(() => ({}));
    const accessCode = body?.data?.access_code;
    const returnedReference = body?.data?.reference;
    if (!response.ok || body?.status !== true || !accessCode || returnedReference !== reference) {
      console.error("Paystack initialization failed", response.status, body?.message || "Unknown error");
      return json({ ok: false, reason: body?.message || "Could not initialize Paystack payment" }, 502, origin);
    }
    return json({ ok: true, accessCode, reference, amount }, 200, origin);
  } catch (error) {
    console.error("Paystack initialization request failed", error);
    return json({ ok: false, reason: "Could not reach Paystack" }, 502, origin);
  }
});
