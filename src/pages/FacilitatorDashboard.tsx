import React, { useState } from "react";
import { GraduationCap, BookOpen, Users, ClipboardCheck, Megaphone, TrendingUp, Clock, CheckCircle, Send, ChevronRight, PlayCircle, FileText, BarChart2 } from "lucide-react";
import type { Course, Enrollment, FacilitatorAssignment, AssignmentSubmission, Assignment, Announcement, CalendarEvent, Quiz, QuizAttempt } from "../lib/types";
import { formatDate } from "../lib/utils";

type Tab = "overview"|"courses"|"learners"|"grading"|"announcements";

interface Props {
  courses: Course[];
  enrollments: Enrollment[];
  assignments: FacilitatorAssignment[];
  courseAssignments: Assignment[];
  submissions: AssignmentSubmission[];
  announcements: Announcement[];
  calendarEvents: CalendarEvent[];
  quizAttempts: QuizAttempt[];
  onPostAnnouncement: (a: Omit<Announcement,"id"|"createdAt">) => void;
  onGradeSubmission: (subId: string, score: number, feedback: string) => void;
}

export default function FacilitatorDashboard({ courses, enrollments, assignments, courseAssignments, submissions, announcements, calendarEvents, quizAttempts, onPostAnnouncement, onGradeSubmission }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [gradingId, setGradingId] = useState<string|null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annCourse, setAnnCourse] = useState("");

  const myCourseIds = assignments.map(a => a.courseId);
  const myCourses = courses.filter(c => myCourseIds.includes(c.id));
  const myEnrollments = enrollments.filter(e => myCourseIds.includes(e.courseId));
  const mySubmissions = submissions.filter(s => myCourseIds.includes(s.courseId));
  const pendingSubs = mySubmissions.filter(s => s.status === "Submitted");
  const myAnnouncements = announcements.filter(a => myCourseIds.includes(a.courseId));
  const myEvents = calendarEvents.filter(e => myCourseIds.includes(e.courseId)).sort((a,b) => a.date.localeCompare(b.date)).slice(0,5);
  const totalLearners = new Set(myEnrollments.map(e => e.learnerEmail)).size;
  const avgProgress = myEnrollments.length > 0 ? Math.round(myEnrollments.reduce((s,e) => s+e.progress, 0)/myEnrollments.length) : 0;

  const filteredEnrollments = selectedCourse === "all" ? myEnrollments : myEnrollments.filter(e => e.courseId === selectedCourse);

  const tabs: {key:Tab;label:string;icon:any}[] = [
    {key:"overview",label:"Overview",icon:TrendingUp},
    {key:"courses",label:"My Courses",icon:BookOpen},
    {key:"learners",label:"Learner Progress",icon:Users},
    {key:"grading",label:`Grading (${pendingSubs.length})`,icon:ClipboardCheck},
    {key:"announcements",label:"Announcements",icon:Megaphone},
  ];

  const handleGrade = (subId: string) => {
    const score = parseInt(gradeScore);
    if (isNaN(score)) return;
    onGradeSubmission(subId, score, gradeFeedback);
    setGradingId(null);
    setGradeScore("");
    setGradeFeedback("");
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annBody || !annCourse) return;
    const course = myCourses.find(c => c.id === annCourse);
    onPostAnnouncement({ courseId: annCourse, courseTitle: course?.title || "", authorName: "Dr. Chinedu Okoro", authorRole: "facilitator", title: annTitle, body: annBody });
    setAnnTitle(""); setAnnBody(""); setAnnCourse("");
  };

  return (
    <div className="section bg-white text-left min-h-[50rem]">
      {/* Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-lani-gold/90 to-amber-700 p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"/>
        <div className="relative z-10 space-y-2">
          <span className="eyebrow border-white/20 bg-white/5 text-white/90">Facilitator Portal</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome, Dr. Chinedu Okoro</h1>
          <p className="text-xs text-white/70 max-w-md">Manage your assigned courses, track learner progress, grade submissions, and post announcements.</p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          {label:"Assigned Courses",val:myCourses.length.toString(),icon:BookOpen,color:"text-lani-gold"},
          {label:"Total Learners",val:totalLearners.toString(),icon:Users,color:"text-lani-blue"},
          {label:"Avg. Completion",val:`${avgProgress}%`,icon:TrendingUp,color:"text-lani-green"},
          {label:"Pending Grading",val:pendingSubs.length.toString(),icon:ClipboardCheck,color:"text-lani-coral"},
        ].map(t => (
          <div key={t.label} className="rounded-xl border border-slate-150 bg-slate-50 p-5 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center ${t.color}`}><t.icon size={20}/></div>
            <div><span className="text-[10px] uppercase font-bold text-slate-400">{t.label}</span><strong className="block text-xl font-extrabold text-lani-navy mt-0.5">{t.val}</strong></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-bold text-slate-500 gap-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`pb-3 border-b-2 px-3 transition-all whitespace-nowrap flex items-center gap-1.5 ${tab===t.key?"border-lani-gold text-lani-gold":"border-transparent hover:text-slate-800"}`}>
            <t.icon size={14}/>{t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-lani-navy mb-4">Upcoming Sessions</h3>
            {myEvents.map(ev => (
              <div key={ev.id} className="flex gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <div className="h-9 w-9 rounded-lg bg-lani-gold/10 flex items-center justify-center shrink-0"><PlayCircle size={16} className="text-lani-gold"/></div>
                <div className="min-w-0"><p className="text-xs font-bold text-lani-navy truncate">{ev.title}</p><p className="text-[10px] text-slate-400">{formatDate(ev.date)} • {ev.time}</p></div>
              </div>
            ))}
            {myEvents.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No upcoming sessions.</p>}
          </div>
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-bold text-lani-navy mb-4">Pending Submissions</h3>
            {pendingSubs.slice(0,5).map(s => (
              <div key={s.id} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <div><p className="text-xs font-bold text-lani-navy">{s.learnerName}</p><p className="text-[10px] text-slate-400">{courseAssignments.find(a => a.id===s.assignmentId)?.title} • {formatDate(s.submittedAt)}</p></div>
                <button onClick={() => {setTab("grading"); setGradingId(s.id);}} className="text-xs font-bold text-lani-gold hover:underline">Grade</button>
              </div>
            ))}
            {pendingSubs.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">All caught up!</p>}
          </div>
        </div>
      )}

      {/* COURSES */}
      {tab === "courses" && (
        <div className="grid gap-5">
          {myCourses.map(c => {
            const courseEnr = myEnrollments.filter(e => e.courseId === c.id);
            const courseAvg = courseEnr.length > 0 ? Math.round(courseEnr.reduce((s,e) => s+e.progress, 0)/courseEnr.length) : 0;
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex gap-4 items-start">
                    <img src={c.image} alt="" className="h-14 w-14 rounded-lg object-cover bg-slate-100 shrink-0"/>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-lani-gold">{c.code}</span>
                      <h3 className="text-base font-bold text-lani-navy">{c.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{courseEnr.length} learners • {c.deliveryModes.join(", ")} • {c.duration}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-semibold text-slate-500">Avg. Completion</div>
                    <div className="text-xl font-extrabold text-lani-navy">{courseAvg}%</div>
                    <div className="progress-bar mt-1 !h-2 w-32"><span style={{width:`${courseAvg}%`}}/></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LEARNER PROGRESS */}
      {tab === "learners" && (
        <div>
          <div className="mb-4"><select value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-lani-navy">
            <option value="all">All Courses</option>
            {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select></div>
          <div className="table-shell border border-slate-200">
            <table>
              <thead><tr><th>Learner</th><th>Course</th><th>Progress</th><th>Payment</th><th>Enrolled</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEnrollments.map(e => {
                  const c = courses.find(x => x.id === e.courseId);
                  return (
                    <tr key={e.id}>
                      <td><strong>{e.learnerName}</strong><span>{e.learnerEmail}</span></td>
                      <td className="text-xs font-semibold">{c?.title || e.courseId}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="progress-bar !h-2 w-20"><span style={{width:`${e.progress}%`}}/></div>
                          <span className="text-xs font-bold text-lani-navy">{e.progress}%</span>
                        </div>
                      </td>
                      <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${e.paymentStatus==="Successful"?"bg-lani-emerald/15 text-lani-green":"bg-amber-100 text-amber-700"}`}>{e.paymentStatus}</span></td>
                      <td className="text-xs">{formatDate(e.enrolledAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* GRADING */}
      {tab === "grading" && (
        <div className="grid gap-4">
          {mySubmissions.length > 0 ? mySubmissions.map(s => {
            const asgn = courseAssignments.find(a => a.id === s.assignmentId);
            const isGrading = gradingId === s.id;
            return (
              <div key={s.id} className={`rounded-xl border p-5 transition-all ${isGrading?"border-lani-gold shadow-md":"border-slate-200"}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-lani-blue">{asgn?.courseTitle}</span>
                    <h4 className="text-sm font-bold text-lani-navy mt-0.5">{asgn?.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">By: {s.learnerName} • {formatDate(s.submittedAt)}</p>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold shrink-0 ${s.status==="Graded"?"bg-lani-emerald/15 text-lani-green":s.status==="Submitted"?"bg-amber-100 text-amber-700":"bg-slate-100 text-slate-500"}`}>{s.status}{s.score !== null ? ` — ${s.score}/${asgn?.maxScore}` : ""}</span>
                </div>
                <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600"><FileText size={12} className="inline mr-1"/>{s.content}</div>
                {s.status === "Submitted" && !isGrading && (
                  <button onClick={() => setGradingId(s.id)} className="mt-3 btn-primary min-h-9 px-4 text-xs"><ClipboardCheck size={13}/>Grade Now</button>
                )}
                {isGrading && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto] items-end border-t border-slate-100 pt-4">
                    <label className="form-field">Score<input type="number" value={gradeScore} onChange={e => setGradeScore(e.target.value)} placeholder={`/${asgn?.maxScore}`} min={0} max={asgn?.maxScore}/></label>
                    <label className="form-field">Feedback<input value={gradeFeedback} onChange={e => setGradeFeedback(e.target.value)} placeholder="Provide constructive feedback..."/></label>
                    <div className="flex gap-2">
                      <button onClick={() => handleGrade(s.id)} className="btn-primary min-h-10 px-4 text-xs"><Send size={13}/>Submit</button>
                      <button onClick={() => setGradingId(null)} className="btn-secondary min-h-10 px-3 text-xs">Cancel</button>
                    </div>
                  </div>
                )}
                {s.feedback && s.status === "Graded" && (
                  <div className="mt-2 rounded-lg bg-lani-mist/50 p-3 text-xs text-slate-600"><strong className="text-lani-navy">Your Feedback:</strong> {s.feedback}</div>
                )}
              </div>
            );
          }) : (
            <div className="py-20 text-center border border-slate-200 rounded-2xl bg-slate-50/50">
              <ClipboardCheck className="mx-auto text-slate-300" size={44}/>
              <h3 className="mt-4 text-base font-bold text-lani-navy">No Submissions</h3>
            </div>
          )}
        </div>
      )}

      {/* ANNOUNCEMENTS */}
      {tab === "announcements" && (
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <form onSubmit={handlePost} className="form-panel border border-slate-200">
            <div><span className="eyebrow">New Post</span><h2 className="mt-3 text-lg font-bold text-lani-navy">Post Announcement</h2></div>
            <label className="form-field">Course<select value={annCourse} onChange={e => setAnnCourse(e.target.value)} required>
              <option value="">Select course...</option>
              {myCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select></label>
            <label className="form-field">Title<input value={annTitle} onChange={e => setAnnTitle(e.target.value)} required placeholder="e.g. Workshop reminder"/></label>
            <label className="form-field">Message<textarea value={annBody} onChange={e => setAnnBody(e.target.value)} required rows={4} placeholder="Write your announcement..."/></label>
            <button type="submit" className="btn-primary w-full justify-center text-xs"><Send size={14}/>Post to Cohort</button>
          </form>
          <div className="space-y-4">
            {myAnnouncements.map(a => (
              <div key={a.id} className="rounded-xl border border-slate-200 p-5">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold"><span className="text-lani-gold">{a.courseTitle}</span> • {formatDate(a.createdAt)} • {a.authorName}</div>
                <h4 className="text-sm font-bold text-lani-navy mt-1.5">{a.title}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-5">{a.body}</p>
              </div>
            ))}
            {myAnnouncements.length === 0 && <div className="py-16 text-center border border-slate-200 rounded-2xl"><Megaphone className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No Announcements</h3></div>}
          </div>
        </div>
      )}
    </div>
  );
}
