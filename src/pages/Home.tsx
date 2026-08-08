import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Sparkles,
  Compass,
  Search,
  GraduationCap,
  BadgeCheck,
  Star,
  ShieldCheck,
  Quote,
} from "lucide-react";
import type { Course, ThematicArea } from "../lib/types";
import { formatMoney } from "../lib/utils";

interface HomeProps {
  courses: Course[];
  thematicAreas: ThematicArea[];
  onNavigate: (view: any) => void;
  onOpenCourse: (course: Course) => void;
  onAddLead: (leadData: any) => Promise<void>;
}

const ACCENTS = ["bg-lani-green", "bg-lani-blue", "bg-lani-gold", "bg-cyan-600", "bg-indigo-600", "bg-emerald-600", "bg-rose-500", "bg-violet-600"];

const MODES = ["Self-paced", "Instructor-led", "Virtual", "Physical", "Hybrid", "In-plant"];

export default function Home({ courses, thematicAreas, onNavigate, onOpenCourse }: HomeProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const liveCourses = courses.filter((c) => c.status !== "Archived");
  const featuredCourses = liveCourses.filter((c) => c.featured).slice(0, 3);
  const featured = featuredCourses.length ? featuredCourses : liveCourses.slice(0, 3);
  const pillars = thematicAreas.slice(0, 8);

  const testimonials = [
    { quote: "The hybrid model let our team study at their own pace and still get hands-on practice. Completion rates were the best we've seen.", author: "Hauwa Ibrahim", title: "VP People, Northern Assurance", initials: "HI" },
    { quote: "Practical, well-structured and genuinely useful. Our product managers shipped faster after the digital transformation track.", author: "Segun Ademola", title: "CPO, Apex Bank", initials: "SA" },
    { quote: "From assessment to measurable outcomes — the most rigorous training partner we've worked with.", author: "Dr. Elizabeth Cole", title: "Sustainability Director, Frontier", initials: "EC" },
  ];

  const faqs = [
    { q: "How do I enrol in a course?", a: "Browse the catalogue, open any course, and click Enrol. Create an account, pay securely, and you get instant access to your dashboard." },
    { q: "Are the certificates verifiable?", a: "Yes. Every certificate carries a unique ID and QR code that anyone can verify in real time on our verification page." },
    { q: "Can you train my whole team?", a: "Absolutely. Our corporate portal supports in-plant, hybrid and executive training, bulk enrolment and cohort reporting." },
    { q: "What delivery formats are available?", a: "Self-paced, instructor-led, virtual, physical, hybrid and in-plant — pick what fits your team." },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial((p) => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [testimonials.length]);

  return (
    <div className="flex flex-col bg-white">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-lani-emerald/10 blur-[120px]" />
          <div className="absolute -left-32 top-40 h-96 w-96 rounded-full bg-lani-blue/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-lani-green/15 bg-lani-green/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-lani-green">
              <Sparkles size={13} /> Human capital development
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-lani-navy sm:text-5xl lg:text-[3.4rem]">
              Build future-ready{" "}
              <span className="gradient-text">skills</span> that move careers forward.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">
              Open programmes, corporate training and professional certification across eight
              high-impact sectors — learn online, in person, or hybrid, and earn credentials you can verify.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onNavigate("courses")} className="btn-primary min-h-12 px-6 text-sm">
                Explore Courses <ArrowRight size={16} />
              </button>
              <button onClick={() => onNavigate("corporate")} className="btn-secondary min-h-12 px-6 text-sm">
                Train your team
              </button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2"><span className="font-extrabold text-lani-navy">50,000+</span> learners trained</span>
              <span className="hidden h-4 w-px bg-slate-200 sm:block" />
              <span className="flex items-center gap-2"><span className="font-extrabold text-lani-navy">8</span> academies</span>
              <span className="hidden h-4 w-px bg-slate-200 sm:block" />
              <span className="flex items-center gap-2"><span className="font-extrabold text-lani-navy">4</span> African markets</span>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-soft ring-1 ring-slate-100">
              <img
                src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1100&q=80"
                alt="Learners collaborating"
                className="h-[26rem] w-full object-cover"
              />
            </div>
            {/* Floating verify badge */}
            <div className="absolute -left-4 bottom-8 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-soft backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lani-green/10 text-lani-green">
                <BadgeCheck size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-lani-navy">Verifiable certificates</p>
                <p className="text-[11px] text-slate-400">QR-verified, instantly</p>
              </div>
            </div>
            {/* Floating rating */}
            <div className="absolute -right-3 top-8 rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-soft backdrop-blur">
              <div className="flex items-center gap-1 text-lani-gold">
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={13} className="fill-lani-gold" />)}
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Rated by learners</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            { n: "50,000+", l: "Professionals trained" },
            { n: "8", l: "Thematic academies" },
            { n: "45+", l: "Accredited courses" },
            { n: "4", l: "Countries served" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="text-3xl font-extrabold tracking-tight text-lani-navy sm:text-4xl">{s.n}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURED COURSES ────────────────────────────── */}
      <section className="section">
        <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="eyebrow">Featured learning</span>
            <h2 className="mt-3 section-title">Popular open programmes</h2>
          </div>
          <button onClick={() => onNavigate("courses")} className="inline-flex items-center gap-1.5 text-sm font-bold text-lani-green hover:gap-2.5 transition-all">
            View all courses <ArrowRight size={15} />
          </button>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((course) => (
            <article key={course.id} className="group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft" onClick={() => onOpenCourse(course)}>
              <div className="relative h-44 overflow-hidden">
                <img src={course.image} alt={course.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-lani-navy shadow-sm">{course.status}</span>
              </div>
              <div className="p-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-lani-blue">{course.thematicArea}</span>
                <h3 className="mt-2 text-lg font-bold leading-snug text-lani-navy group-hover:text-lani-green transition-colors">{course.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">{course.shortDescription}</p>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <strong className="text-base font-extrabold text-lani-navy">{formatMoney(course.price)}</strong>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-lani-green">View details <ArrowRight size={13} /></span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── THEMATIC PILLARS ────────────────────────────── */}
      <section className="section bg-slate-50/60">
        <div className="page-header">
          <span className="eyebrow">Explore by discipline</span>
          <h2 className="mt-3 section-title">Eight thematic academies</h2>
          <p className="lead mt-3">Sector-relevant capability across the areas that matter most.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((area, i) => (
            <button key={area.id || i} onClick={() => onNavigate("courses")} className="group rounded-2xl border border-slate-100 bg-white p-6 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
              <span className={`block h-2 w-10 rounded-full ${ACCENTS[i % ACCENTS.length]}`} />
              <h3 className="mt-4 text-sm font-bold text-lani-navy group-hover:text-lani-green transition-colors">{area.name}</h3>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-500">{area.summary}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────── */}
      <section className="section">
        <div className="page-header">
          <span className="eyebrow">How it works</span>
          <h2 className="mt-3 section-title">From curiosity to credential</h2>
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {[
            { icon: Search, title: "Discover", desc: "Browse programmes by sector, level and delivery mode to find your fit." },
            { icon: GraduationCap, title: "Learn your way", desc: "Study self-paced, live, or hybrid — with videos, materials and assessments." },
            { icon: BadgeCheck, title: "Get certified", desc: "Complete the course and earn a verifiable, QR-backed certificate." },
          ].map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lani-green/10 text-lani-green ring-1 ring-lani-green/10">
                <s.icon size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-lani-navy">{i + 1}. {s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
        {/* Learning modes */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-2.5">
          {MODES.map((m) => (
            <span key={m} className="rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm font-semibold text-slate-600">{m}</span>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIAL ─────────────────────────────────── */}
      <section className="section bg-lani-navy text-white">
        <div className="mx-auto max-w-3xl text-center">
          <Quote size={40} className="mx-auto text-lani-gold/60" />
          <p className="mt-6 text-xl font-medium leading-9 sm:text-2xl">
            "{testimonials[activeTestimonial].quote}"
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-lani-green font-bold text-white">
              {testimonials[activeTestimonial].initials}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold">{testimonials[activeTestimonial].author}</p>
              <p className="text-xs text-slate-400">{testimonials[activeTestimonial].title}</p>
            </div>
          </div>
          <div className="mt-8 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setActiveTestimonial(i)} className={`h-2 rounded-full transition-all ${activeTestimonial === i ? "w-7 bg-lani-emerald" : "w-2 bg-white/25"}`} aria-label={`Testimonial ${i + 1}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="section">
        <div className="mx-auto max-w-3xl">
          <div className="page-header">
            <span className="eyebrow">Questions</span>
            <h2 className="mt-3 section-title">Good to know</h2>
          </div>
          <div className="mt-10 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-white">
            {faqs.map((f, i) => {
              const open = activeFaq === i;
              return (
                <div key={f.q}>
                  <button onClick={() => setActiveFaq(open ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
                    <span className="text-sm font-bold text-lani-navy">{f.q}</span>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-all ${open ? "rotate-45 border-lani-green text-lani-green" : "border-slate-200 text-slate-400"}`}>+</span>
                  </button>
                  {open && <p className="px-5 pb-5 text-sm leading-6 text-slate-500">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-lani-green to-lani-emerald px-8 py-16 text-center text-white shadow-soft">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_80%_-20%,rgba(255,255,255,0.15),transparent)]" />
          <div className="relative">
            <ShieldCheck size={32} className="mx-auto" />
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to start learning?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/90 sm:text-base">
              Explore open programmes or design a custom training plan for your organisation.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => onNavigate("courses")} className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-lani-green transition-all hover:bg-slate-50">Explore Courses</button>
              <button onClick={() => onNavigate("contact")} className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/20">Request a Proposal</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
