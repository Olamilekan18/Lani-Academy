import React from "react";
import {
  Compass,
  Target,
  Layers,
  ShieldCheck,
  Globe2,
  GraduationCap,
  Building2,
  ArrowRight,
} from "lucide-react";
import type { View } from "../lib/types";
import { thematicAreas } from "../data/catalog";

interface AboutProps {
  onNavigate: (view: View) => void;
}

const positioning = [
  { icon: GraduationCap, title: "Digital learning marketplace", desc: "Discover, compare and enrol in open programmes across eight capability pillars." },
  { icon: Building2, title: "Corporate transformation partner", desc: "In-plant, customised, hybrid and executive training for organisations." },
  { icon: ShieldCheck, title: "Certification preparatory centre", desc: "Structured tuition for professional bodies with verifiable credentials." },
  { icon: Globe2, title: "Pan-African delivery", desc: "Headquartered in Nigeria with a footprint across Ghana, Kenya and Uganda." },
];

const deliveryModes = ["Self-paced", "Instructor-led", "Virtual", "Physical", "Hybrid", "In-plant"];

export default function About({ onNavigate }: AboutProps) {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-band">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <span className="pill bg-white/10 text-lani-gold ring-1 ring-white/10">About LANI Academy</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            The human capital development engine of{" "}
            <span className="text-lani-emerald">LANI Consulting</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            LANI Academy empowers individuals and organisations through practical, sector-relevant
            and measurable training. We consolidate every training expression of LANI Consulting
            into one structured, commercial and scalable learning ecosystem.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <button onClick={() => onNavigate("courses")} className="btn-primary min-h-12 px-6">
              Explore Courses <ArrowRight size={16} />
            </button>
            <button onClick={() => onNavigate("corporate")} className="btn-secondary min-h-12 border-white/20 bg-white/10 px-6 text-white hover:bg-white/20">
              Request Corporate Training
            </button>
          </div>
        </div>
      </section>

      {/* Impact numbers */}
      <section className="section">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="stat-block"><strong>50,000+</strong><span>Professionals trained</span></div>
          <div className="stat-block"><strong>8</strong><span>Thematic academies</span></div>
          <div className="stat-block"><strong>4</strong><span>African markets</span></div>
          <div className="stat-block"><strong>45+</strong><span>Accredited courses</span></div>
        </div>
      </section>

      {/* Mission / vision */}
      <section className="section bg-slate-50">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="info-card">
            <div className="feature-icon"><Target size={20} /></div>
            <h2 className="mt-4 text-xl font-bold text-lani-navy">Our Mission</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              To empower individuals and organisations with the technical, digital and business
              capabilities they need for growth, excellence and sustainable success — delivered
              through a professional, premium and future-ready learning experience.
            </p>
          </div>
          <div className="info-card">
            <div className="feature-icon"><Compass size={20} /></div>
            <h2 className="mt-4 text-xl font-bold text-lani-navy">Our Vision</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              To be a premium, integrated, payment-enabled and certification-ready hybrid learning
              platform connecting people, professionals and institutions to measurable training
              solutions across LANI Consulting's core thematic areas.
            </p>
          </div>
        </div>
      </section>

      {/* Positioning */}
      <section className="section">
        <div className="page-header">
          <span className="eyebrow">What we are</span>
          <h2 className="mt-3 section-title">More than a course provider</h2>
          <p className="lead mt-2">A single platform spanning discovery, learning, certification and corporate engagement.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {positioning.map((p) => (
            <div key={p.title} className="info-card">
              <div className="feature-icon"><p.icon size={20} /></div>
              <h3 className="mt-4 text-base font-bold text-lani-navy">{p.title}</h3>
              <p className="mt-2 text-xs leading-6 text-slate-500">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Thematic pillars */}
      <section className="section bg-slate-50">
        <div className="page-header">
          <span className="eyebrow">Coverage</span>
          <h2 className="mt-3 section-title">Eight thematic academies</h2>
          <p className="lead mt-2">Our capability pillars mirror LANI Consulting's core practice areas.</p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {thematicAreas.map((area) => (
            <div key={area.id} className="theme-card glow-box">
              <div className={`h-2 w-10 rounded-full ${area.accent}`} />
              <h3 className="mt-4 text-sm font-bold text-lani-navy">{area.name}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">{area.summary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Delivery modes */}
      <section className="section">
        <div className="rounded-2xl bg-gradient-to-br from-lani-navy to-slate-900 p-10 text-white shadow-soft">
          <div className="flex items-center gap-3">
            <Layers size={22} className="text-lani-gold" />
            <h2 className="text-xl font-bold">Hybrid delivery, your way</h2>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Every programme can be delivered in the format that suits your team — from fully digital
            self-paced modules to intensive on-site workshops.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {deliveryModes.map((m) => (
              <span key={m} className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm font-semibold text-white">
                {m}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
