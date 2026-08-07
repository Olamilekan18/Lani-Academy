import React from "react";
import { FileText, Download, BookOpen, Newspaper, FileBadge2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import type { View } from "../lib/types";

interface ResourcesProps {
  onNavigate: (view: View) => void;
}

const brochures = [
  { title: "LANI Academy Business Profile 2025", type: "Brochure", desc: "Full overview of our academies, delivery models and impact." },
  { title: "Corporate Capability Brochure", type: "Brochure", desc: "In-plant, customised, hybrid and executive training for organisations." },
  { title: "Certification Prep Guide", type: "Guide", desc: "How our CITN, ICAN and ATSWA preparatory tracks work." },
  { title: "2026 Training Calendar", type: "Flyer", desc: "Upcoming open programmes across all thematic areas." },
];

const articles = [
  { title: "Building future-ready workforces in West Africa", read: "6 min read", tag: "Human Capital" },
  { title: "Why hybrid delivery outperforms classroom-only training", read: "4 min read", tag: "Learning" },
  { title: "ESG capability: a practical starting point for teams", read: "5 min read", tag: "Sustainability" },
  { title: "Digital transformation is a people problem first", read: "7 min read", tag: "ICT & Digital" },
];

const typeIcon: Record<string, React.ComponentType<any>> = {
  Brochure: FileText,
  Guide: BookOpen,
  Flyer: FileBadge2,
};

export default function Resources({ onNavigate }: ResourcesProps) {
  const notify = (name: string) => toast.success(`"${name}" — download will begin once assets are published.`);

  return (
    <div className="flex flex-col">
      <section className="hero-band">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <span className="pill bg-white/10 text-lani-gold ring-1 ring-white/10">Resources</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Brochures, guides & <span className="text-lani-emerald">insights</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Download our profiles and learning guides, or read the latest thinking from the LANI
            faculty on building capability that lasts.
          </p>
        </div>
      </section>

      {/* Downloads */}
      <section className="section">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <span className="eyebrow">Downloads</span>
            <h2 className="mt-3 section-title">Brochures & guides</h2>
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {brochures.map((b) => {
            const Icon = typeIcon[b.type] || FileText;
            return (
              <div key={b.title} className="info-card flex flex-col">
                <div className="feature-icon"><Icon size={20} /></div>
                <span className="mt-4 text-[10px] font-bold uppercase tracking-wider text-lani-blue">{b.type}</span>
                <h3 className="mt-1 text-sm font-bold text-lani-navy">{b.title}</h3>
                <p className="mt-2 flex-1 text-xs leading-6 text-slate-500">{b.desc}</p>
                <button onClick={() => notify(b.title)} className="btn-secondary mt-4 justify-center text-xs">
                  <Download size={14} /> Download
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Articles */}
      <section className="section bg-slate-50">
        <div className="mb-10 flex items-center gap-3">
          <Newspaper size={20} className="text-lani-green" />
          <h2 className="section-title">Latest articles</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {articles.map((a) => (
            <button
              key={a.title}
              onClick={() => notify(a.title)}
              className="info-card flex items-center justify-between gap-4 text-left"
            >
              <div>
                <span className="pill">{a.tag}</span>
                <h3 className="mt-3 text-base font-bold text-lani-navy">{a.title}</h3>
                <p className="mt-1 text-xs text-slate-400">{a.read}</p>
              </div>
              <ArrowRight size={18} className="shrink-0 text-slate-300" />
            </button>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="rounded-2xl bg-gradient-to-br from-lani-green to-lani-emerald p-10 text-center text-white shadow-soft">
          <h2 className="text-2xl font-bold">Ready to build capability?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/90">
            Explore open programmes or request a customised proposal for your organisation.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <button onClick={() => onNavigate("courses")} className="rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-lani-green hover:bg-slate-100">
              Explore Courses
            </button>
            <button onClick={() => onNavigate("contact")} className="rounded-lg border border-white/40 bg-white/10 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/20">
              Request a Proposal
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
