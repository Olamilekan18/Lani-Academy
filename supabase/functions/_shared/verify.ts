// Shared payment-verification helpers (used by verify-payment and enroll).
// Files under _shared are NOT deployed as their own function.

const PAYSTACK_SECRET = Deno.env.get("PAYSTACK_SECRET_KEY");
const FLUTTERWAVE_SECRET = Deno.env.get("FLUTTERWAVE_SECRET_KEY");

export interface VerifyResult {
  verified: boolean;
  configured: boolean;
  status?: string;
  amount?: number;   // in major units (naira)
  currency?: string;
  reason?: string;
}

export async function verifyPaystack(reference: string): Promise<VerifyResult> {
  if (!PAYSTACK_SECRET) return { verified: false, configured: false, reason: "Paystack secret not set" };
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` },
  });
  const body = await res.json().catch(() => ({} as any));
  const d = body?.data;
  const ok = res.ok && body?.status === true && d?.status === "success";
  return {
    verified: !!ok,
    configured: true,
    status: d?.status,
    amount: typeof d?.amount === "number" ? d.amount / 100 : undefined, // kobo → naira
    currency: d?.currency,
    reason: ok ? undefined : (body?.message || "Not a successful transaction"),
  };
}

export async function verifyFlutterwave(reference: string): Promise<VerifyResult> {
  if (!FLUTTERWAVE_SECRET) return { verified: false, configured: false, reason: "Flutterwave secret not set" };
  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(reference)}/verify`, {
    headers: { Authorization: `Bearer ${FLUTTERWAVE_SECRET}` },
  });
  const body = await res.json().catch(() => ({} as any));
  const d = body?.data;
  const ok = res.ok && body?.status === "success" && d?.status === "successful";
  return {
    verified: !!ok,
    configured: true,
    status: d?.status,
    amount: typeof d?.amount === "number" ? d.amount : undefined,
    currency: d?.currency,
    reason: ok ? undefined : (body?.message || "Not a successful transaction"),
  };
}

export async function verifyPayment(
  gateway: string,
  reference: string,
  expectedAmount?: number
): Promise<VerifyResult> {
  let r: VerifyResult;
  if (gateway === "Paystack") r = await verifyPaystack(reference);
  else if (gateway === "Flutterwave") r = await verifyFlutterwave(reference);
  else return { verified: false, configured: true, reason: `Unsupported gateway: ${gateway}` };

  if (r.verified && expectedAmount !== undefined && typeof r.amount === "number") {
    if (Math.round(r.amount) < Math.round(expectedAmount)) {
      return { ...r, verified: false, reason: "Amount mismatch" };
    }
  }
  return r;
}
