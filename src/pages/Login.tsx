import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { LogIn, UserPlus, Key, Mail, ShieldAlert, Loader2, Sparkles, BookOpen, Shield } from "lucide-react";
import { useLocation } from "react-router-dom";

interface LoginProps {
  portalRole: "learner" | "facilitator" | "admin" | "organization";
  onSuccess: () => void;
  onNavigate: (view: any) => void;
}

export default function Login({ portalRole, onSuccess, onNavigate }: LoginProps) {
  const { signIn, signUp, resetPassword, updateProfile } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get("mode") === "signup" ? "signup" : "signin";

  // Admin accounts are provisioned by a super admin — never self-serve.
  const allowSelfSignup = portalRole !== "admin";
  const [mode, setMode] = useState<"signin" | "signup" | "reset">(
    allowSelfSignup ? initialMode : "signin"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [orgName, setOrgName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
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
          
          // Elevate to the (non-admin) portal role. Admin/super_admin can
          // never be self-assigned — the DB trigger rejects it regardless.
          const updatePayload: any = {};
          if (portalRole !== "admin") updatePayload.role = portalRole;
          if (portalRole === "facilitator") {
            updatePayload.bio = bio;
            updatePayload.qualifications = qualifications;
          } else if (portalRole === "organization") {
            updatePayload.organisation = orgName;
            updatePayload.job_title = jobTitle;
          }
          await updateProfile(updatePayload);

          // Go straight into the app regardless of email confirmation blocker
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



  return (
    <div className="section min-h-[45rem] flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-left">
        
        {/* Brand Header */}
        <div className="text-center mb-8 space-y-2">
          <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow ${
            portalRole === "admin" ? "from-lani-blue to-blue-600" : portalRole === "facilitator" ? "from-lani-gold to-yellow-600" : "from-lani-green to-lani-emerald"
          }`}>
            {portalRole === "admin" ? <Shield size={22} /> : portalRole === "facilitator" ? <Sparkles size={22} /> : <BookOpen size={22} />}
          </div>
          <h2 className="text-xl font-bold text-lani-navy tracking-tight mt-3">
            {portalRole === "admin" ? "LANI Admin Console" : portalRole === "facilitator" ? "LANI Facilitator Portal" : "LANI Learner Portal"}
          </h2>
          <p className="text-xs text-slate-500">
            {portalRole === "admin"
              ? "Access administrative CRM metrics, leads capture, and courses management."
              : portalRole === "facilitator"
              ? "Access your course assignments, grading, and learner progress."
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
            <>
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
              {portalRole === "facilitator" && (
                <>
                  <label className="form-field">
                    Qualifications
                    <input
                      type="text"
                      required
                      value={qualifications}
                      onChange={(e) => setQualifications(e.target.value)}
                      placeholder="e.g. Ph.D. in Computer Science"
                    />
                  </label>
                  <label className="form-field">
                    Biography
                    <textarea
                      required
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="A short biography outlining your expertise..."
                      className="min-h-[80px]"
                    />
                  </label>
                </>
              )}
              {portalRole === "organization" && (
                <>
                  <label className="form-field">
                    Organization Name
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                    />
                  </label>
                  <label className="form-field">
                    Job Title / Role in Organization
                    <input
                      type="text"
                      required
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. HR Manager / L&D Director"
                    />
                  </label>
                </>
              )}
            </>
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
              portalRole === "admin" ? "bg-gradient-to-r from-lani-blue to-blue-600" : portalRole === "facilitator" ? "bg-gradient-to-r from-lani-gold to-yellow-600 border-none text-lani-navy" : ""
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
                {allowSelfSignup ? (
                  <button type="button" onClick={() => setMode("signup")} className="hover:text-lani-green">
                    Create new account
                  </button>
                ) : (
                  <span />
                )}
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
          {!allowSelfSignup && mode === "signin" && (
            <p className="text-center text-[11px] leading-5 text-slate-400">
              Admin accounts are provisioned by a LANI super admin. Contact your
              administrator for access — self-registration is disabled for security.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
