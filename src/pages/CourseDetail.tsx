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
  Sparkles,
  Star,
  Bell,
  Video
} from "lucide-react";
import type { Course, CourseReview, CalendarEvent } from "../lib/types";
import { formatMoney, formatDate } from "../lib/utils";
import { supabase } from "../lib/supabase";
import AskAI from "../components/AskAI";
import toast from "react-hot-toast";

type CourseDetailTab = "overview" | "curriculum" | "objectives" | "audience" | "reviews";

interface CourseDetailProps {
  course: Course;
  reviews?: CourseReview[];
  currentUserEmail?: string;
  canReview?: boolean;
  initialTab?: string;
  onSaveReview?: (review: Partial<CourseReview>) => Promise<void> | void;
  onEnrol: () => void;
  onBack: () => void;
  relatedCourses?: Course[];
  upcomingSessions?: CalendarEvent[];
  onOpenRelated?: (course: Course) => void;
}

export default function CourseDetail({ course, reviews = [], currentUserEmail = "", canReview = false, initialTab, onSaveReview, onEnrol, onBack, relatedCourses = [], upcomingSessions = [], onOpenRelated }: CourseDetailProps) {
  const validTabs: CourseDetailTab[] = ["overview", "curriculum", "objectives", "audience", "reviews"];
  const [activeTab, setActiveTab] = useState<CourseDetailTab>(
    (validTabs as string[]).includes(initialTab || "") ? (initialTab as CourseDetailTab) : "overview"
  );
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [facProfile, setFacProfile] = useState<any>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [reminded, setReminded] = useState(false);

  const myReview = reviews.find((r) => r.learnerEmail === currentUserEmail);
  const [rating, setRating] = useState<number>(myReview?.rating || 0);
  const [comment, setComment] = useState<string>(myReview?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const submitReview = async () => {
    if (!onSaveReview || rating < 1) return;
    setSubmitting(true);
    await onSaveReview({ courseId: course.id, rating, comment: comment.trim() });
    setSubmitting(false);
  };

  React.useEffect(() => {
    if (course.facilitator && supabase) {
      supabase.from("profiles").select("*").eq("full_name", course.facilitator).single()
        .then(({ data }) => {
          if (data) setFacProfile(data);
        });
    }
  }, [course.facilitator]);

  const seatsLeft = course.seats === 0 ? null : Math.max(0, course.seats - course.enrolled);

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingLive = upcomingSessions
    .filter((e) => e.courseId === course.id && (e.type === "Live Class" || e.type === "Webinar") && e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const remindOfLive = () => {
    if (!upcomingLive.length) return;
    const next = upcomingLive[0];
    localStorage.setItem(`lani-reminder-${course.id}`, JSON.stringify({ id: next.id, date: next.date, time: next.time, title: next.title }));
    setReminded(true);
    toast.success(`We'll remind you about "${next.title}" on ${next.date}.`);
  };

  const related = relatedCourses
    .filter((c) => c.id !== course.id)
    .slice(0, 3);

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
        
        <div className="mx-auto grid max-w-7xl items-center gap-8 p-6 sm:p-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch relative z-10">
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

            <div className="grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <Clock size={13} className="text-lani-gold" /> Duration
                </span>
                <strong className="mt-1.5 block text-sm font-bold text-white">{course.duration}</strong>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <GraduationCap size={13} className="text-lani-emerald" /> Certification
                </span>
                <strong className="mt-1.5 block text-sm font-bold text-white">{course.certification}</strong>
              </div>
              <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <CalendarDays size={13} className="text-lani-blue" /> Start Date
                </span>
                <strong className="mt-1.5 block text-sm font-bold text-white">{formatDate(course.startDate)}</strong>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-white/10 shadow-2xl">
            <img src={course.image} alt={course.title} className="h-56 w-full object-cover sm:h-72 lg:h-full lg:min-h-[22rem]" />
          </div>
        </div>
      </div>

      {/* Upcoming Live Class Reminder */}
      {upcomingLive.length > 0 && (
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-lani-blue/20 bg-gradient-to-r from-lani-mist to-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lani-blue text-white">
              <Video size={18} />
            </div>
            <div>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-lani-blue">
                <Bell size={11} /> Upcoming Live Class
              </span>
              <h4 className="mt-1 text-sm font-bold text-lani-navy">{upcomingLive[0].title}</h4>
              <p className="text-xs text-slate-500">
                {formatDate(upcomingLive[0].date)} · {upcomingLive[0].time} · {upcomingLive[0].venue}
              </p>
            </div>
          </div>
          <button
            onClick={remindOfLive}
            disabled={reminded}
            className={`self-start sm:self-auto btn-secondary min-h-9 px-4 py-2 text-xs font-bold ${reminded ? "bg-lani-emerald/10 border-lani-emerald text-lani-green" : "text-lani-blue border-lani-blue/30 hover:bg-lani-blue/5"}`}
          >
            {reminded ? <><Bell size={13} /> Reminder Set</> : <><Bell size={13} /> Remind Me</>}
          </button>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start lg:gap-12">
        
        {/* Left: Interactive Tabs Area */}
        <div className="space-y-8">
          {/* Tab Selector pill */}
          <div className="flex border-b border-slate-200 text-sm font-bold text-slate-500 overflow-x-auto gap-4">
            {(["overview", "curriculum", "objectives", "audience", "reviews"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 border-b-2 px-1 transition-all capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? "border-lani-green text-lani-green"
                    : "border-transparent hover:text-slate-800"
                }`}
              >
                {tab === "reviews" ? `Reviews${reviews.length ? ` (${reviews.length})` : ""}` : tab}
              </button>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div className="mt-4">
            {activeTab === "overview" && (
              <div className="space-y-8 text-slate-600">
                {/* Course at a glance */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-slate-150 bg-slate-50 p-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <GraduationCap size={14} className="text-lani-green" /> Level
                    </span>
                    <strong className="mt-1.5 block text-sm font-bold text-lani-navy">{course.level}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-150 bg-slate-50 p-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Video size={14} className="text-lani-blue" /> Delivery
                    </span>
                    <strong className="mt-1.5 block text-sm font-bold text-lani-navy">{course.deliveryModes.join(" / ")}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-150 bg-slate-50 p-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Clock size={14} className="text-lani-gold" /> Duration
                    </span>
                    <strong className="mt-1.5 block text-sm font-bold text-lani-navy">{course.duration}</strong>
                  </div>
                  <div className="rounded-xl border border-slate-150 bg-slate-50 p-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <Award size={14} className="text-lani-emerald" /> Assessment
                    </span>
                    <strong className="mt-1.5 block text-sm font-bold text-lani-navy">{course.assessment}</strong>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-lani-navy tracking-tight">Programme Focus & Context</h2>
                <p className="text-sm leading-7">{course.fullDescription}</p>

                {course.outcomes.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-lani-navy tracking-tight">What you&apos;ll learn</h3>
                    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                      {course.outcomes.slice(0, 6).map((out) => (
                        <div key={out} className="flex gap-2.5 text-sm leading-6 text-slate-600">
                          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-lani-green" />
                          <span>{out}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="rounded-xl border border-slate-150 bg-slate-50 p-6 grid gap-4">
                  <h3 className="text-sm font-bold text-lani-navy flex items-center gap-2 uppercase tracking-wider">
                    <User size={16} className="text-lani-blue" />
                    Facilitator Biography
                  </h3>
                  <p className="text-xs text-slate-500 italic">
                    {facProfile?.bio ? (
                      <>
                        <span className="block font-semibold text-lani-navy mb-1">{facProfile.qualifications}</span>
                        {facProfile.bio}
                      </>
                    ) : (
                      <>Delivered by <strong>{course.facilitator}</strong>, a senior director and accredited trainer at LANI Academy with over 15 years of industry experience.</>
                    )}
                  </p>
                </div>
              </div>
            )}

            {activeTab === "curriculum" && (
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-lani-navy tracking-tight mb-4">Curriculum Modules</h2>
                <div className="grid gap-3">
                  {course.modules.map((mod, idx) => {
                    if (mod.draft) return null; // hidden until published
                    const isExpanded = expandedModule === idx;
                    const releaseLabel = mod.releaseAt && new Date(mod.releaseAt).getTime() > Date.now()
                      ? new Date(mod.releaseAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                      : null;
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
                            {releaseLabel && <span className="rounded-full bg-lani-gold/10 px-2 py-0.5 text-[10px] font-bold text-lani-gold">Releases {releaseLabel}</span>}
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
                <div className="grid gap-3 sm:grid-cols-2">
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
                <div className="grid gap-3 sm:grid-cols-2">
                  {course.audience.map((aud) => (
                    <div key={aud} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-xs font-semibold text-slate-700 hover:bg-white transition-all">
                      <BookOpen size={18} className="text-lani-blue shrink-0" />
                      <span>{aud}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-bold text-lani-navy tracking-tight">Learner Reviews</h2>
                  {reviews.length > 0 && (
                    <span className="flex items-center gap-1.5 text-sm">
                      <span className="flex items-center gap-0.5 text-lani-gold">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={15} className={n <= Math.round(avgRating) ? "fill-lani-gold" : "text-slate-300"} />
                        ))}
                      </span>
                      <strong className="text-slate-700">{avgRating.toFixed(1)}</strong>
                      <span className="text-slate-400">· {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
                    </span>
                  )}
                </div>

                {/* Write a review — only enrolled learners */}
                {canReview ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 grid gap-3">
                    <h3 className="text-sm font-bold text-lani-navy">{myReview ? "Update your review" : "Write a review"}</h3>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" onClick={() => setRating(n)} className="p-0.5">
                          <Star size={22} className={n <= rating ? "fill-lani-gold text-lani-gold" : "text-slate-300 hover:text-lani-gold"} />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder="Share what you thought of this course..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-lani-green focus:ring-2 focus:ring-lani-green/20"
                    />
                    <button
                      type="button"
                      onClick={submitReview}
                      disabled={submitting || rating < 1}
                      className="btn-primary justify-self-start text-xs px-5 disabled:opacity-50"
                    >
                      {submitting ? "Saving..." : myReview ? "Update review" : "Submit review"}
                    </button>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-xs text-slate-500">
                    Only enrolled learners can review this course.
                  </p>
                )}

                {/* Reviews list */}
                <div className="grid gap-3">
                  {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet — be the first to share your experience.</p>}
                  {reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <strong className="text-sm text-lani-navy">{r.learnerName}</strong>
                        <span className="flex items-center gap-0.5 text-lani-gold">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star key={n} size={12} className={n <= r.rating ? "fill-lani-gold" : "text-slate-300"} />
                          ))}
                        </span>
                      </div>
                      {r.comment && <p className="mt-2 text-xs leading-6 text-slate-600">{r.comment}</p>}
                      <span className="mt-1 block text-[10px] text-slate-400">{formatDate(r.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Premium Checkout Widget */}
        <div className="space-y-6 self-start lg:sticky lg:top-24">
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
                <span className="text-lani-navy">{seatsLeft === null ? "Unlimited" : `${seatsLeft} available`}</span>
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

          {/* AI Study Assistant */}
          <div className="rounded-2xl border border-lani-blue/20 bg-gradient-to-br from-lani-mist to-white p-6 shadow-sm text-left grid gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lani-blue to-lani-emerald text-white shadow">
                <Sparkles size={18} />
              </div>
              <h3 className="text-xs uppercase font-bold text-lani-navy tracking-wider">AI Study Assistant</h3>
            </div>
            <p className="text-[11px] leading-5 text-slate-500">
              Ask questions about this course, get plain-language explanations, and quiz yourself — anytime.
            </p>
            <button
              onClick={() => setAskOpen(true)}
              className="btn-secondary w-full justify-center min-h-10 text-xs font-bold border-lani-blue/30 text-lani-blue hover:bg-lani-blue/5"
            >
              <Sparkles size={14} /> Ask AI about this course
            </button>
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

      {/* Related Courses */}
      {related.length > 0 && (
        <div className="mt-16">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-extrabold tracking-tight text-lani-navy">Related Courses</h2>
            <button onClick={onBack} className="text-xs font-bold text-lani-green hover:underline">View all courses</button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <article
                key={c.id}
                onClick={() => onOpenRelated && onOpenRelated(c)}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer"
              >
                <div className="relative h-40 overflow-hidden bg-slate-100">
                  <img src={c.image} alt={c.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded bg-white/95 px-2 py-0.5 text-[10px] font-bold text-lani-navy shadow uppercase">{c.status}</span>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>{c.code}</span>
                    <span className="text-lani-navy">{formatMoney(c.price)}</span>
                  </div>
                  <h3 className="mt-2 line-clamp-2 text-base font-bold leading-snug text-lani-navy group-hover:text-lani-green transition-colors">
                    {c.title}
                  </h3>
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5"><Clock size={13} className="text-lani-gold" />{c.duration}</span>
                    <button className="btn-primary min-h-8 px-3 py-1 text-[10px]">Enrol Now</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      <AskAI
        open={askOpen}
        onClose={() => setAskOpen(false)}
        context={{
          courseTitle: course.title,
          courseCode: course.code,
          shortDescription: course.shortDescription,
          outcomes: course.outcomes,
        }}
      />
    </div>
  );
}
