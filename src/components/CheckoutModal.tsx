import React, { useState, useEffect } from "react";
import {
  X,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Building2,
  Lock,
  Upload,
} from "lucide-react";
import type { Course } from "../lib/types";
import type { BankTransferMeta } from "../lib/db";
import { formatMoney } from "../lib/utils";
import { dbValidatePromo, dbUploadFile } from "../lib/db";

type Gateway = "Paystack" | "Flutterwave" | "Bank Transfer";

interface CheckoutModalProps {
  course: Course;
  learnerName: string;
  learnerEmail: string;
  onClose: () => void;
  onPaymentComplete: (
    gateway: Gateway,
    reference?: string,
    amount?: number,
    bankMeta?: BankTransferMeta
  ) => Promise<void>;
}

// Public keys are safe to expose on the client for both gateways.
const PAYSTACK_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined;
const FLUTTERWAVE_KEY = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY as string | undefined;

declare global {
  interface Window {
    PaystackPop?: any;
    FlutterwaveCheckout?: any;
  }
}

// Loads an external script once and resolves when ready.
function loadScript(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutModal({
  course,
  learnerName: initialName,
  learnerEmail: initialEmail,
  onClose,
  onPaymentComplete,
}: CheckoutModalProps) {
  const [learnerName, setLearnerName] = useState(initialName);
  const [learnerEmail, setLearnerEmail] = useState(initialEmail);
  const [gateway, setGateway] = useState<Gateway>("Paystack");
  const [step, setStep] = useState<"info" | "pay" | "success">("info");
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [promo, setPromo] = useState("");
  const [discount, setDiscount] = useState(0); // percent
  const [promoMsg, setPromoMsg] = useState("");
  const [checkingPromo, setCheckingPromo] = useState(false);

  // Bank transfer form fields
  const [btDepositor, setBtDepositor] = useState("");
  const [btBank, setBtBank] = useState("");
  const [btRef, setBtRef] = useState("");
  const [btReceiptFile, setBtReceiptFile] = useState<File | null>(null);
  const [btReceiptPreview, setBtReceiptPreview] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const finalAmount = Math.max(0, Math.round(course.price * (1 - discount / 100)));

  const applyPromo = async () => {
    if (!promo.trim()) return;
    setCheckingPromo(true);
    setPromoMsg("");
    const res = await dbValidatePromo(promo);
    setCheckingPromo(false);
    if (res && res.discountPercent > 0) {
      setDiscount(res.discountPercent);
      setPromoMsg(`✓ ${res.discountPercent}% discount applied`);
    } else {
      setDiscount(0);
      setPromoMsg("Invalid or expired code");
    }
  };

  const liveKey = gateway === "Paystack" ? PAYSTACK_KEY : gateway === "Flutterwave" ? FLUTTERWAVE_KEY : undefined;
  const isCardGateway = gateway === "Paystack" || gateway === "Flutterwave";
  const demoMode = isCardGateway && !liveKey;

  // Preload gateway scripts as soon as the modal opens.
  useEffect(() => {
    if (PAYSTACK_KEY) loadScript("https://js.paystack.co/v1/inline.js");
    if (FLUTTERWAVE_KEY) loadScript("https://checkout.flutterwave.com/v3.js");
  }, []);

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerName.trim() || !learnerEmail.trim()) {
      setError("Please fill in your name and email.");
      return;
    }
    setError("");
    setStep("pay");
  };

  const finalise = async (gw: Gateway, ref: string, bankMeta?: BankTransferMeta) => {
    setLoading(true);
    try {
      // The enrolment is granted server-side only after the gateway confirms
      // the charge (audit remediation C2). onPaymentComplete throws with a
      // reason if verification/enrolment fails.
      await onPaymentComplete(gw, ref, finalAmount, bankMeta);
      setReference(ref);
      setStep("success");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg || `We couldn't complete your enrolment. If you were charged, contact support with reference ${ref}.`);
    } finally {
      setLoading(false);
    }
  };

  // ── Real Paystack inline checkout ────────────────────────────
  const payWithPaystack = async () => {
    setError("");
    const ok = await loadScript("https://js.paystack.co/v1/inline.js");
    if (!ok || !window.PaystackPop) {
      setError("Could not reach Paystack. Check your connection and try again.");
      return;
    }
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_KEY,
      email: learnerEmail,
      amount: Math.round(finalAmount * 100), // kobo
      currency: "NGN",
      metadata: {
        custom_fields: [
          { display_name: "Learner", variable_name: "learner_name", value: learnerName },
          { display_name: "Course", variable_name: "course", value: `${course.code} — ${course.title}` },
        ],
      },
      callback: (response: { reference: string }) => {
        void finalise("Paystack", response.reference);
      },
      onClose: () => setError("Payment window closed before completion."),
    });
    handler.openIframe();
  };

  // ── Real Flutterwave inline checkout ─────────────────────────
  const payWithFlutterwave = async () => {
    setError("");
    const ok = await loadScript("https://checkout.flutterwave.com/v3.js");
    if (!ok || !window.FlutterwaveCheckout) {
      setError("Could not reach Flutterwave. Check your connection and try again.");
      return;
    }
    const txRef = "LANI-" + Date.now();
    window.FlutterwaveCheckout({
      public_key: FLUTTERWAVE_KEY,
      tx_ref: txRef,
      amount: finalAmount,
      currency: "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: { email: learnerEmail, name: learnerName },
      customizations: {
        title: "LANI Academy",
        description: `${course.code} — ${course.title}`,
      },
      callback: (data: { transaction_id?: string; tx_ref: string }) => {
        void finalise("Flutterwave", String(data.transaction_id || data.tx_ref));
      },
      onclose: () => {},
    });
  };

  // ── Demo fallback (no key configured) ────────────────────────
  const payDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      void finalise(gateway, "DEMO-" + Math.floor(100000 + Math.random() * 900000));
    }, 1400);
  };

  // ── Bank transfer submit handler ─────────────────────────────
  const handleBankTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!btDepositor.trim()) { setError("Please enter the depositor's name."); return; }
    if (!btBank.trim()) { setError("Please enter the bank name."); return; }
    setError("");

    let receiptUrl: string | undefined;
    if (btReceiptFile) {
      setUploadingReceipt(true);
      const uploaded = await dbUploadFile(btReceiptFile, "receipts", ["image/*", "application/pdf"]);
      setUploadingReceipt(false);
      if (uploaded) {
        receiptUrl = uploaded;
      } else {
        setError("Invalid file type or dangerous file extension detected.");
        return;
      }
    }

    const bankMeta: BankTransferMeta = {
      depositorName: btDepositor.trim(),
      sourceBank: btBank.trim(),
      transferReference: btRef.trim() || undefined,
      receiptUrl,
    };

    void finalise("Bank Transfer", "BT-" + Math.floor(100000 + Math.random() * 900000), bankMeta);
  };

  const handlePay = () => {
    if (gateway === "Bank Transfer") {
      // Handled by the form submit
      return;
    }
    if (demoMode) return payDemo();
    if (gateway === "Paystack") return void payWithPaystack();
    if (gateway === "Flutterwave") return void payWithFlutterwave();
  };

  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setBtReceiptFile(file);
    setBtReceiptPreview(file ? URL.createObjectURL(file) : "");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-lani-navy/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-lani-navy">
              <Lock size={16} className="text-lani-green" />
              Secure Checkout
            </h3>
            <p className="text-xs text-slate-500">{course.code} — {course.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-lani-navy">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600">{error}</div>
          )}

          {step === "info" && (
            <form onSubmit={handleSubmitInfo} className="grid gap-4">
              <label className="form-field">
                Learner Full Name
                <input type="text" required value={learnerName} onChange={(e) => setLearnerName(e.target.value)} placeholder="John Doe" />
              </label>
              <label className="form-field">
                Learner Email
                <input type="email" required value={learnerEmail} onChange={(e) => setLearnerEmail(e.target.value)} placeholder="john.doe@example.com" />
              </label>

              <div className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Method</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["Paystack", "Flutterwave", "Bank Transfer"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setGateway(opt)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all ${
                        gateway === opt
                          ? "border-lani-green bg-lani-green/5 text-lani-green ring-1 ring-lani-green"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {opt === "Bank Transfer" ? <Building2 size={18} className="mb-1.5" /> : <CreditCard size={18} className="mb-1.5" />}
                      <span className="text-xs font-bold">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Promo code */}
              <div className="grid gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Promo code <span className="font-medium normal-case text-slate-400">(optional)</span></span>
                <div className="flex gap-2">
                  <input
                    value={promo}
                    onChange={(e) => { setPromo(e.target.value.toUpperCase()); setPromoMsg(""); }}
                    placeholder="Enter code"
                    className="h-11 flex-1 rounded-lg border border-slate-200 px-3 text-sm uppercase outline-none focus:border-lani-green focus:ring-2 focus:ring-lani-green/10"
                  />
                  <button type="button" onClick={applyPromo} disabled={checkingPromo || !promo.trim()} className="btn-secondary min-h-11 px-4 text-xs disabled:opacity-50">
                    {checkingPromo ? "Checking…" : "Apply"}
                  </button>
                </div>
                {promoMsg && <span className={`text-[11px] font-semibold ${discount > 0 ? "text-lani-green" : "text-red-500"}`}>{promoMsg}</span>}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <span className="text-xs text-slate-400">Total payable</span>
                  {discount > 0 ? (
                    <div className="flex items-baseline gap-2">
                      <strong className="block text-lg font-bold text-lani-navy">{formatMoney(finalAmount)}</strong>
                      <span className="text-xs text-slate-400 line-through">{formatMoney(course.price)}</span>
                    </div>
                  ) : (
                    <strong className="block text-lg font-bold text-lani-navy">{formatMoney(course.price)}</strong>
                  )}
                </div>
                <button type="submit" className="btn-primary">
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {step === "pay" && (
            <div className="grid gap-6 py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lani-green/10 text-lani-green text-center">
                <ShieldCheck size={28} />
              </div>
              <div className="text-center">
                <h4 className="text-lg font-bold text-lani-navy">
                  {gateway === "Bank Transfer" ? "Bank Transfer Instructions" : `Pay with ${gateway}`}
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                  {gateway === "Bank Transfer"
                    ? "Transfer the exact amount to the account below, then fill in your transfer details."
                    : demoMode
                    ? "Demo mode — no live key configured. A simulated payment will be recorded."
                    : `You'll complete payment securely in the ${gateway} window.`}
                </p>
              </div>

              {gateway === "Bank Transfer" && (
                <>
                  {/* Transfer target details */}
                  <div className="rounded-xl border border-lani-green/20 bg-lani-mist p-5 space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-lani-green">Transfer To</h5>
                    <div className="grid gap-1.5 text-sm leading-6 text-slate-700">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Bank:</span>
                        <span className="font-bold text-lani-navy">Access Bank Plc</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Account Name:</span>
                        <span className="font-bold text-lani-navy">LANI Group Academy</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Account Number:</span>
                        <span className="font-bold text-lani-navy font-mono tracking-wider">101-202-3034</span>
                      </div>
                      <div className="flex justify-between border-t border-lani-green/10 pt-2 mt-1">
                        <span className="text-slate-500 font-medium">Amount to Transfer:</span>
                        <span className="font-extrabold text-lani-green text-base">{formatMoney(finalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bank transfer proof form */}
                  <form onSubmit={handleBankTransferSubmit} className="grid gap-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Transfer Details</h5>

                    <label className="form-field">
                      Depositor Name <span className="text-red-400">*</span>
                      <input
                        type="text"
                        required
                        value={btDepositor}
                        onChange={(e) => setBtDepositor(e.target.value)}
                        placeholder="Name on the sending account"
                      />
                    </label>

                    <label className="form-field">
                      Bank Name <span className="text-red-400">*</span>
                      <input
                        type="text"
                        required
                        value={btBank}
                        onChange={(e) => setBtBank(e.target.value)}
                        placeholder="e.g. GTBank, First Bank"
                      />
                    </label>

                    <label className="form-field">
                      Transfer Reference / Session ID <span className="text-slate-400 font-normal">(optional)</span>
                      <input
                        type="text"
                        value={btRef}
                        onChange={(e) => setBtRef(e.target.value)}
                        placeholder="e.g. 1234567890"
                      />
                    </label>

                    <label className="form-field">
                      Upload Receipt <span className="text-slate-400 font-normal">(optional)</span>
                      <div className="relative mt-1">
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={handleReceiptChange}
                          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-lani-green/10 file:px-3 file:py-2 file:text-xs file:font-bold file:text-lani-green hover:file:bg-lani-green/20 cursor-pointer"
                        />
                      </div>
                    </label>

                    {btReceiptPreview && btReceiptFile?.type.startsWith("image/") && (
                      <img src={btReceiptPreview} alt="Receipt preview" className="h-28 w-auto rounded-lg border border-slate-200 object-contain" />
                    )}

                    <p className="text-[11px] text-slate-400 leading-4">
                      Your enrolment will be activated once our admin team confirms the transfer. This usually takes 1–2 business hours.
                    </p>

                    <button type="submit" disabled={loading || uploadingReceipt} className="btn-primary w-full justify-center">
                      {loading || uploadingReceipt ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          {uploadingReceipt ? "Uploading receipt..." : "Processing..."}
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Submit Transfer for Confirmation
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {demoMode && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-left text-xs font-semibold text-amber-800">
                  To enable live card payments, set <code className="font-mono">VITE_{gateway === "Paystack" ? "PAYSTACK" : "FLUTTERWAVE"}_PUBLIC_KEY</code> in your <code className="font-mono">.env</code>.
                </div>
              )}

              {gateway !== "Bank Transfer" && (
                <button type="button" onClick={handlePay} disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ${formatMoney(finalAmount)}`
                  )}
                </button>
              )}

              <button type="button" onClick={() => setStep("info")} className="text-xs font-semibold text-slate-400 hover:text-lani-navy text-center">
                ← Back
              </button>
            </div>
          )}

          {step === "success" && (
            <div className="grid gap-5 text-center py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lani-green/10 text-lani-green">
                <CheckCircle2 size={38} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-lani-navy">
                  {gateway === "Bank Transfer" ? "Submitted for Confirmation" : "Payment Successful!"}
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {gateway === "Bank Transfer"
                    ? <>Your enrolment in <strong>{course.title}</strong> is pending admin confirmation of your transfer. You'll be notified once it's approved.</>
                    : <>You're enrolled in <strong>{course.title}</strong>. A receipt has been recorded to your account.</>}
                </p>
                {reference && (
                  <p className="mt-2 text-xs font-mono text-slate-400">Ref: {reference}</p>
                )}
              </div>
              <button type="button" onClick={onClose} className="btn-primary w-full justify-center">
                Go to Learner Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
