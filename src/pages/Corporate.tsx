import React, { useState } from "react";
import {
  CheckCircle,
  ShieldCheck,
  Loader2,
  Building2,
  Users2,
  Crown,
  Layers,
  Video,
  MapPin,
  Download,
  Landmark,
  Cpu,
  Leaf,
  HeartHandshake,
  ArrowRight,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { dbSaveLead, dbSendTemplateEmail } from "../lib/db";
import type { DeliveryMode } from "../lib/types";

interface CorporateProps {
  thematicAreas: string[];
}

const trainingModels = [
  { icon: Building2, title: "In-plant", desc: "Facilitators deliver at your office using your case studies and procedures." },
  { icon: Layers, title: "Customised", desc: "Bespoke curricula built around your competencies, KPIs and standards." },
  { icon: Crown, title: "Executive", desc: "High-touch leadership programmes and executive retreats for senior teams." },
  { icon: ShieldCheck, title: "Hybrid", desc: "Blended classroom, live virtual and self-paced digital learning." },
  { icon: Video, title: "Virtual", desc: "Interactive live webinars and online labs for distributed teams." },
  { icon: MapPin, title: "On-site embedded", desc: "Embedded facilitators working alongside your teams on live projects." },
];

const lifecycle = [
  { step: "01", label: "Diagnose", desc: "Skills-gap diagnostic audits establish a capability baseline." },
  { step: "02", label: "Design", desc: "Custom curricula aligned to your standards and objectives." },
  { step: "03", label: "Develop", desc: "Multimedia assets, labs and physical session schedules." },
  { step: "04", label: "Deploy", desc: "Delivery via LMS streams and facilitated workshops." },
  { step: "05", label: "Sustain", desc: "Feedback analytics, verified credentials and ROI reporting." },
];

const sectors = [
  { icon: Landmark, label: "Banks & Financial Services" },
  { icon: Cpu, label: "Technology & Fintech" },
  { icon: Leaf, label: "Agribusiness & Energy" },
  { icon: HeartHandshake, label: "Public Sector & Development" },
];

const samplePrograms = [
  "Digital Transformation for Leaders",
  "Tax, Risk & Compliance Masterclass",
  "Performance & People Management",
  "ESG & Sustainability Practitioner",
  "Data Analytics for Decision-Makers",
  "Executive Leadership Retreat",
];

// Map a delivery-format card to the closest valid DeliveryMode. The exact
// format the user clicked is also recorded in the lead's notes so admin sees it.
const FORMAT_TO_MODE: Record<string, DeliveryMode> = {
  "In-plant": "In-plant",
  "Customised": "Instructor-led",
  "Executive": "Instructor-led",
  "Hybrid": "Hybrid",
  "Virtual": "Virtual",
  "On-site embedded": "In-plant",
};

type FormatModel = { icon: any; title: string; desc: string };

// Popup form to request a specific B2B delivery format. Submits a corporate
// lead (same pipeline as the main proposal form) so it reaches the admin.
function FormatRequestModal({
  format,
  thematicAreas,
  onClose,
}: {
  format: FormatModel;
  thematicAreas: string[];
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const need = (fd.get("need") as string) || "";
    const leadData = {
      id: "lead-" + Math.random().toString(36).substring(2, 8),
      organisation: fd.get("organisation") as string,
      sector: (fd.get("sector") as string) || "Other Services",
      contactName: fd.get("contactName") as string,
      email: fd.get("email") as string,
      phone: (fd.get("phone") as string) || "",
      thematicArea: (fd.get("thematicArea") as string) || thematicAreas[0] || "",
      participants: parseInt(fd.get("participants") as string) || 0,
      deliveryMode: (FORMAT_TO_MODE[format.title] || "Hybrid") as DeliveryMode,
      preferredDate: (fd.get("preferredDate") as string) || "",
      need: `[Delivery format requested: ${format.title}] ${need}`.trim(),
      stage: "New" as const,
      createdAt: new Date().toISOString().split("T")[0],
    };
    try {
      const ok = await dbSaveLead(leadData);
      if (ok) {
        void dbSendTemplateEmail(leadData.email, "lead_ack", { name: leadData.contactName, organisation: leadData.organisation });
        setSubmitted(true);
      } else {
        setError("Could not submit your request. Please try again.");
      }
    } catch {
      setError("Could not submit your request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div className="flex items-start gap-3">
            <div className="feature-icon shrink-0"><format.icon size={20} /></div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-lani-green">Request B2B training</span>
              <h3 className="text-lg font-bold text-lani-navy">{format.title}</h3>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">{format.desc}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="space-y-4 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lani-green/10 text-lani-green">
              <CheckCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-lani-navy">Request sent</h3>
            <p className="mx-auto max-w-sm text-xs leading-6 text-slate-500">
              Your <strong>{format.title}</strong> training request has been sent to our team. A LANI
              consultant will get back to you within 48 business hours.
            </p>
            <button onClick={onClose} className="btn-primary text-xs px-5">Done</button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 p-6 sm:grid-cols-2">
            {error && <div className="sm:col-span-2 rounded bg-red-50 p-3 text-xs font-semibold text-red-600">{error}</div>}
            <label className="form-field sm:col-span-2">Organisation Name<input name="organisation" required placeholder="e.g. Frontier Minerals" /></label>
            <label className="form-field">Contact Person<input name="contactName" required placeholder="e.g. Elizabeth Cole" /></label>
            <label className="form-field">Work Email<input name="email" type="email" required placeholder="name@company.com" /></label>
            <label className="form-field">Phone<input name="phone" placeholder="+234..." /></label>
            <label className="form-field">Approx. Participants<input name="participants" type="number" min={1} defaultValue={25} required /></label>
            <label className="form-field">Sector / Industry
              <select name="sector">
                <option>Financial Services</option>
                <option>Energy &amp; Minerals</option>
                <option>Public Administration</option>
                <option>Agriculture &amp; Biotech</option>
                <option>Technology &amp; Products</option>
                <option>Other Services</option>
              </select>
            </label>
            <label className="form-field">Preferred Start Date<input name="preferredDate" type="date" /></label>
            <label className="form-field sm:col-span-2">Thematic Focus Area
              <select name="thematicArea">
                {thematicAreas.map((area) => <option key={area} value={area}>{area}</option>)}
              </select>
            </label>
            <label className="form-field sm:col-span-2">Objectives &amp; requirements
              <textarea name="need" required rows={3} placeholder="Participant background, current skill gaps, and what you'd like this format to achieve..." />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-sm font-extrabold">
                {loading ? (<><Loader2 size={16} className="animate-spin" /> Sending request...</>) : `Request ${format.title} training`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Corporate({ thematicAreas }: CorporateProps) {
  const [activeFormat, setActiveFormat] = useState<FormatModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [torName, setTorName] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const need = formData.get("need") as string;
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
      need: torName ? `${need}\n\n[Attached brief/TOR: ${torName}]` : need,
      stage: "New" as const,
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      const ok = await dbSaveLead(leadData);
      if (ok) {
        void dbSendTemplateEmail(leadData.email, "lead_ack", { name: leadData.contactName, organisation: leadData.organisation });
        setSubmitted(true);
        e.currentTarget.reset();
        setTorName("");
      } else {
        setError("Database error. Please try again.");
      }
    } catch {
      setError("Failed to save corporate lead. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-band">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <span className="pill bg-white/10 text-lani-gold ring-1 ring-white/10">Enterprise Solutions</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Transform your workforce with <span className="text-lani-emerald">custom training</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Align organisational talent with regulatory directives, internal standards and global
            best practice. We diagnose, design, develop, deploy and sustain capability that lasts.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a href="#proposal" className="btn-primary min-h-12 px-6">Request a Proposal <ArrowRight size={16} /></a>
            <button
              onClick={() => toast.success("Corporate brochure will download once assets are published.")}
              className="btn-secondary min-h-12 border-white/20 bg-white/10 px-6 text-white hover:bg-white/20"
            >
              <Download size={16} /> Corporate Brochure
            </button>
          </div>
        </div>
      </section>

      {/* Training models */}
      <section className="section">
        <div className="page-header">
          <span className="eyebrow">Delivery formats</span>
          <h2 className="mt-3 section-title">Training models built around you</h2>
          <p className="lead mt-2">Choose the format — or combination — that fits your team and constraints.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {trainingModels.map((m) => (
            <button
              key={m.title}
              type="button"
              onClick={() => setActiveFormat(m)}
              className="info-card w-full text-left transition-all hover:-translate-y-1 hover:border-lani-green/30 hover:shadow-soft focus:outline-none focus:ring-2 focus:ring-lani-green/30"
            >
              <div className="feature-icon"><m.icon size={20} /></div>
              <h3 className="mt-4 text-base font-bold text-lani-navy">{m.title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">{m.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-lani-green">
                Request this format <ArrowRight size={13} />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Lifecycle */}
      <section className="section bg-slate-50">
        <div className="page-header">
          <span className="eyebrow">LANI process</span>
          <h2 className="mt-3 section-title">The capability-building lifecycle</h2>
          <p className="lead mt-2">A systematic approach that turns interventions into measurable capability.</p>
        </div>
        <div className="relative mt-12 grid gap-8 md:grid-cols-5 md:gap-4">
          <div className="absolute top-6 left-[10%] right-[10%] hidden h-0.5 border-t-2 border-dashed border-slate-300 md:block" />
          {lifecycle.map((item) => (
            <div key={item.label} className="group relative flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-lani-navy to-slate-800 font-bold text-white ring-4 ring-slate-50 transition-all group-hover:from-lani-green group-hover:to-lani-emerald">
                {item.step}
              </div>
              <h3 className="mt-4 text-base font-bold text-lani-navy">{item.label}</h3>
              <p className="mt-2 max-w-[13rem] text-xs leading-5 text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors + sample programmes */}
      <section className="section">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <span className="eyebrow">Sectors served</span>
            <h2 className="mt-3 text-2xl font-bold text-lani-navy">Deep experience across industries</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {sectors.map((s) => (
                <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="feature-icon h-9 w-9"><s.icon size={18} /></div>
                  <span className="text-sm font-bold text-lani-navy">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="eyebrow">Sample programmes</span>
            <h2 className="mt-3 text-2xl font-bold text-lani-navy">Popular corporate curricula</h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {samplePrograms.map((p) => (
                <span key={p} className="pill bg-lani-mist text-lani-green">{p}</span>
              ))}
            </div>
            <ul className="mt-6 grid gap-2 text-xs font-semibold text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle size={15} className="text-lani-green" /> Audited feedback logs for executive sponsors</li>
              <li className="flex items-center gap-2"><CheckCircle size={15} className="text-lani-green" /> Post-training validation assessments</li>
              <li className="flex items-center gap-2"><CheckCircle size={15} className="text-lani-green" /> Verifiable certificates for every participant</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Proposal form */}
      <section id="proposal" className="section bg-slate-50">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <span className="eyebrow">Request a proposal</span>
            <h2 className="text-2xl font-bold text-lani-navy">Tell us about your training needs</h2>
            <p className="text-sm leading-7 text-slate-500">
              Share your requirements and, if you have one, upload a brief or Terms of Reference.
              A LANI consultant will prepare a tailored curriculum within 48 business hours.
            </p>
            <div className="grid gap-3 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2"><Users2 size={16} className="text-lani-green" /> Bulk enrolment & cohort dashboards</div>
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-lani-green" /> Client-specific completion criteria</div>
              <div className="flex items-center gap-2"><Layers size={16} className="text-lani-green" /> Attendance, assessment & impact reporting</div>
            </div>
          </div>

          <div className="form-panel shadow-lg">
            {submitted ? (
              <div className="py-20 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lani-green/10 text-lani-green">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-lg font-bold text-lani-navy">Request registered</h3>
                <p className="mx-auto max-w-sm text-xs leading-6 text-slate-500">
                  Your training specifications have been logged. A consultant will prepare a draft
                  curriculum within 48 hours.
                </p>
                <button onClick={() => setSubmitted(false)} className="btn-secondary text-xs px-4">
                  Submit new request
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Proposal specification</span>
                  <h3 className="mt-1 text-lg font-bold text-lani-navy">Submit training specs</h3>
                </div>
                {error && (
                  <div className="sm:col-span-2 rounded bg-red-50 p-3 text-xs font-semibold text-red-600">{error}</div>
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
                      <option key={area} value={area}>{area}</option>
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
                  Objectives & requirements
                  <textarea name="need" required rows={4} placeholder="Participant background, current skill gaps, and custom requirements..." />
                </label>
                <label className="form-field sm:col-span-2">
                  Upload brief / Terms of Reference (optional)
                  <input
                    name="tor"
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => setTorName(e.target.files?.[0]?.name || "")}
                  />
                  {torName && <span className="text-[11px] font-medium text-lani-green">Attached: {torName}</span>}
                </label>
                <div className="sm:col-span-2 mt-2">
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-sm font-extrabold">
                    {loading ? (<><Loader2 size={16} className="animate-spin" /> Logging proposal specs...</>) : "Submit Consultation Proposal"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {activeFormat && (
        <FormatRequestModal
          format={activeFormat}
          thematicAreas={thematicAreas}
          onClose={() => setActiveFormat(null)}
        />
      )}
    </div>
  );
}
