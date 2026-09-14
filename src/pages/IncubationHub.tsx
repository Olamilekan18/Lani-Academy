import React from "react";
import {
  ArrowRight,
  Sparkles,
  Rocket,
  Lightbulb,
  Users,
  Target,
  BarChart3,
  Zap,
  ShieldCheck,
  Award,
  Globe,
  Building2,
  Code2,
  LineChart,
  Heart,
} from "lucide-react";
import type { View } from "../lib/types";

interface IncubationHubProps {
  onNavigate: (view: View) => void;
}

const FEATURES = [
  { icon: Rocket, title: "Acceleration Programme", desc: "12-week structured sprint covering product-market fit, go-to-market strategy, unit economics, and fundraising readiness. Cohort-based with weekly milestones and expert office hours." },
  { icon: Lightbulb, title: "Expert Mentorship", desc: "1:1 guidance from seasoned founders, operators, and domain experts across fintech, healthtech, edtech, agritech, and climate tech. Mentors matched by sector and stage." },
  { icon: Users, title: "Investor Access", desc: "Curated introductions to angel networks, VCs, and corporate VCs. Demo Day showcase to 100+ investors with live pitch sessions, follow-up meetings, and term sheet negotiation support." },
  { icon: Target, title: "Technical Resources", desc: "Cloud credits (AWS/Azure/GCP), dev tools, design systems, and access to LANI's engineering talent pool for MVP development, architecture review, and scaling support." },
  { icon: BarChart3, title: "Growth Support", desc: "Post-programme support including customer acquisition playbooks, hiring pipelines, legal templates, quarterly founder retreats, and ongoing advisory board access." },
  { icon: Zap, title: "Community & Network", desc: "Lifetime access to the alumni network, monthly founder forums, peer learning circles, exclusive partnership perks, and a private community platform for collaboration." },
];

const TRACKS = [
  { name: "Pre-Seed Launchpad", stage: "Idea → MVP", duration: "8 weeks", focus: "Validation, prototyping, first users", color: "bg-lani-blue", icon: Lightbulb, details: ["Problem discovery & validation", "Rapid prototyping & MVP", "User research & testing", "Founder & team dynamics", "Legal & IP basics", "Pitch deck fundamentals"] },
  { name: "Seed Accelerator", stage: "MVP → Traction", duration: "12 weeks", focus: "Growth, metrics, fundraising prep", color: "bg-lani-green", icon: Rocket, details: ["Product-market fit metrics", "Go-to-market strategy", "Unit economics & pricing", "Fundraising readiness", "Hiring first employees", "Board & governance setup"] },
  { name: "Scale Programme", stage: "Traction → Series A", duration: "16 weeks", focus: "Scaling, org building, expansion", color: "bg-lani-gold", icon: LineChart, details: ["Scaling engineering & product", "International expansion", "Series A fundraising", "Leadership & culture", "M&A and exits", "Corporate partnerships"] },
  { name: "Corporate Innovation", stage: "Intrapreneurship", duration: "Custom", focus: "Venture building within enterprises", color: "bg-cyan-600", icon: Building2, details: ["Innovation thesis & strategy", "Venture studio model", "Spin-out vs internal", "Corporate VC setup", "Portfolio management", "Ecosystem partnerships"] },
];

const PERKS = [
  { icon: ShieldCheck, title: "$500K+ in Perks", desc: "Cloud credits, dev tools, SaaS subscriptions, legal & accounting services" },
  { icon: Globe, title: "Global Network", desc: "Access to 500+ mentors, investors, and partners across 15 countries" },
  { icon: Code2, title: "Technical Talent", desc: "Dedicated engineering support for MVP development and scaling" },
  { icon: Award, title: "Demo Day Access", desc: "Pitch to 100+ investors with media coverage and follow-up meetings" },
  { icon: Heart, title: "Founder Wellness", desc: "Mental health support, executive coaching, peer support groups" },
  { icon: Building2, title: "Corporate Partners", desc: "Pilot opportunities with enterprise partners and government agencies" },
];

const ALUMNI_STATS = [
  { value: "47", label: "Ventures Launched" },
  { value: "$28M+", label: "Capital Raised" },
  { value: "12", label: "Countries" },
  { value: "340+", label: "Jobs Created" },
];

