import React from "react";
import {
  BadgeCheck,
  QrCode,
  ShieldCheck,
  Award,
  Search,
  FileCheck2,
  ArrowRight,
} from "lucide-react";
import type { View } from "../lib/types";

interface CertificationProps {
  onNavigate: (view: View) => void;
}

const bodies = [
  { code: "CITN", name: "Chartered Institute of Taxation of Nigeria", focus: "Tax practice, professional taxation examinations." },
  { code: "ICAN", name: "Institute of Chartered Accountants of Nigeria", focus: "Financial accounting, audit and assurance." },
  { code: "ATSWA", name: "Accounting Technicians Scheme West Africa", focus: "Foundational accounting technician certification." },
  { code: "CIPM", name: "Chartered Institute of Personnel Management", focus: "Human resource and people management practice." },
];

const certTypes = [
  { title: "Completion", desc: "Awarded on completing all modules and meeting the quiz threshold." },
  { title: "Participation", desc: "Recognises attendance and engagement in a programme or workshop." },
  { title: "Professional Preparation", desc: "For certification-prep tuition and mock assessment participation." },
  { title: "Executive Programme", desc: "Premium credential for executive and leadership tracks." },
  { title: "Corporate Training", desc: "Issued against client-specific completion criteria for cohorts." },
];

const steps = [
  { icon: Award, title: "Complete your programme", desc: "Meet the completion rules — modules, attendance and assessment thresholds." },
  { icon: FileCheck2, title: "Automatic issuance", desc: "A branded certificate is generated with a unique certificate ID." },
  { icon: QrCode, title: "QR + verification link", desc: "Every certificate carries a QR code and a public verification URL." },
  { icon: ShieldCheck, title: "Instant verification", desc: "Employers confirm authenticity in real time against our database." },
];

export default function Certification({ onNavigate }: CertificationProps) {
  return (
    <div className="flex flex-col">
      <section className="hero-band">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <span className="pill bg-white/10 text-lani-gold ring-1 ring-white/10">Certification</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Credible, verifiable <span className="text-lani-emerald">certificates</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Professional tuition and certification preparation, backed by digital certificates with
            QR codes and public verification — so your credentials are always trusted.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button onClick={() => onNavigate("courses")} className="btn-primary min-h-12 px-6">
              Browse certification courses <ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate("verify")} className="btn-secondary min-h-12 border-white/20 bg-white/10 px-6 text-white hover:bg-white/20">
              <Search size={16} /> Verify a certificate
            </button>
          </div>
        </div>
      </section>

      {/* Professional bodies */}
      <section className="section">
        <div className="page-header">
          <span className="eyebrow">Preparatory tuition</span>
          <h2 className="mt-3 section-title">Professional certification routes</h2>
          <p className="lead mt-2">Structured tuition aligned to leading professional bodies.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {bodies.map((b) => (
            <div key={b.code} className="info-card">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lani-gold/10 text-lani-gold ring-1 ring-lani-gold/20 font-black text-sm">
                {b.code}
              </div>
              <h3 className="mt-4 text-sm font-bold text-lani-navy">{b.name}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">{b.focus}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How verification works */}
      <section className="section bg-slate-50">
        <div className="page-header">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-3 section-title">From completion to verification</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="info-card">
              <div className="flex items-center justify-between">
                <div className="feature-icon"><s.icon size={20} /></div>
                <span className="text-2xl font-black text-slate-200">0{i + 1}</span>
              </div>
              <h3 className="mt-4 text-base font-bold text-lani-navy">{s.title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certificate types */}
      <section className="section">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="eyebrow">Credential types</span>
            <h2 className="mt-3 section-title">A certificate for every programme</h2>
            <p className="lead mt-3">
              LANI issues distinct credential categories so each achievement is represented
              accurately — every one carrying a unique ID and QR verification.
            </p>
            <button onClick={() => onNavigate("verify")} className="btn-primary mt-6">
              <BadgeCheck size={16} /> Verify a certificate
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {certTypes.map((c) => (
              <div key={c.title} className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-bold text-lani-navy">
                  <BadgeCheck size={16} className="text-lani-green" />
                  {c.title}
                </h3>
                <p className="mt-2 text-xs leading-6 text-slate-500">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
