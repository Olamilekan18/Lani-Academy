// LANI Academy — verify-payment Edge Function (audit remediation C2)
// Verifies a payment reference server-side against the gateway using the
// SECRET key. This is a thin, reusable verification endpoint; the actual
// enrolment is granted server-side by the `enroll` function, which shares the
// same verification logic (../_shared/verify.ts).
//
// Deploy:   supabase functions deploy verify-payment
// Secrets:  supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx \
//             FLUTTERWAVE_SECRET_KEY=FLWSECK-xxx
//
// Response: { verified, configured, amount?, currency?, status?, reason? }

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { verifyPayment } from "../_shared/verify.ts";

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

serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);

  let payload: any;
  try { payload = await req.json(); }
  catch { return json({ error: "Invalid JSON" }, 400, origin); }

  const gateway = String(payload?.gateway ?? "");
  const reference = String(payload?.reference ?? "").trim();
  const expectedAmount = typeof payload?.expectedAmount === "number" ? payload.expectedAmount : undefined;
  if (!reference) return json({ verified: false, configured: true, reason: "Missing reference" }, 400, origin);

  try {
    const result = await verifyPayment(gateway, reference, expectedAmount);
    return json(result, 200, origin);
  } catch (e) {
    return json({ verified: false, configured: true, reason: String(e) }, 500, origin);
  }
});
