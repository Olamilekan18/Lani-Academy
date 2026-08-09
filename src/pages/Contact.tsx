import React, { useState } from "react";
import { MapPin, Mail, Phone, Clock, CheckCircle, Loader2, Send } from "lucide-react";
import { dbSaveLead, dbSendTemplateEmail } from "../lib/db";
import type { DeliveryMode } from "../lib/types";

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const leadData = {
      id: "lead-" + Math.random().toString(36).substring(2, 8),
      organisation: (fd.get("organisation") as string) || "Individual enquiry",
      sector: "General Enquiry",
      contactName: fd.get("contactName") as string,
      email: fd.get("email") as string,
      phone: (fd.get("phone") as string) || "",
      thematicArea: (fd.get("interest") as string) || "General",
      participants: 0,
      deliveryMode: "Hybrid" as DeliveryMode,
      preferredDate: "",
      need: `[${fd.get("subject")}] ${fd.get("message")}`,
      stage: "New" as const,
      createdAt: new Date().toISOString().split("T")[0],
    };
    try {
      const ok = await dbSaveLead(leadData);
      if (ok) {
        void dbSendTemplateEmail(leadData.email, "lead_ack", { name: leadData.contactName, organisation: leadData.organisation });
        setSubmitted(true);
        e.currentTarget.reset();
      } else {
        setError("Could not send your message. Please try again.");
      }
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <section className="hero-band">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <span className="pill bg-white/10 text-lani-gold ring-1 ring-white/10">Contact</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Let's build your <span className="text-lani-emerald">learning plan</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Whether you're an individual learner or an organisation, tell us what you need and our
            team will respond within 48 business hours.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Contact details */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-lani-navy">Reach us directly</h2>
            <div className="space-y-4">
              <div className="info-card flex items-start gap-4">
                <div className="feature-icon"><MapPin size={20} /></div>
                <div>
                  <h3 className="text-sm font-bold text-lani-navy">Head Office</h3>
                  <p className="mt-1 text-xs leading-6 text-slate-500">
                    4, Olumuyiwa Street, Off Babington Ashaye Crescent,<br />
                    Omole Phase 1, Ikeja, Lagos, Nigeria.
                  </p>
                </div>
              </div>
              <div className="info-card flex items-start gap-4">
                <div className="feature-icon"><Mail size={20} /></div>
                <div>
                  <h3 className="text-sm font-bold text-lani-navy">Email</h3>
                  <a href="mailto:info@lani.ng" className="mt-1 block text-xs font-semibold text-lani-green">info@lani.ng</a>
                </div>
              </div>
              <div className="info-card flex items-start gap-4">
                <div className="feature-icon"><Phone size={20} /></div>
                <div>
                  <h3 className="text-sm font-bold text-lani-navy">Phone</h3>
                  <a href="tel:+2348000000000" className="mt-1 block text-xs font-semibold text-lani-green">+234 (0) 800-LANI-ACADEMY</a>
                </div>
              </div>
              <div className="info-card flex items-start gap-4">
                <div className="feature-icon"><Clock size={20} /></div>
                <div>
                  <h3 className="text-sm font-bold text-lani-navy">Hours</h3>
                  <p className="mt-1 text-xs leading-6 text-slate-500">Mon–Fri, 9:00am – 5:00pm WAT</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="form-panel shadow-lg">
            {submitted ? (
              <div className="py-20 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lani-green/10 text-lani-green">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-lg font-bold text-lani-navy">Message sent</h3>
                <p className="mx-auto max-w-sm text-xs leading-6 text-slate-500">
                  Thank you for reaching out. Our team has received your message and will respond
                  within 48 business hours.
                </p>
                <button onClick={() => setSubmitted(false)} className="btn-secondary text-xs px-4">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Request a proposal</span>
                  <h3 className="mt-1 text-lg font-bold text-lani-navy">Tell us what you need</h3>
                </div>
                {error && (
                  <div className="sm:col-span-2 rounded bg-red-50 p-3 text-xs font-semibold text-red-600">{error}</div>
                )}
                <label className="form-field">
                  Full Name
                  <input name="contactName" required placeholder="Your name" />
                </label>
                <label className="form-field">
                  Email
                  <input name="email" type="email" required placeholder="you@email.com" />
                </label>
                <label className="form-field">
                  Phone (optional)
                  <input name="phone" placeholder="+234..." />
                </label>
                <label className="form-field">
                  Organisation (optional)
                  <input name="organisation" placeholder="Company / institution" />
                </label>
                <label className="form-field">
                  I'm interested in
                  <select name="interest">
                    <option>Open courses</option>
                    <option>Corporate / in-plant training</option>
                    <option>Certification preparation</option>
                    <option>Sponsored / application programmes</option>
                    <option>Partnership</option>
                    <option>Other</option>
                  </select>
                </label>
                <label className="form-field">
                  Subject
                  <input name="subject" required placeholder="Brief subject" />
                </label>
                <label className="form-field sm:col-span-2">
                  Message
                  <textarea name="message" required rows={4} placeholder="How can we help?" />
                </label>
                <div className="sm:col-span-2 mt-2">
                  <button type="submit" disabled={loading} className="btn-primary w-full justify-center text-sm font-extrabold">
                    {loading ? (<><Loader2 size={16} className="animate-spin" /> Sending...</>) : (<><Send size={16} /> Send Message</>)}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
