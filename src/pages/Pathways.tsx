import React from "react";
import { Route, ArrowRight, BookOpen, CheckCircle } from "lucide-react";
import type { Course, Pathway, View } from "../lib/types";
import { formatMoney } from "../lib/utils";

interface Props {
  pathways: Pathway[];
  courses: Course[];
  onOpenCourse: (course: Course) => void;
  onNavigate: (view: View) => void;
}

export default function Pathways({ pathways, courses, onOpenCourse, onNavigate }: Props) {
  const published = pathways.filter((p) => p.published);

  return (
    <div className="flex flex-col">
      <section className="hero-band">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <span className="pill bg-white/10 text-lani-gold ring-1 ring-white/10">Learning pathways</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Guided routes to <span className="text-lani-emerald">real capability</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Curated sequences of courses that build role-ready skills step by step — not just single courses.
          </p>
        </div>
      </section>

      <section className="section">
        {published.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center">
            <Route className="mx-auto text-slate-300" size={44} />
            <h3 className="mt-4 text-base font-bold text-lani-navy">Pathways coming soon</h3>
            <p className="mt-1 text-sm text-slate-500">Meanwhile, explore our full course catalogue.</p>
            <button onClick={() => onNavigate("courses")} className="btn-primary mt-5">Browse Courses <ArrowRight size={16} /></button>
          </div>
        ) : (
          <div className="grid gap-8">
            {published.map((p) => {
              const items = p.courseIds.map((id) => courses.find((c) => c.id === id)).filter(Boolean) as Course[];
              const total = items.reduce((s, c) => s + (c.price || 0), 0);
              return (
                <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:grid lg:grid-cols-[0.9fr_1.1fr]">
                  {p.image && <img src={p.image} alt={p.title} className="h-48 w-full object-cover lg:h-full" />}
                  <div className="p-6 lg:p-8">
                    <span className="eyebrow">Pathway · {items.length} courses</span>
                    <h2 className="mt-3 text-2xl font-bold text-lani-navy">{p.title}</h2>
                    <p className="mt-2 text-sm leading-7 text-slate-500">{p.description}</p>

                    <div className="mt-5 grid gap-2">
                      {items.map((c, i) => (
                        <button key={c.id} onClick={() => onOpenCourse(c)} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left transition-all hover:bg-white hover:shadow-sm">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lani-navy text-xs font-bold text-white">{i + 1}</span>
                          <span className="flex-1 min-w-0">
                            <span className="block truncate text-sm font-bold text-lani-navy">{c.title}</span>
                            <span className="text-xs text-slate-400">{c.duration} · {formatMoney(c.price)}</span>
                          </span>
                          <ArrowRight size={15} className="shrink-0 text-slate-300" />
                        </button>
                      ))}
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                      <div>
                        <span className="text-xs text-slate-400">{p.price > 0 ? "Bundle price" : "Total if bought separately"}</span>
                        <div className="flex items-baseline gap-2">
                          <strong className="text-lg font-extrabold text-lani-navy">{formatMoney(p.price > 0 ? p.price : total)}</strong>
                          {p.price > 0 && total > p.price && <span className="text-xs text-slate-400 line-through">{formatMoney(total)}</span>}
                        </div>
                      </div>
                      <button onClick={() => items[0] && onOpenCourse(items[0])} className="btn-primary text-xs">Start pathway <ArrowRight size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="section pt-0">
        <div className="rounded-2xl bg-slate-50 p-8 text-center">
          <BookOpen className="mx-auto text-lani-green" size={28} />
          <h2 className="mt-3 text-xl font-bold text-lani-navy">Prefer individual courses?</h2>
          <p className="mt-1 text-sm text-slate-500">Browse the full catalogue and enrol in any single programme.</p>
          <button onClick={() => onNavigate("courses")} className="btn-secondary mt-4 text-xs">Explore all courses</button>
        </div>
      </section>
    </div>
  );
}
