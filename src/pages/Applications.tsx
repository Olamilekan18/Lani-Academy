import React, { useState } from "react";
import { Award, GraduationCap, Clock, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { dbSaveApplication, dbUploadFile } from "../lib/db";

export default function Applications() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);

    // Upload any supporting documents
    const files = (formData.getAll("attachments") as File[]).filter((f) => f && f.size > 0);
    const attachments: { name: string; url: string }[] = [];
    for (const f of files) {
      const url = await dbUploadFile(f, "applications");
      if (url) attachments.push({ name: f.name, url });
    }

    const appData = {
      id: "app-" + Math.random().toString(36).substring(2, 8),
      programmeType: formData.get("programmeType") as string,
      applicantName: formData.get("applicantName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      location: formData.get("location") as string,
      organisation: formData.get("organisation") as string,
      motivation: formData.get("motivation") as string,
      status: "Submitted" as const,
      score: 0,
      createdAt: new Date().toISOString().split("T")[0],
      attachments,
    };

    try {
      const ok = await dbSaveApplication(appData);
      if (ok) {
        setSubmitted(true);
        e.currentTarget.reset();
      } else {
        setError("Database error. Please try again.");
      }
    } catch (err) {
      setError("Failed to save application to database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section bg-white text-left min-h-[50rem]">
      {/* Page Header */}
      <div className="mb-12 max-w-3xl">
        <span className="eyebrow">Sponsored Cohorts</span>
        <h1 className="mt-3 text-3xl font-extrabold text-lani-navy tracking-tight sm:text-4xl">
          Apply for Thematic Scholarships
        </h1>
        <p className="mt-2 text-slate-500 text-sm leading-6">
          LANI Academy partners with international donors and corporate CSR foundations to sponsor high-potential applicants into intensive bootcamps. Review requirements and submit your candidacy.
        </p>
      </div>

      {/* Split Layout */}
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        
        {/* Left: Eligibility info */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-lani-navy tracking-tight">Active Sponsored Programmes</h2>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              Select which cohort you qualify for in the application form.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              {
                title: "Development Sector Capacity Grant",
                target: "NGO managers, public sector administrators, community organisers.",
                focus: "Monitoring & Evaluation, ESG framework compliance."
              },
              {
                title: "Emerging Tech Leader Bootcamp",
                target: "Recent graduates, junior engineers, startup founders.",
                focus: "Fintech product design, agile product management."
              },
              {
                title: "Tax & Compliance Professionals Cohort",
                target: "Finance students, independent accountants, SME administrators.",
                focus: "Tax compliance, regulatory frameworks."
              }
            ].map((cohort) => (
              <div key={cohort.title} className="rounded-xl border border-slate-100 bg-slate-50 p-5 grid gap-2 transition-all hover:bg-white hover:shadow-sm">
                <h3 className="text-sm font-bold text-lani-navy flex items-center gap-2">
                  <GraduationCap size={16} className="text-lani-blue" />
                  {cohort.title}
                </h3>
                <p className="text-xs text-slate-500 leading-5">
                  <strong>Target Group:</strong> {cohort.target}
                </p>
                <p className="text-[10px] text-lani-green font-bold uppercase tracking-wider">
                  CURRICULUM: {cohort.focus}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-5 flex gap-3 text-xs text-amber-800 leading-6 border-dashed">
            <AlertTriangle size={24} className="shrink-0 text-amber-600 mt-1" />
            <div>
              <strong className="block text-amber-900 font-bold">Important Notice</strong>
              Due to high interest, sponsored seats are awarded based on academic scores and motivation essays. Duplicate applications under different emails will result in immediate disqualification.
            </div>
          </div>
        </div>

        {/* Right: Intake Form */}
        <div className="form-panel shadow-lg border border-slate-200">
          {submitted ? (
            <div className="py-24 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lani-green/10 text-lani-green">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-lg font-bold text-lani-navy">Application Received</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-6">
                Your application details have been saved directly to Supabase. The cohort review panel will evaluate essays and score details on the admin dashboard.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="btn-secondary text-xs px-4"
              >
                Submit New Application
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Intake Form</span>
                <h3 className="text-lg font-bold text-lani-navy mt-1">Candidacy Registration</h3>
              </div>

              {error && (
                <div className="sm:col-span-2 rounded bg-red-50 p-3 text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              <label className="form-field sm:col-span-2">
                Select Sponsored Programme Cohort
                <select name="programmeType" required>
                  <option>Development Sector Capacity Grant</option>
                  <option>Emerging Tech Leader Bootcamp</option>
                  <option>Tax & Compliance Professionals Cohort</option>
                </select>
              </label>

              <label className="form-field">
                Applicant Full Name
                <input name="applicantName" required placeholder="John Doe" />
              </label>

              <label className="form-field">
                Primary Email
                <input name="email" type="email" required placeholder="johndoe@email.com" />
              </label>

              <label className="form-field">
                Mobile Number
                <input name="phone" required placeholder="+234..." />
              </label>

              <label className="form-field">
                Current Location (City, Country)
                <input name="location" required placeholder="Lagos, Nigeria" />
              </label>

              <label className="form-field sm:col-span-2">
                Current Employer / Institution
                <input name="organisation" placeholder="e.g. University of Lagos / Freelance" />
              </label>

              <label className="form-field sm:col-span-2">
                Explain your motivation & how this program helps your career goals
                <textarea
                  name="motivation"
                  required
                  rows={5}
                  placeholder="Describe your career goals, community involvement, or financial need. Standard evaluation requires a minimum of 100 words..."
                />
              </label>

              <label className="form-field sm:col-span-2">
                Upload CV / supporting documents (optional)
                <input name="attachments" type="file" multiple accept=".pdf,.doc,.docx,.ppt,.pptx,image/*" />
                <span className="text-[11px] font-medium text-slate-400">CV, ID, business profile or pitch deck — PDF, Word, PowerPoint or image.</span>
              </label>

              <div className="sm:col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center text-sm font-extrabold"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving candidacy details...
                    </>
                  ) : (
                    "Submit Scholarship Application"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
