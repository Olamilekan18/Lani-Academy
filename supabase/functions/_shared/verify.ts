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
  customerEmail?: string;
  reference?: string;
  metadata?: Record<string, unknown>;
  reason?: string;
}

export interface VerifyExpectations {
  amount?: number;
  currency?: string;
  customerEmail?: string;
  courseId?: string;
  integration?: string;
}

function parseMetadata(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
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
    customerEmail: typeof d?.customer?.email === "string" ? d.customer.email.toLowerCase().trim() : undefined,
    reference: typeof d?.reference === "string" ? d.reference : undefined,
    metadata: parseMetadata(d?.metadata),
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
    customerEmail: typeof d?.customer?.email === "string" ? d.customer.email.toLowerCase().trim() : undefined,
    reference: typeof d?.tx_ref === "string" ? d.tx_ref : undefined,
    metadata: parseMetadata(d?.meta),
    reason: ok ? undefined : (body?.message || "Not a successful transaction"),
  };
}

export async function verifyPayment(
  gateway: string,
  reference: string,
  expectations: VerifyExpectations = {}
): Promise<VerifyResult> {
  let r: VerifyResult;
  if (gateway === "Paystack") r = await verifyPaystack(reference);
  else if (gateway === "Flutterwave") r = await verifyFlutterwave(reference);
  else return { verified: false, configured: true, reason: `Unsupported gateway: ${gateway}` };

  if (!r.verified) return r;

  if (!r.reference || r.reference !== reference) {
    return { ...r, verified: false, reason: "Transaction reference mismatch" };
  }
  if (expectations.amount !== undefined) {
    if (typeof r.amount !== "number" || Math.round(r.amount * 100) !== Math.round(expectations.amount * 100)) {
      return { ...r, verified: false, reason: "Amount mismatch" };
    }
  }
  if (expectations.currency && r.currency?.toUpperCase() !== expectations.currency.toUpperCase()) {
    return { ...r, verified: false, reason: "Currency mismatch" };
  }
  if (expectations.customerEmail && r.customerEmail !== expectations.customerEmail.toLowerCase().trim()) {
    return { ...r, verified: false, reason: "Payment customer mismatch" };
  }
  if (expectations.courseId && r.metadata?.course_id !== expectations.courseId) {
    return { ...r, verified: false, reason: "Payment course mismatch" };
  }
  if (expectations.integration && r.metadata?.integration !== expectations.integration) {
    return { ...r, verified: false, reason: "Payment source mismatch" };
  }
  return r;
}
