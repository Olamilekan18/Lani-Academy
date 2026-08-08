import React, { useState } from "react";
import { FileText, Download, BookOpen, Newspaper, FileBadge2, ArrowRight, X } from "lucide-react";
import toast from "react-hot-toast";
import type { View, ContentItem } from "../lib/types";
import { formatDate } from "../lib/utils";

interface ResourcesProps {
  onNavigate: (view: View) => void;
  content: ContentItem[];
}

const typeIcon: Record<string, React.ComponentType<any>> = {
  Brochure: FileText,
  Guide: BookOpen,
  Flyer: FileBadge2,
};

// Fallback content shown before an admin publishes anything.
const FALLBACK_DOWNLOADS = [
  { title: "LANI Academy Business Profile 2025", type: "Brochure", excerpt: "Full overview of our academies, delivery models and impact." },
  { title: "Corporate Capability Brochure", type: "Brochure", excerpt: "In-plant, customised, hybrid and executive training for organisations." },
  { title: "Certification Prep Guide", type: "Guide", excerpt: "How our CITN, ICAN and ATSWA preparatory tracks work." },
  { title: "2026 Training Calendar", type: "Flyer", excerpt: "Upcoming open programmes across all thematic areas." },
];

export default function Resources({ onNavigate, content }: ResourcesProps) {
  const [activeArticle, setActiveArticle] = useState<ContentItem | null>(null);

  const published = content.filter((c) => c.published);
  const downloads = published.filter((c) => c.type !== "Article");
  const articles = published.filter((c) => c.type === "Article");

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
            Download our profiles and learning guides, or read the latest thinking from the LANI faculty.
          </p>
        </div>
      </section>

      {/* Downloads */}
      <section className="section">
        <div className="mb-10">
          <span className="eyebrow">Downloads</span>
          <h2 className="mt-3 section-title">Brochures & guides</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {downloads.length > 0
            ? downloads.map((d) => {
                const Icon = typeIcon[d.type] || FileText;
                return (
                  <div key={d.id} className="info-card flex flex-col">
                    <div className="feature-icon"><Icon size={20} /></div>
                    <span className="mt-4 text-[10px] font-bold uppercase tracking-wider text-lani-blue">{d.type}</span>
                    <h3 className="mt-1 text-sm font-bold text-lani-navy">{d.title}</h3>
                    <p className="mt-2 flex-1 text-xs leading-6 text-slate-500">{d.excerpt}</p>
                    {d.fileUrl ? (
                      <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary mt-4 justify-center text-xs"><Download size={14} /> Download</a>
                    ) : (
                      <button onClick={() => notify(d.title)} className="btn-secondary mt-4 justify-center text-xs"><Download size={14} /> Download</button>
                    )}
                  </div>
                );
              })
            : FALLBACK_DOWNLOADS.map((d) => {
                const Icon = typeIcon[d.type] || FileText;
                return (
                  <div key={d.title} className="info-card flex flex-col">
                    <div className="feature-icon"><Icon size={20} /></div>
                    <span className="mt-4 text-[10px] font-bold uppercase tracking-wider text-lani-blue">{d.type}</span>
                    <h3 className="mt-1 text-sm font-bold text-lani-navy">{d.title}</h3>
                    <p className="mt-2 flex-1 text-xs leading-6 text-slate-500">{d.excerpt}</p>
                    <button onClick={() => notify(d.title)} className="btn-secondary mt-4 justify-center text-xs"><Download size={14} /> Download</button>
                  </div>
                );
              })}
        </div>
      </section>

      {/* Articles */}
      <section className="section bg-slate-50/60">
        <div className="mb-10 flex items-center gap-3">
          <Newspaper size={20} className="text-lani-green" />
          <h2 className="section-title">Latest articles</h2>
        </div>
        {articles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <button key={a.id} onClick={() => setActiveArticle(a)} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-soft">
                {a.imageUrl && <img src={a.imageUrl} alt={a.title} className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105" />}
                <div className="p-5">
                  {a.category && <span className="pill">{a.category}</span>}
                  <h3 className="mt-3 text-base font-bold leading-snug text-lani-navy group-hover:text-lani-green transition-colors">{a.title}</h3>
                  {a.excerpt && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">{a.excerpt}</p>}
                  <p className="mt-3 text-[10px] text-slate-400">{a.author} · {formatDate(a.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center text-sm text-slate-400">No articles published yet — check back soon.</p>
        )}
      </section>

      {/* CTA */}
      <section className="section">
        <div className="rounded-2xl bg-gradient-to-br from-lani-green to-lani-emerald p-10 text-center text-white shadow-soft">
          <h2 className="text-2xl font-bold">Ready to build capability?</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-white/90">Explore open programmes or request a customised proposal for your organisation.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <button onClick={() => onNavigate("courses")} className="rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-lani-green hover:bg-slate-100">Explore Courses</button>
            <button onClick={() => onNavigate("contact")} className="rounded-lg border border-white/40 bg-white/10 px-6 py-2.5 text-sm font-bold text-white hover:bg-white/20">Request a Proposal</button>
          </div>
        </div>
      </section>

      {/* Article reader */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-lani-navy/70 p-4 backdrop-blur-sm sm:p-8">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <button onClick={() => setActiveArticle(null)} className="absolute right-4 top-4 z-10 rounded-lg bg-white/90 p-1.5 text-slate-500 hover:text-lani-navy"><X size={20} /></button>
            {activeArticle.imageUrl && <img src={activeArticle.imageUrl} alt={activeArticle.title} className="h-56 w-full rounded-t-2xl object-cover" />}
            <div className="p-8">
              {activeArticle.category && <span className="pill">{activeArticle.category}</span>}
              <h1 className="mt-3 text-2xl font-extrabold text-lani-navy">{activeArticle.title}</h1>
              <p className="mt-1 text-xs text-slate-400">{activeArticle.author} · {formatDate(activeArticle.createdAt)}</p>
              {activeArticle.excerpt && <p className="mt-4 text-sm font-semibold text-slate-600">{activeArticle.excerpt}</p>}
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">{activeArticle.body}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