export default function IncubationHub({ onNavigate }: IncubationHubProps) {
  return (
    <div className="flex flex-col bg-white">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-lani-emerald/10 blur-[120px]" />
          <div className="absolute -left-32 top-40 h-96 w-96 rounded-full bg-lani-blue/10 blur-[120px]" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-lani-green/15 bg-lani-green/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-lani-green">
              <Sparkles size={13} /> Tech Incubation Hub
            </span>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-lani-navy sm:text-5xl lg:text-[3.4rem]">
              Launch. Scale. Succeed.
              <br />
              <span className="gradient-text">Your venture</span>, accelerated.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-500 sm:text-lg">
              A dedicated ecosystem for early-stage tech founders across Africa — from idea validation to investor-ready ventures.
              Access mentorship, capital networks, technical resources, and a community of builders shaping the continent's digital future.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onNavigate("applications")} className="btn-primary min-h-12 px-6 text-sm">
                Apply for Cohort 4 <ArrowRight size={16} />
              </button>
              <button onClick={() => onNavigate("contact")} className="btn-secondary min-h-12 px-6 text-sm">
                Partner With Us
              </button>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2"><span className="font-extrabold text-lani-navy">47+</span> ventures launched</span>
              <span className="hidden h-4 w-px bg-slate-200 sm:block" />
              <span className="flex items-center gap-2"><span className="font-extrabold text-lani-navy">$28M+</span> capital raised</span>
              <span className="hidden h-4 w-px bg-slate-200 sm:block" />
              <span className="flex items-center gap-2"><span className="font-extrabold text-lani-navy">12</span> African countries</span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl shadow-soft ring-1 ring-slate-100">
              <img
                src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1100&q=80"
                alt="Tech founders collaborating"
                className="h-[26rem] w-full object-cover"
              />
            </div>
            <div className="absolute -left-4 bottom-8 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-soft backdrop-blur">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lani-green/10 text-lani-green">
                <Award size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-lani-navy">Cohort 4 Applications Open</p>
                <p className="text-[11px] text-slate-400">Deadline: 31 October 2026</p>
              </div>
            </div>
            <div className="absolute -right-3 top-8 rounded-2xl border border-slate-100 bg-white/95 p-3 shadow-soft backdrop-blur">
              <div className="flex items-center gap-1 text-lani-gold">
                {[0, 1, 2, 3, 4].map((i) => <Award key={i} size={13} className="fill-lani-gold" />)}
              </div>
              <p className="mt-1 text-[11px] font-semibold text-slate-500">Top-rated programme</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {ALUMNI_STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold tracking-tight text-lani-navy sm:text-4xl">{s.value}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT WE OFFER ───────────────────────────────── */}
      <section className="section">
        <div className="page-header text-center">
          <span className="eyebrow">Programme Features</span>
          <h2 className="mt-3 section-title">Everything founders need to win</h2>
          <p className="lead mx-auto mt-2 max-w-2xl">
            Six pillars designed to take you from idea to investable, scalable business.
          </p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((item) => (
            <article key={item.title} className="group relative rounded-2xl border border-slate-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-soft hover:border-lani-green/30">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-lani-green/10 text-lani-green ring-1 ring-lani-green/10 group-hover:bg-lani-green group-hover:text-white transition-all">
                <item.icon size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-lani-navy group-hover:text-lani-green transition-colors">{item.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── INCUBATION TRACKS ───────────────────────────── */}
      <section className="section bg-slate-50/60">
        <div className="page-header text-center">
          <span className="eyebrow">Incubation Tracks</span>
          <h2 className="mt-3 section-title">Four pathways, one mission</h2>
          <p className="lead mx-auto mt-2 max-w-2xl">
            Choose the track that matches your stage. Each track is tailored with curriculum, mentors, and milestones for where you are.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {TRACKS.map((track) => (
            <article key={track.name} className="group relative rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex h-2.5 w-10 rounded-full ${track.color}`} />
                  <track.icon className={`h-5 w-5 text-lani-navy ${track.color.replace("bg-", "text-").replace("/20", "")}`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{track.duration}</span>
              </div>
              <h4 className="mt-4 text-base font-bold text-lani-navy group-hover:text-lani-green transition-colors">{track.name}</h4>
              <p className="mt-1.5 text-xs font-semibold text-lani-green">{track.stage}</p>
              <p className="mt-2 text-sm leading-5 text-slate-500">{track.focus}</p>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Curriculum includes:</p>
                <ul className="space-y-1.5">
                  {track.details.map((detail, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex h-1.5 w-1.5 shrink-0 rounded-full bg-lani-green" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button onClick={() => onNavigate("applications")} className="btn-primary inline-flex items-center gap-2 min-h-12 px-6 text-sm">
            View Application Requirements <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ── PERKS ───────────────────────────────────────── */}
      <section className="section">
        <div className="page-header text-center">
          <span className="eyebrow">Programme Perks</span>
          <h2 className="mt-3 section-title">$500K+ in partner benefits</h2>
          <p className="lead mx-auto mt-2 max-w-2xl">
            We've negotiated exclusive perks with leading technology and service providers so you can focus on building.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PERKS.map((perk) => (
            <article key={perk.title} className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-soft hover:border-lani-green/30">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-lani-green/10 text-lani-green ring-1 ring-lani-green/10 group-hover:bg-lani-green group-hover:text-white transition-all">
                <perk.icon size={24} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-lani-navy group-hover:text-lani-green transition-colors text-center">{perk.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-500 text-center">{perk.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── ALUMNI SUCCESS ──────────────────────────────── */}
      <section className="section bg-lani-navy text-white">
        <div className="page-header text-center">
          <span className="eyebrow text-lani-gold/60">Alumni Success</span>
          <h2 className="mt-3 section-title text-white">Ventures built at LANI</h2>
          <p className="lead mx-auto mt-2 max-w-2xl text-white/80">
            Our alumni are solving real problems across the continent — from financial inclusion to climate resilience.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {[
            { name: "PayFlow", sector: "Fintech", cohort: "Cohort 1", raised: "$2.4M Seed", desc: "Digital payments infrastructure for African SMEs. Now processing $50M+ monthly volume across 3 countries.", logo: "💳" },
            { name: "AgriConnect", sector: "Agritech", cohort: "Cohort 2", raised: "$1.8M Pre-Seed", desc: "Marketplace connecting smallholder farmers to buyers and inputs. Reached 15,000+ farmers in Kenya & Uganda.", logo: "🌱" },
            { name: "HealthLink", sector: "Healthtech", cohort: "Cohort 3", raised: "$3.1M Seed", desc: "Telemedicine platform for underserved communities. 200K+ consultations delivered, expanding to West Africa.", logo: "🏥" },
          ].map((alumni) => (
            <article key={alumni.name} className="relative rounded-2xl border border-white/10 bg-white/5 p-7 shadow-sm transition-all duration-300 hover:border-lani-green/30 hover:bg-white/10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-2xl">{alumni.logo}</div>
                <div>
                  <h4 className="font-bold text-lani-navy group-hover:text-lani-green transition-colors">{alumni.name}</h4>
                  <p className="text-xs text-white/50">{alumni.sector} · {alumni.cohort}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-lani-gold bg-lani-gold/10 px-3 py-1 rounded-full w-fit">{alumni.raised}</div>
              <p className="mt-4 text-sm leading-6 text-white/70">{alumni.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── HOW TO APPLY ────────────────────────────────── */}
      <section className="section">
        <div className="page-header text-center">
          <span className="eyebrow">Application Process</span>
          <h2 className="mt-3 section-title">From application to acceleration in 4 weeks</h2>
        </div>
        <div className="mt-14 grid gap-10 md:grid-cols-4">
          {[
            { step: "01", title: "Apply Online", desc: "Submit your application with pitch deck, team info, and traction metrics. Rolling review within 5 business days." },
            { step: "02", title: "Screening Call", desc: "30-min call with our investment team to understand your vision, market, and readiness for the programme." },
            { step: "03", title: "Committee Review", desc: "Final evaluation by our selection committee of founders, investors, and operators. Decision within 2 weeks." },
            { step: "04", title: "Onboarding", desc: "Welcome week, mentor matching, milestone planning, and access to all programme resources and community." },
          ].map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lani-green/10 text-lani-green ring-1 ring-lani-green/10">
                <span className="text-xl font-extrabold">{s.step}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-lani-navy">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────── */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-lani-green to-lani-emerald px-8 py-16 text-center text-white shadow-soft">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(40rem_20rem_at_80%_-20%,rgba(255,255,255,0.15),transparent)]" />
          <div className="relative">
            <Rocket size={32} className="mx-auto" />
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to build the future?</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-white/90 sm:text-base">
              Applications for Cohort 4 close on 31 October 2026. Limited to 15 ventures per cohort.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button onClick={() => onNavigate("applications")} className="rounded-lg bg-white px-6 py-3 text-sm font-bold text-lani-green transition-all hover:bg-slate-50 min-h-12">
                Start Your Application <ArrowRight size={16} />
              </button>
              <button onClick={() => onNavigate("contact")} className="rounded-lg border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 min-h-12">
                Become a Partner
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}