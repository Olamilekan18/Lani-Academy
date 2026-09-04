import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { dbSendTemplateEmail, dbUploadFile, validateUpload, MAX_UPLOAD_MB } from "../lib/db";
import { LogIn, UserPlus, Key, Mail, ShieldAlert, Loader2, Sparkles, BookOpen, Shield, Video, FileText, Eye, EyeOff } from "lucide-react";
import { useLocation } from "react-router-dom";

interface LoginProps {
  portalRole: "learner" | "facilitator" | "admin" | "organization";
  onSuccess: () => void;
  onNavigate: (view: any) => void;
  /** Start the form in signup mode regardless of the URL query. */
  forceSignup?: boolean;
  /** Render just the card, without the full-page section wrapper. */
  embedded?: boolean;
}

export default function Login({ portalRole, onSuccess, onNavigate, forceSignup, embedded }: LoginProps) {
  const { signIn, signUp, resetPassword, updateProfile } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialMode =
    forceSignup || queryParams.get("mode") === "signup" ? "signup" : "signin";

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
  const [introVideo, setIntroVideo] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [orgName, setOrgName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
            // Optional 1-min intro video + CV/resume. Upload failures are
            // non-blocking — the account is still created.
            if (introVideo) {
              const url = await dbUploadFile(introVideo, "facilitator-videos", ["video/*"]);
              if (url) updatePayload.intro_video_url = url;
            }
            if (cvFile) {
              const url = await dbUploadFile(cvFile, "facilitator-cvs", [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              ]);
              if (url) updatePayload.cv_url = url;
            }
          } else if (portalRole === "organization") {
            updatePayload.organisation = orgName;
            updatePayload.job_title = jobTitle;
          } else if (portalRole === "learner") {
            updatePayload.phone = phone;
            updatePayload.country = country;
            updatePayload.state_region = stateRegion;
            updatePayload.city = city;
            updatePayload.gender = gender;
            updatePayload.date_of_birth = dob && dob.length === 10
              ? dob.slice(6, 10) + "-" + dob.slice(3, 5) + "-" + dob.slice(0, 2)
              : null;
          }
          const { error: profileErr } = await updateProfile(updatePayload);
          // A learner's role is already set by default at account creation, so a
          // failed details update there isn't fatal — let them in. But a
          // facilitator / organization account depends on the role update
          // succeeding; if it failed, surface it instead of sending them to a
          // dashboard that will bounce them.
          if (profileErr && (portalRole === "facilitator" || portalRole === "organization")) {
            setError(`Your account was created, but we couldn't set it up as a ${portalRole} account. ${profileErr}`);
            return;
          }

          // Welcome email (no-op until Resend is connected)
          void dbSendTemplateEmail(email, "welcome", { name: fullName, role: portalRole });

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



  const card = (
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

                  {/* Optional 1-minute intro video */}
                  <label className="form-field">
                    <span className="flex items-center gap-1.5">
                      <Video size={13} className="text-lani-gold" />
                      Intro video <span className="text-slate-400 font-normal">(optional, ~1 min)</span>
                    </span>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (f) {
                          const err = validateUpload(f, ["video/*"]);
                          if (err) { setError(err); e.target.value = ""; setIntroVideo(null); return; }
                          setError("");
                        }
                        setIntroVideo(f);
                      }}
                      className="mt-1.5 block w-full text-[11px] file:mr-2 file:rounded-md file:border-0 file:bg-lani-mist file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-lani-green"
                    />
                    <span className="mt-1 text-[10px] text-slate-400">
                      A short clip of you facilitating a course. Max {MAX_UPLOAD_MB}MB.
                    </span>
                  </label>

                  {/* Optional CV / resume */}
                  <label className="form-field">
                    <span className="flex items-center gap-1.5">
                      <FileText size={13} className="text-lani-gold" />
                      CV / Résumé <span className="text-slate-400 font-normal">(optional)</span>
                    </span>
                    <input
                      type="file"
                      accept="application/pdf,.doc,.docx"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        if (f) {
                          const err = validateUpload(f, [
                            "application/pdf",
                            "application/msword",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                          ]);
                          if (err) { setError(err); e.target.value = ""; setCvFile(null); return; }
                          setError("");
                        }
                        setCvFile(f);
                      }}
                      className="mt-1.5 block w-full text-[11px] file:mr-2 file:rounded-md file:border-0 file:bg-lani-mist file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-lani-green"
                    />
                    <span className="mt-1 text-[10px] text-slate-400">
                      PDF or Word document. Max {MAX_UPLOAD_MB}MB.
                    </span>
                  </label>
                </>
              )}
              {portalRole === "organization" && (
                <>
                  <label className="form-field">
                    Organisation Name
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Acme Corporation"
                    />
                  </label>
                  <label className="form-field">
                    Job Title / Role in Organisation
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
              {portalRole === "learner" && (
                <>
                  <label className="form-field">
                    Phone Number
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="form-field">
                      Country
                      <input
                        type="text"
                        required
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="e.g. Nigeria"
                      />
                    </label>
                    <label className="form-field">
                      State / Region
                      <input
                        type="text"
                        required
                        value={stateRegion}
                        onChange={(e) => setStateRegion(e.target.value)}
                        placeholder="e.g. Lagos"
                      />
                    </label>
                  </div>
                  <label className="form-field">
                    City
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Ikeja"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="form-field">
                      Gender
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                      >
                        <option value="">Select…</option>
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </label>
                    <label className="form-field">
                      Date of Birth
                      <input
                        type="text"
                        inputMode="numeric"
                        value={dob}
                        onChange={(e) => {
                          // Allow only digits and dashes, auto-insert dashes at dd- and dd-mm-
                          let v = e.target.value.replace(/[^0-9-]/g, "");
                          // Remove extra dashes the user may type manually
                          const digits = v.replace(/-/g, "");
                          // Auto-format: dd-mm-yyyy
                          if (digits.length <= 2) {
                            v = digits;
                          } else if (digits.length <= 4) {
                            v = digits.slice(0, 2) + "-" + digits.slice(2);
                          } else {
                            v = digits.slice(0, 2) + "-" + digits.slice(2, 4) + "-" + digits.slice(4, 8);
                          }
                          setDob(v);
                        }}
                        placeholder="dd-mm-yyyy"
                        maxLength={10}
                      />
                    </label>
                  </div>
                </>
              )}
            </>
          )}

          <label className="form-field">
            Email Address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
            />
          </label>

          {mode !== "reset" && (
            <div className="form-field">
              <span>Password</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
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
  );

  if (embedded) return card;

  return (
    <div className="section min-h-[45rem] flex items-center justify-center bg-slate-50">
      {card}
    </div>
  );
}
