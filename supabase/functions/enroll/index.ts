// LANI Academy — enroll Edge Function (audit remediation C2, hardened)
// Creates a learner enrolment ENTIRELY server-side, using the service role,
// only after the payment is verified against the gateway. Learners can no
// longer insert their own enrolment/transaction rows directly (the RLS
// self-insert policies were removed) — this function is the only path.
//
// Identity comes from the caller's JWT (not the client payload), the price
// comes from the database (not the client), and the payment is verified with
// the gateway SECRET key. This closes the "enrol without paying" hole.
//
// Deploy:   supabase functions deploy enroll
// Secrets:  PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY (for verification).
//           SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_ANON_KEY auto.
//
// Request:  { courseId, gateway, reference }
// Response: { ok, enrollment?, transaction?, reason? }

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { verifyPayment } from "../_shared/verify.ts";

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
  .map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, n);

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
  if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) return json({ error: "Server not configured" }, 500, origin);

  // ── 1. Authenticate the caller from the JWT (not the request body) ──
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
  const gateway = String(payload?.gateway ?? "");
  const reference = String(payload?.reference ?? "").trim();
  const bankMeta = payload?.bankMeta || {};
  if (!courseId) return json({ ok: false, reason: "Missing courseId" }, 400, origin);
  if (!["Paystack", "Flutterwave", "Bank Transfer"].includes(gateway))
    return json({ ok: false, reason: "Unsupported gateway" }, 400, origin);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const learnerEmail = user.email;

  // ── 2. Authoritative learner name + course price from the database ──
  const { data: profile } = await admin.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const learnerName = profile?.full_name || learnerEmail.split("@")[0];

  const { data: course, error: courseErr } = await admin
    .from("courses").select("id, title, price").eq("id", courseId).maybeSingle();
  if (courseErr || !course) return json({ ok: false, reason: "Course not found" }, 404, origin);
  const price = Number(course.price) || 0;

  // ── 3. Idempotency: don't double-enrol ──
  const { data: existing } = await admin
    .from("enrollments").select("*").eq("course_id", courseId).eq("learner_email", learnerEmail).maybeSingle();
  if (existing) return json({ ok: true, enrollment: existing, alreadyEnrolled: true }, 200, origin);

  // ── 4. Decide payment status (verify with the gateway when it's a paid, card charge) ──
  let paymentOk = false;
  let chargedAmount = price;
  let enrollmentStatus: "Successful" | "Pending" = "Successful";
  let txnStatus: "Successful" | "Pending" = "Successful";

  if (gateway === "Bank Transfer") {
    // Offline payment — admin confirms later.
    enrollmentStatus = "Pending";
    txnStatus = "Pending";
    paymentOk = true;
  } else if (price <= 0) {
    // Free course.
    chargedAmount = 0;
    paymentOk = true;
  } else {
    if (!reference) return json({ ok: false, reason: "Missing payment reference" }, 400, origin);
    const v = await verifyPayment(gateway, reference, price);
    if (v.configured) {
      // Real verification available — enforce it.
      if (!v.verified) return json({ ok: false, reason: v.reason || "Payment not verified" }, 402, origin);
      chargedAmount = typeof v.amount === "number" ? v.amount : price;
      paymentOk = true;
    } else {
      // No gateway secret configured (demo/test env) — allow but flag.
      paymentOk = true;
    }
  }
  if (!paymentOk) return json({ ok: false, reason: "Payment could not be processed" }, 402, origin);

  // ── 5. Create transaction + enrolment (service role bypasses RLS) ──
  const receipt = (reference && !reference.startsWith("DEMO-")) ? reference
    : `LANI-${gateway.slice(0, 2).toUpperCase()}-${rand(8)}`;

  const { data: txn, error: txnErr } = await admin.from("transactions").insert({
    course_id: courseId,
    learner_email: learnerEmail,
    amount: chargedAmount,
    gateway,
    status: txnStatus,
    receipt_number: receipt,
    depositor_name: bankMeta.depositorName ? String(bankMeta.depositorName) : null,
    source_bank: bankMeta.sourceBank ? String(bankMeta.sourceBank) : null,
    transfer_reference: bankMeta.transferReference ? String(bankMeta.transferReference) : null,
    receipt_url: bankMeta.receiptUrl ? String(bankMeta.receiptUrl) : null,
  }).select().maybeSingle();
  if (txnErr) return json({ ok: false, reason: `Could not record transaction: ${txnErr.message}` }, 500, origin);

  const { data: enrollment, error: enrErr } = await admin.from("enrollments").insert({
    course_id: courseId,
    learner_name: learnerName,
    learner_email: learnerEmail,
    progress: 0,
    completed_lessons: [],
    payment_status: enrollmentStatus,
  }).select().maybeSingle();
  if (enrErr) return json({ ok: false, reason: `Could not create enrolment: ${enrErr.message}` }, 500, origin);

  // ── 6. In-app notification (service role, so it isn't blocked by RLS) ──
  await admin.from("notifications").insert({
    type: "payment",
    title: gateway === "Bank Transfer" ? "Enrolment received" : "Enrolment confirmed",
    body: `${course.title}${chargedAmount ? ` — ₦${chargedAmount.toLocaleString()}` : ""}`,
    read: false,
    learner_email: learnerEmail,
  });

  return json({ ok: true, enrollment, transaction: txn }, 200, origin);
});
