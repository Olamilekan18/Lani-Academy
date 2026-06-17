import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LogIn, UserPlus, Key, Mail, ShieldAlert, Loader2, Sparkles, BookOpen, Shield } from "lucide-react";

interface LoginProps {
  onSuccess: () => void;
  onNavigate: (view: any) => void;
  onForceDemoRole: (role: "learner" | "facilitator" | "admin") => void;
}

export default function Login({ onSuccess, onNavigate, onForceDemoRole }: LoginProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signin") {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err);
        } else {
          // Sync role base on current portal mode
          onForceDemoRole(isAdminMode ? "admin" : "learner");
          onSuccess();
        }
      } else if (mode === "signup") {
        if (!fullName.trim()) {
          setError("Full name is required.");
          setLoading(false);
          return;
        }
        const { data, error: err } = await signUp(email, password, fullName);
        if (err) {
          setError(err);
        } else {
          // Immediately log the user in
          const { error: signInErr } = await signIn(email, password);
          // Go straight into the app regardless of email confirmation blocker
          onForceDemoRole(isAdminMode ? "admin" : "learner");
          onSuccess();
        }
      } else if (mode === "reset") {
        const { error: err } = await resetPassword(email);
        if (err) {
          setError(err);
        } else {
          setMessage("Password reset email sent. Please check your inbox.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: "learner" | "facilitator" | "admin") => {
    onForceDemoRole(role);
    onSuccess();
  };

  return (
    <div className="section min-h-[45rem] flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-left">
        
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow ${
            isAdminMode ? "from-lani-blue to-blue-600" : "from-lani-green to-lani-emerald"
          }`}>
            {isAdminMode ? <Shield size={22} /> : <BookOpen size={22} />}
          </div>
          <h2 className="text-xl font-bold text-lani-navy tracking-tight mt-3">
            {isAdminMode ? "LANI Admin Console" : "LANI Learner Portal"}
          </h2>
          <p className="text-xs text-slate-500">
            {isAdminMode
              ? "Access administrative CRM metrics, leads capture, and courses management."
              : "Access your digital learning workspace and credentials."}
          </p>
        </div>

        {/* Feedback alerts */}
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs font-semibold text-red-600 flex gap-2 items-center">
            <ShieldAlert size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {message && (
          <div className="mb-4 rounded-lg bg-lani-mist p-3 text-xs font-semibold text-lani-green">
            {message}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="grid gap-4">
          {mode === "signup" && (
            <label className="form-field">
              Full Name
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </label>
          )}

          <label className="form-field">
            Work Email Address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </label>

          {mode !== "reset" && (
            <label className="form-field">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full justify-center mt-2 ${
              isAdminMode ? "bg-gradient-to-r from-lani-blue to-blue-600" : ""
            }`}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : mode === "signin" ? (
              <>
                <LogIn size={16} />
                Sign In
              </>
            ) : mode === "signup" ? (
              <>
                <UserPlus size={16} />
                Create Account
              </>
            ) : (
              <>
                <Key size={16} />
                Reset Password
              </>
            )}
          </button>
        </form>

        {/* Nav Links */}
        <div className="mt-6 flex flex-col items-center text-xs font-semibold text-slate-500 gap-3 border-t border-slate-100 pt-4">
          <div className="flex w-full justify-between gap-2">
            {mode === "signin" ? (
              <>
                <button type="button" onClick={() => setMode("signup")} className="hover:text-lani-green">
                  Create new account
                </button>
                <button type="button" onClick={() => setMode("reset")} className="hover:text-lani-green">
                  Forgot password?
                </button>
              </>
            ) : (
              <button type="button" onClick={() => setMode("signin")} className="hover:text-lani-green w-full text-center">
                Back to Sign In
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAdminMode(!isAdminMode);
              setMode("signin");
              setError("");
              setMessage("");
            }}
            className="text-slate-400 hover:text-lani-blue text-[11px] font-bold underline transition-colors mt-2"
          >
            {isAdminMode ? "Switch to Student Learner Portal" : "Administrator Portal Access"}
          </button>
        </div>

        {/* Quick Demo Shortcuts Banner */}
        <div className="mt-8 border-t border-slate-200 pt-6 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-lani-gold uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Developer Quick Bypass</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-4">
            Bypass email verification and login directly with pre-seeded role:
          </p>
          <div className="flex flex-col gap-2">
            {isAdminMode ? (
              <button
                onClick={() => handleQuickDemo("admin")}
                type="button"
                className="w-full rounded-lg border border-lani-blue/20 bg-lani-blue/5 py-2 text-center text-xs font-bold text-lani-blue hover:bg-lani-blue/10"
              >
                Sign In Admin (Bypass)
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleQuickDemo("learner")}
                  type="button"
                  className="w-full rounded-lg border border-lani-green/20 bg-lani-green/5 py-2 text-center text-xs font-bold text-lani-green hover:bg-lani-green/10"
                >
                  Sign In Learner (Bypass)
                </button>
                <button
                  onClick={() => handleQuickDemo("facilitator")}
                  type="button"
                  className="w-full rounded-lg border border-lani-gold/20 bg-lani-gold/5 py-2 text-center text-xs font-bold text-lani-gold hover:bg-lani-gold/10"
                >
                  Sign In Facilitator (Bypass)
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
