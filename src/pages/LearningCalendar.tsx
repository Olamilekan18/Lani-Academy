import React, { useMemo, useState } from "react";
import { Calendar, MapPin, Clock, ArrowRight, Video, GraduationCap } from "lucide-react";
import type { Course, CalendarEvent, DeliveryMode, View } from "../lib/types";
import { formatMoney, formatDate } from "../lib/utils";

interface Props {
  courses: Course[];
  events: CalendarEvent[];
  onOpenCourse: (c: Course) => void;
  onNavigate: (v: View) => void;
}

const MODES: (DeliveryMode | "All")[] = ["All", "Self-paced", "Instructor-led", "Virtual", "Physical", "Hybrid", "In-plant"];

const monthKey = (d: string) => {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("en-NG", { month: "long", year: "numeric" });
};

export default function LearningCalendar({ courses, events, onOpenCourse, onNavigate }: Props) {
  const [mode, setMode] = useState<DeliveryMode | "All">("All");
  const [month, setMonth] = useState<string>("All");

  const today = new Date().toISOString().split("T")[0];

  const upcomingCourses = useMemo(
    () =>
      courses
        .filter((c) => c.startDate && c.startDate >= today)
        .filter((c) => mode === "All" || c.deliveryModes.includes(mode))
        .filter((c) => month === "All" || monthKey(c.startDate) === month)
        .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [courses, mode, month, today]
  );

  const upcomingEvents = useMemo(
    () =>
      events
        .filter((e) => e.date && e.date >= today)
        .filter((e) => month === "All" || monthKey(e.date) === month)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [events, month, today]
  );

  const months = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => c.startDate >= today && set.add(monthKey(c.startDate)));
    events.forEach((e) => e.date >= today && set.add(monthKey(e.date)));
    return Array.from(set).filter(Boolean);
  }, [courses, events, today]);

  const dateBadge = (d: string) => {
    const dt = new Date(d);
    return {
      day: isNaN(dt.getTime()) ? "--" : dt.getDate().toString().padStart(2, "0"),
      mon: isNaN(dt.getTime()) ? "" : dt.toLocaleDateString("en-NG", { month: "short" }).toUpperCase(),
    };
  };

  return (
    <div className="flex flex-col">
      <section className="hero-band">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <span className="pill bg-white/10 text-lani-gold ring-1 ring-white/10">Training Calendar</span>
          <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Upcoming <span className="text-lani-emerald">programmes & sessions</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
            Plan ahead — browse open programmes by start date and delivery mode, and see scheduled
            live classes and workshops.
          </p>
        </div>
      </section>

      <section className="section">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap items-end gap-4">
          <label className="filter-field">
            <span>Delivery mode</span>
            <select value={mode} onChange={(e) => setMode(e.target.value as DeliveryMode | "All")}>
              {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="filter-field">
            <span>Month</span>
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option value="All">All months</option>
              {months.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <div className="ml-auto text-xs font-semibold text-slate-400">
            {upcomingCourses.length} programmes · {upcomingEvents.length} sessions
          </div>
        </div>

        {/* Upcoming programmes */}
        <h2 className="section-title mb-6 flex items-center gap-2 text-2xl">
          <GraduationCap size={22} className="text-lani-green" /> Open programmes
        </h2>
        <div className="grid gap-4">
          {upcomingCourses.length > 0 ? upcomingCourses.map((c) => {
            const b = dateBadge(c.startDate);
            return (
              <div key={c.id} className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:shadow-soft sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-lani-navy text-white">
                  <span className="text-xl font-extrabold leading-none">{b.day}</span>
                  <span className="text-[10px] font-bold tracking-wider">{b.mon}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lani-blue">{c.code} · {c.thematicArea}</span>
                  <h3 className="mt-1 text-base font-bold text-lani-navy">{c.title}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1"><Clock size={12} /> {c.duration}</span>
                    <span className="inline-flex items-center gap-1"><Video size={12} /> {c.deliveryModes.join(", ")}</span>
                    <span className="font-bold text-lani-navy">{formatMoney(c.price)}</span>
                  </p>
                </div>
                <button onClick={() => onOpenCourse(c)} className="btn-primary min-h-10 shrink-0 px-4 text-xs">
                  View & Enrol <ArrowRight size={14} />
                </button>
              </div>
            );
          }) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/50 py-16 text-center">
              <Calendar className="mx-auto text-slate-300" size={44} />
              <h3 className="mt-4 text-base font-bold text-lani-navy">No upcoming programmes match your filters</h3>
              <button onClick={() => onNavigate("courses")} className="btn-secondary mt-4 text-xs">Browse all courses</button>
            </div>
          )}
        </div>

        {/* Scheduled sessions */}
        {upcomingEvents.length > 0 && (
          <>
            <h2 className="section-title mb-6 mt-14 flex items-center gap-2 text-2xl">
              <Calendar size={22} className="text-lani-blue" /> Scheduled sessions
            </h2>
            <div className="grid gap-4">
              {upcomingEvents.map((ev) => {
                const b = dateBadge(ev.date);
                return (
                  <div key={ev.id} className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                    <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-lani-mist text-lani-green">
                      <span className="text-lg font-extrabold leading-none">{b.day}</span>
                      <span className="text-[9px] font-bold tracking-wider">{b.mon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{ev.type} · {ev.courseTitle}</span>
                      <h3 className="mt-0.5 text-sm font-bold text-lani-navy">{ev.title}</h3>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <Clock size={12} /> {formatDate(ev.date)} · {ev.time}
                        {ev.venue && <><MapPin size={12} /> {ev.venue}</>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
