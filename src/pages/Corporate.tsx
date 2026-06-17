import React, { useState } from "react";
import { Compass, Users, CheckCircle, ArrowRight, ShieldCheck, FileText, Loader2 } from "lucide-react";
import { dbSaveLead } from "../lib/db";
import type { DeliveryMode } from "../lib/types";

interface CorporateProps {
  thematicAreas: string[];
}

export default function Corporate({ thematicAreas }: CorporateProps) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const leadData = {
      id: "lead-" + Math.random().toString(36).substring(2, 8),
      organisation: formData.get("organisation") as string,
      sector: formData.get("sector") as string,
      contactName: formData.get("contactName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      thematicArea: formData.get("thematicArea") as string,
      participants: parseInt(formData.get("participants") as string) || 0,
      deliveryMode: formData.get("deliveryMode") as DeliveryMode,
      preferredDate: formData.get("preferredDate") as string,
      need: formData.get("need") as string,
      stage: "New" as const,
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      const ok = await dbSaveLead(leadData);
      if (ok) {
        setSubmitted(true);
        e.currentTarget.reset();
      } else {
        setError("Database error. Please try again.");
      }
    } catch (err) {
      setError("Failed to save corporate lead to Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section bg-white text-left min-h-[50rem]">
      {/* Page Header */}
      <div className="mb-12 max-w-3xl">
        <span className="eyebrow">Enterprise Solutions</span>
        <h1 className="mt-3 text-3xl font-extrabold text-lani-navy tracking-tight sm:text-4xl">
          Custom Corporate Training
        </h1>
        <p className="mt-2 text-slate-500 text-sm leading-6">
          Align organizational talent with regulatory directives, internal audit checklists, and global standards. Request a custom capacity-building proposal.
        </p>
      </div>

      {/* Grid: Process and Form */}
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        
        {/* Left: Capability models */}
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-bold text-lani-navy tracking-tight">Our Training Modalities</h2>
            <p className="mt-2 text-xs leading-6 text-slate-500">
              We design and execute custom programs adapted specifically to your sector constraints.
            </p>
          </div>

          <div className="grid gap-4">
            {[
              {
                title: "Bespoke In-Plant",
                desc: "Facilitators conduct physical classes at your office, utilizing company case studies and localized procedures."
              },
              {
                title: "Interactive Virtual labs",
                desc: "Scheduled live webinars combined with online lab assessments for distributed teams across West Africa."
              },
              {
                title: "Enterprise LMS White-Labeling",
                desc: "We host courseware on a custom-branded instance of our LMS, allowing staff to study asynchronously."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-100 bg-slate-50 p-5 grid gap-1.5 transition-all hover:bg-white hover:shadow-sm">
                <h3 className="text-sm font-bold text-lani-navy flex items-center gap-2">
                  <ShieldCheck size={16} className="text-lani-green" />
                  {item.title}
                </h3>
                <p className="text-xs leading-5 text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-150 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-lani-navy uppercase tracking-wider">Consulting Assurance</h3>
            <ul className="grid gap-2 text-xs font-semibold text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle size={15} className="text-lani-green" />
                <span>Audited feedback logs submitted to executive sponsors</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={15} className="text-lani-green" />
                <span>Post-training validation examinations</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={15} className="text-lani-green" />
                <span>Regulatory certificate verification reporting</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Proposal Form */}
        <div className="form-panel shadow-lg border border-slate-200">
          {submitted ? (
            <div className="py-24 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lani-green/10 text-lani-green">
                <CheckCircle size={28} />
              </div>
              <h3 className="text-lg font-bold text-lani-navy">Request Registered</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-6">
                Your organizational training specs have been saved to Supabase. An academic lead will prepare a draft curriculum within 48 hours.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="btn-secondary text-xs px-4"
              >
                Submit New Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Proposal Specification</span>
                <h3 className="text-lg font-bold text-lani-navy mt-1">Submit Training Specs</h3>
              </div>

              {error && (
                <div className="sm:col-span-2 rounded bg-red-50 p-3 text-xs font-semibold text-red-600">
                  {error}
                </div>
              )}

              <label className="form-field">
                Organisation Name
                <input name="organisation" required placeholder="e.g. Frontier Minerals" />
              </label>
              <label className="form-field">
                Sector / Industry
                <select name="sector">
                  <option>Financial Services</option>
                  <option>Energy & Minerals</option>
                  <option>Public Administration</option>
                  <option>Agriculture & Biotech</option>
                  <option>Technology & Products</option>
                  <option>Other Services</option>
                </select>
              </label>
              <label className="form-field">
                Contact Person Name
                <input name="contactName" required placeholder="e.g. Elizabeth Cole" />
              </label>
              <label className="form-field">
                Work Email
                <input name="email" type="email" required placeholder="e.g. e.cole@company.com" />
              </label>
              <label className="form-field">
                Phone Number
                <input name="phone" placeholder="+234..." />
              </label>
              <label className="form-field">
                Thematic Focus Area
                <select name="thematicArea">
                  {thematicAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                Approx. Participants
                <input name="participants" type="number" defaultValue={25} required />
              </label>
              <label className="form-field">
                Preferred Mode
                <select name="deliveryMode">
                  <option value="Hybrid">Hybrid (Classroom + LMS)</option>
                  <option value="In-plant">In-plant (Physical)</option>
                  <option value="Virtual">Virtual Interactive</option>
                  <option value="Self-paced">Self-paced Digital</option>
                </select>
              </label>
              <label className="form-field sm:col-span-2">
                Preferred Commencement Date
                <input name="preferredDate" type="date" required />
              </label>
              <label className="form-field sm:col-span-2">
                Detailed description of objectives
                <textarea
                  name="need"
                  required
                  rows={4}
                  placeholder="Provide details about participant background, current skill gaps, and custom requirements..."
                />
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
                      Logging proposal specs...
                    </>
                  ) : (
                    "Submit Consultation Proposal"
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
