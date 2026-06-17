import React, { useState } from "react";
import { X, CreditCard, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import type { Course } from "../lib/types";
import { formatMoney } from "../lib/utils";

interface CheckoutModalProps {
  course: Course;
  learnerName: string;
  learnerEmail: string;
  onClose: () => void;
  onPaymentComplete: (gateway: "Paystack" | "Flutterwave" | "Bank Transfer") => Promise<void>;
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
  const [gateway, setGateway] = useState<"Paystack" | "Flutterwave" | "Bank Transfer">("Paystack");
  const [step, setStep] = useState<"info" | "pay" | "otp" | "success">("info");
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleSubmitInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnerName.trim() || !learnerEmail.trim()) {
      setError("Please fill in your name and email.");
      return;
    }
    setError("");
    if (gateway === "Bank Transfer") {
      // Direct success or manual confirmation page
      setStep("pay");
    } else {
      setStep("pay");
    }
  };

  const handleSimulatePayment = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (gateway === "Bank Transfer") {
        setStep("success");
      } else {
        setStep("otp");
      }
    }, 1500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp !== "1234" && otp.trim() !== "") {
      setError("Invalid OTP. Try '1234' for simulation.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onPaymentComplete(gateway);
      setLoading(false);
      setStep("success");
    } catch (err) {
      setLoading(false);
      setError("Error saving enrollment to database.");
    }
  };

  const handleFinish = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-lani-navy">Secure Course Registration</h3>
            <p className="text-xs text-slate-500">{course.code} — {course.title}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-lani-navy">
            <X size={20} />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          {step === "info" && (
            <form onSubmit={handleSubmitInfo} className="grid gap-4">
              <label className="form-field">
                Learner Full Name
                <input
                  type="text"
                  required
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                  placeholder="John Doe"
                />
              </label>
              <label className="form-field">
                Learner Email
                <input
                  type="email"
                  required
                  value={learnerEmail}
                  onChange={(e) => setLearnerEmail(e.target.value)}
                  placeholder="john.doe@example.com"
                />
              </label>

              <div className="grid gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Payment Gateway</span>
                <div className="grid grid-cols-3 gap-2">
                  {(["Paystack", "Flutterwave", "Bank Transfer"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setGateway(opt)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3.5 text-center transition-all ${
                        gateway === opt
                          ? "border-lani-blue bg-lani-blue/5 text-lani-blue ring-1 ring-lani-blue"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard size={18} className="mb-1.5" />
                      <span className="text-xs font-bold">{opt}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                <div>
                  <span className="text-xs text-slate-400">Total payable</span>
                  <strong className="block text-lg font-bold text-lani-navy">{formatMoney(course.price)}</strong>
                </div>
                <button type="submit" className="btn-primary">
                  Continue to Pay
                  <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {step === "pay" && (
            <div className="grid gap-6 text-center py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lani-blue/10 text-lani-blue">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-lani-navy">Simulating {gateway} Payment</h4>
                <p className="mt-1 text-sm text-slate-500">
                  This mock integration connects secure tokens for {course.title}.
                </p>
              </div>

              {gateway === "Bank Transfer" ? (
                <div className="rounded-xl bg-slate-50 p-4 text-left text-sm leading-6 text-slate-600 grid gap-2 border border-slate-150">
                  <p><strong>Bank:</strong> LANI Group Academy Bank Plc</p>
                  <p><strong>Account:</strong> 101-202-3034</p>
                  <p><strong>Ref:</strong> LANI-{course.code.substring(0,4)}-{learnerName.replace(/\s+/g, "").substring(0,4).toUpperCase()}</p>
                  <p className="text-xs text-slate-400 mt-2">Transfer exact amount. Clicking pay will register pending verification.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 p-4 text-left grid gap-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Card Number"
                      defaultValue="4000 1234 5678 9010"
                      disabled
                      className="min-h-10 w-full rounded border border-slate-200 px-3 text-sm bg-slate-50"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Expiry"
                      defaultValue="12/29"
                      disabled
                      className="min-h-10 rounded border border-slate-200 px-3 text-sm bg-slate-50"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      defaultValue="•••"
                      disabled
                      className="min-h-10 rounded border border-slate-200 px-3 text-sm bg-slate-50"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Securing Connection...
                  </>
                ) : (
                  `Pay ${formatMoney(course.price)}`
                )}
              </button>
            </div>
          )}

          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="grid gap-6 text-center py-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-lani-navy">Enter Validation Code</h4>
                <p className="mt-1 text-sm text-slate-500">
                  Please enter the simulated OTP sent to your device.
                </p>
                <p className="text-xs font-bold text-lani-green mt-1">Hint: Enter "1234"</p>
              </div>

              <div className="mx-auto max-w-[12rem]">
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="••••"
                  className="h-12 text-center text-2xl font-bold tracking-widest rounded-lg border border-slate-200 focus:border-lani-blue focus:ring-4 focus:ring-lani-blue/10 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Verifying OTP...
                  </>
                ) : (
                  "Confirm Authentication"
                )}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="grid gap-6 text-center py-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lani-green/10 text-lani-green animate-bounce">
                <CheckCircle2 size={38} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-lani-navy">Payment Successful!</h4>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Congratulations, you have been successfully enrolled in <strong>{course.title}</strong>.
                  The enrollment and transaction logs are saved in the Supabase database.
                </p>
              </div>

              <button
                type="button"
                onClick={handleFinish}
                className="btn-primary w-full justify-center"
              >
                Go to Learner Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
