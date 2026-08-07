import React, { useEffect, useRef, useState } from "react";
import { ShieldCheck, Loader2, LogOut, RefreshCw } from "lucide-react";
import { generateOtp, sendOtpEmail } from "../lib/twoFactor";

interface TwoFactorModalProps {
  email: string;
  name: string;
  onVerified: () => void;
  onCancel: () => void; // e.g. sign out
}

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN = 30; // seconds

export default function TwoFactorModal({ email, name, onVerified, onCancel }: TwoFactorModalProps) {
  const codeRef = useRef<string>("");
  const expiryRef = useRef<number>(0);
  const [entry, setEntry] = useState("");
  const [sending, setSending] = useState(true);
  const [delivered, setDelivered] = useState<boolean | null>(null);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const issueCode = async () => {
    setSending(true);
    setError("");
    const code = generateOtp();
    codeRef.current = code;
    expiryRef.current = Date.now() + CODE_TTL_MS;
    const ok = await sendOtpEmail(email, name, code);
    setDelivered(ok);
    setSending(false);
    setCooldown(RESEND_COOLDOWN);
  };

  // Send a code on open
  useEffect(() => {
    void issueCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const verify = (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() > expiryRef.current) {
      setError("That code has expired. Please request a new one.");
      return;
    }
    if (entry.trim() === codeRef.current) {
      onVerified();
    } else {
      setError("Incorrect code. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-lani-navy/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lani-green/10 text-lani-green">
          <ShieldCheck size={28} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-lani-navy">Two-step verification</h3>
        <p className="mt-1 text-xs leading-6 text-slate-500">
          We sent a 6-digit code to <strong className="text-lani-navy">{email}</strong>. Enter it to continue.
        </p>

        {sending && (
          <p className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Loader2 size={13} className="animate-spin" /> Sending code…
          </p>
        )}
        {delivered === false && !sending && (
          <p className="mt-3 rounded-lg bg-amber-50 p-2.5 text-[11px] font-semibold text-amber-700">
            Email couldn't be sent — check that the send-email function and Resend key are configured.
          </p>
        )}

        <form onSubmit={verify} className="mt-5 grid gap-4">
          <input
            inputMode="numeric"
            maxLength={6}
            value={entry}
            onChange={(e) => { setEntry(e.target.value.replace(/\D/g, "")); setError(""); }}
            placeholder="••••••"
            className="h-12 rounded-lg border border-slate-200 text-center text-2xl font-bold tracking-[0.5em] text-lani-ink outline-none focus:border-lani-green focus:ring-2 focus:ring-lani-green/20"
            autoFocus
          />
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          <button type="submit" disabled={entry.length !== 6} className="btn-primary w-full justify-center disabled:opacity-50">
            Verify & continue
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs font-semibold">
          <button
            type="button"
            onClick={() => cooldown === 0 && issueCode()}
            disabled={cooldown > 0 || sending}
            className="inline-flex items-center gap-1 text-lani-blue hover:underline disabled:text-slate-300"
          >
            <RefreshCw size={12} /> {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
          <button type="button" onClick={onCancel} className="inline-flex items-center gap-1 text-slate-400 hover:text-lani-navy">
            <LogOut size={12} /> Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
