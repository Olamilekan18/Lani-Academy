// LANI Academy — paystack-webhook Edge Function
// Handles Paystack webhook events (such as charge.success) asynchronously.
// Ensures learners are enrolled even if their browser closes or drops connection
// during card authentication, bank transfer, or USSD payment.
//
// Deploy:   supabase functions deploy paystack-webhook
// Secret:   PAYSTACK_SECRET_KEY (set via `supabase secrets set PAYSTACK_SECRET_KEY=...`)
// URL:      https://<project-ref>.supabase.co/functions/v1/paystack-webhook
// Configure in Paystack: Settings → API Keys & Webhooks → Live/Test Webhook URL

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY") ?? "";

async function verifyHmac(bodyText: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret) return false;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(bodyText));
    const computed = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expected = computed.toLowerCase();
    const received = signature.toLowerCase();
    if (expected.length !== received.length) return false;
    let difference = 0;
    for (let index = 0; index < expected.length; index += 1) {
      difference |= expected.charCodeAt(index) ^ received.charCodeAt(index);
    }
    return difference === 0;
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Content-Type": "text/plain" } });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!PAYSTACK_SECRET || !SUPABASE_URL || !SERVICE_KEY) {
    console.error("Paystack webhook is not fully configured.");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature") || "";

  // 1. Every event must have a valid Paystack HMAC-SHA512 signature.
  const isValid = await verifyHmac(rawBody, signature, PAYSTACK_SECRET);
  if (!isValid) {
    console.warn("Paystack webhook rejected: Invalid signature");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // We are interested in successful charges
  if (event?.event === "charge.success") {
    const data = event.data || {};
    const reference = String(data.reference || "").trim();
    const learnerEmail = String(data.customer?.email || "").toLowerCase().trim();
    const amountKobo = Number(data.amount) || 0;
    const amountNaira = amountKobo / 100;
    const metadata = data.metadata && typeof data.metadata === "object" ? data.metadata : {};
    const courseId = String(metadata.course_id || "").trim();
    const metadataEmail = String(metadata.learner_email || "").toLowerCase().trim();
    const expectedAmount = Number(metadata.expected_amount);
    const promoCode = String(metadata.promo_code || "").trim().toUpperCase();
    const expectedDomain = PAYSTACK_SECRET.startsWith("sk_live_") ? "live" : "test";

    const paymentMatches = reference.startsWith("LANI-PSTK-")
      && metadata.integration === "lani-academy-v1"
      && learnerEmail
      && learnerEmail === metadataEmail
      && courseId
      && data.status === "success"
      && String(data.currency || "").toUpperCase() === "NGN"
      && data.domain === expectedDomain
      && Number.isFinite(expectedAmount)
      && Math.round(expectedAmount * 100) === amountKobo;

    if (!paymentMatches) {
      console.warn(`Rejected mismatched charge.success metadata for ref ${reference || "(missing)"}.`);
      return new Response(JSON.stringify({ error: "Payment details did not match" }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Verify course exists
    const { data: course } = await admin
      .from("courses")
      .select("id, title, price")
      .eq("id", courseId)
      .maybeSingle();

    if (!course) {
      console.warn(`Course ${courseId} not found in database.`);
      return new Response(JSON.stringify({ received: true, note: "Course not found" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Idempotency: Check if transaction already recorded
    const { data: existingTxn } = await admin
      .from("transactions")
      .select("id")
      .eq("receipt_number", reference)
      .maybeSingle();

    let transactionCreated = false;
    if (!existingTxn) {
      const { error: transactionError } = await admin.from("transactions").insert({
        course_id: courseId,
        learner_email: learnerEmail,
        amount: amountNaira,
        gateway: "Paystack",
        status: "Successful",
        receipt_number: reference,
      });
      if (transactionError) {
        console.error("Could not record Paystack webhook transaction", transactionError.message);
        return new Response(JSON.stringify({ error: "Could not record transaction" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      transactionCreated = true;
    }

    // Idempotency: Check if learner is already enrolled
    const { data: existingEnrollment } = await admin
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("learner_email", learnerEmail)
      .maybeSingle();

    if (!existingEnrollment) {
      const { data: profile } = await admin.from("profiles")
        .select("full_name")
        .eq("email", learnerEmail)
        .maybeSingle();
      const { error: enrollmentError } = await admin.from("enrollments").insert({
        course_id: courseId,
        learner_name: profile?.full_name || learnerEmail.split("@")[0],
        learner_email: learnerEmail,
        progress: 0,
        completed_lessons: [],
        payment_status: "Successful",
      });
      if (enrollmentError && enrollmentError.code !== "23505") {
        console.error("Could not create Paystack webhook enrolment", enrollmentError.message);
        return new Response(JSON.stringify({ error: "Could not create enrolment" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Send in-app notification
      await admin.from("notifications").insert({
        type: "payment",
        title: "Enrolment confirmed",
        body: `${course.title} — ₦${amountNaira.toLocaleString()}`,
        read: false,
        learner_email: learnerEmail,
      });
    }

    if (transactionCreated && promoCode) {
      const { data: promo } = await admin.from("promo_codes")
        .select("uses")
        .eq("code", promoCode)
        .maybeSingle();
      if (promo) {
        const currentUses = promo.uses || 0;
        await admin.from("promo_codes")
          .update({ uses: currentUses + 1 })
          .eq("code", promoCode)
          .eq("uses", currentUses);
      }
    }
  }

  // Paystack expects a 200 OK response
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
