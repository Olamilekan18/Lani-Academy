import React, { useState } from "react";
import {
  CalendarDays,
  GraduationCap,
  Clock,
  Award,
  ChevronRight,
  ChevronDown,
  BookOpen,
  User,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { Course } from "../lib/types";
import { formatMoney, formatDate } from "../lib/utils";

interface CourseDetailProps {
  course: Course;
  onEnrol: () => void;
  onBack: () => void;
}

export default function CourseDetail({ course, onEnrol, onBack }: CourseDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "objectives" | "audience">("overview");
  const [expandedModule, setExpandedModule] = useState<number | null>(0);

  const seatsLeft = Math.max(0, course.seats - course.enrolled);

  return (
    <div className="section bg-white text-left">
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <button onClick={onBack} className="hover:text-lani-navy transition-all">Catalog</button>
        <ChevronRight size={12} />
        <span className="text-slate-600 truncate max-w-xs">{course.title}</span>
      </div>

      {/* Hero Banner Grid */}
      <div className="relative mb-12 overflow-hidden rounded-2xl bg-lani-navy text-white shadow-xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="mx-auto grid max-w-7xl gap-8 p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr] items-center relative z-10">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-lani-gold ring-1 ring-white/10">
              <Sparkles size={11} />
              {course.category}
            </span>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl text-white">
              {course.title}
            </h1>
            <p className="max-w-xl text-sm leading-7 text-slate-300">
              {course.shortDescription}
            </p>

            <div className="flex flex-wrap gap-6 text-xs text-slate-300">
              <span className="flex items-center gap-2">
                <Clock size={16} className="text-lani-gold" />
                Duration: <strong>{course.duration}</strong>
              </span>
              <span className="flex items-center gap-2">
                <GraduationCap size={16} className="text-lani-emerald" />
                Certification: <strong>{course.certification}</strong>
              </span>
              <span className="flex items-center gap-2">
                <CalendarDays size={16} className="text-lani-blue" />
                Start: <strong>{formatDate(course.startDate)}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl">
            <img src={course.image} alt={course.title} className="h-64 w-full object-cover sm:h-80" />
          </div>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
        
        {/* Left: Interactive Tabs Area */}
        <div className="space-y-8">
          {/* Tab Selector pill */}
          <div className="flex border-b border-slate-200 text-sm font-bold text-slate-500 overflow-x-auto gap-4">
            {(["overview", "curriculum", "objectives", "audience"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 border-b-2 px-1 transition-all capitalize ${
                  activeTab === tab
                    ? "border-lani-green text-lani-green"
                    : "border-transparent hover:text-slate-800"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="mt-4">
            {activeTab === "overview" && (
              <div className="space-y-6 leading-8 text-slate-600 text-sm">
                <h2 className="text-lg font-bold text-lani-navy tracking-tight">Program Focus & Context</h2>
                <p>{course.fullDescription}</p>
                
                <div className="rounded-xl border border-slate-150 bg-slate-50 p-6 grid gap-4">
                  <h3 className="text-sm font-bold text-lani-navy flex items-center gap-2 uppercase tracking-wider">
                    <User size={16} className="text-lani-blue" />
                    Facilitator Biography
                  </h3>
                  <p className="text-xs text-slate-500 italic">
                    Delivered by <strong>{course.facilitator}</strong>, a senior director and accredited trainer at LANI Academy with over 15 years of industry experience.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "curriculum" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-lani-navy tracking-tight mb-4">Curriculum Modules</h2>
                <div className="grid gap-3">
                  {course.modules.map((mod, idx) => {
                    const isExpanded = expandedModule === idx;
                    return (
                      <div
                        key={mod.title}
                        className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedModule(isExpanded ? null : idx)}
                          className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-lani-navy bg-slate-50/50"
                        >
                          <span className="flex items-center gap-3">
                            <span className="grid h-7 w-7 place-items-center rounded bg-lani-navy text-xs font-bold text-white">
                              {idx + 1}
                            </span>
                            {mod.title}
                          </span>
                          <ChevronDown
                            size={16}
                            className={`text-slate-400 transition-transform duration-200 ${
                              isExpanded ? "rotate-180 text-lani-green" : ""
                            }`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="px-6 pb-6 pt-4 border-t border-slate-100 bg-white text-xs leading-6 text-slate-600">
                            <ul className="list-disc pl-5 space-y-2">
                              {mod.lessons.map((les) => (
                                <li key={les} className="font-semibold text-slate-700">
                                  {les}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "objectives" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-lani-navy tracking-tight mb-4">Key Learning Outcomes</h2>
                <div className="grid gap-3">
                  {course.outcomes.map((out) => (
                    <div key={out} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold text-slate-700 hover:bg-white transition-all">
                      <ShieldCheck size={18} className="text-lani-green shrink-0" />
                      <span>{out}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "audience" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-lani-navy tracking-tight mb-4">Target Audience Profiles</h2>
                <div className="grid gap-3">
                  {course.audience.map((aud) => (
                    <div key={aud} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold text-slate-700 hover:bg-white transition-all">
                      <BookOpen size={18} className="text-lani-blue shrink-0" />
                      <span>{aud}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Premium Checkout Widget */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 shadow-md grid gap-6 text-left">
            <div>
              <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Tuition Fees</span>
              <strong className="block mt-1 text-3xl font-extrabold text-lani-navy">
                {formatMoney(course.price)}
              </strong>
            </div>

            <div className="grid gap-3 border-y border-slate-200 py-5 text-xs text-slate-600 font-semibold">
              <div className="flex justify-between">
                <span>Tuition Mode</span>
                <span className="text-lani-navy">{course.deliveryModes.join(" / ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Certificate Level</span>
                <span className="text-lani-navy">{course.level} Accredited</span>
              </div>
              <div className="flex justify-between">
                <span>Enrolment Seats</span>
                <span className="text-lani-navy">{seatsLeft} available</span>
              </div>
            </div>

            <button
              onClick={onEnrol}
              className="btn-primary w-full justify-center min-h-12 text-sm font-extrabold shadow-md hover:shadow-lg shadow-lani-green/20"
            >
              Enrol / Register Now
            </button>

            <div className="text-center">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                Security Guarantee
              </span>
              <p className="text-[9px] text-slate-500 mt-1 leading-5">
                Payments secured with industry standard 256-bit encryption. Cryptographic verify key issued instantly.
              </p>
            </div>
          </div>

          {/* Facilitator / Material list summary widget */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-left grid gap-4">
            <h3 className="text-xs uppercase font-bold text-lani-navy tracking-wider">Included Resources</h3>
            <div className="grid gap-2.5">
              {course.materials.map((m) => (
                <div key={m} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600">
                  <Award size={14} className="text-lani-gold shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
