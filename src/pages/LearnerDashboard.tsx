import React, { useState } from "react";
import { BookOpen, Award, CreditCard, PlayCircle, ShieldCheck, Calendar, ClipboardCheck, User, Bell, ChevronRight, CheckCircle, Clock, FileText, ExternalLink, TrendingUp, AlertCircle } from "lucide-react";
import type { Course, Enrollment, Certificate, Transaction, Quiz, QuizAttempt, Assignment, AssignmentSubmission, Announcement, CalendarEvent, Notification } from "../lib/types";
import { formatMoney, formatDate } from "../lib/utils";
import toast from "react-hot-toast";

type Tab = "overview"|"courses"|"schedule"|"assessments"|"certificates"|"transactions"|"profile";

interface Props {
  enrollments: Enrollment[];
  courses: Course[];
  certificates: Certificate[];
  transactions: Transaction[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  announcements: Announcement[];
  calendarEvents: CalendarEvent[];
  notifications: Notification[];
  onOpenPlayer: (c: Course, e: Enrollment) => void;
  onOpenCertificate: (c: Certificate) => void;
  onTakeQuiz: (q: Quiz) => void;
}

export default function LearnerDashboard({ enrollments, courses, certificates, transactions, quizzes, quizAttempts, assignments, submissions, announcements, calendarEvents, notifications, onOpenPlayer, onOpenCertificate, onTakeQuiz }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [notifOpen, setNotifOpen] = useState(false);

  const programs = enrollments.map(e => ({ enrollment: e, course: courses.find(c => c.id === e.courseId) })).filter(p => p.course);
  const avgProgress = programs.length > 0 ? Math.round(programs.reduce((s, p) => s + p.enrollment.progress, 0) / programs.length) : 0;
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const myAnnouncements = announcements.filter(a => enrollments.some(e => e.courseId === a.courseId));
  const myEvents = calendarEvents.filter(ev => enrollments.some(e => e.courseId === ev.courseId)).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  const myQuizzes = quizzes.filter(q => enrollments.some(e => e.courseId === q.courseId));
  const myAssignments = assignments.filter(a => enrollments.some(e => e.courseId === a.courseId));

  const tabs: {key:Tab;label:string;icon:any}[] = [
    {key:"overview",label:"Overview",icon:TrendingUp},
    {key:"courses",label:"My Courses",icon:BookOpen},
    {key:"schedule",label:"Schedule",icon:Calendar},
    {key:"assessments",label:"Assessments",icon:ClipboardCheck},
    {key:"certificates",label:"Certificates",icon:Award},
    {key:"transactions",label:"Payments",icon:CreditCard},
    {key:"profile",label:"Profile",icon:User},
  ];

  return (
    <div className="section bg-white text-left min-h-[50rem]">
      {/* Welcome Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-lani-navy to-slate-900 p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <span className="eyebrow border-white/20 bg-white/5 text-white/90">LMS Workspace</span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome back, Adewale!</h1>
            <p className="text-xs text-slate-300 max-w-md">Track your learning progress, take assessments, and download your credentials.</p>
          </div>
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative rounded-lg bg-white/10 border border-white/20 p-2.5 hover:bg-white/20 transition-all">
              <Bell size={20} />
              {unreadNotifs > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">{unreadNotifs}</span>}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 max-h-80 overflow-y-auto">
                <div className="p-3 border-b border-slate-100"><h3 className="text-sm font-bold text-lani-navy">Notifications</h3></div>
                {notifications.map(n => (
                  <div key={n.id} className={`px-3 py-2.5 border-b border-slate-50 text-left ${!n.read ? 'bg-lani-mist/50' : ''}`}>
                    <p className="text-xs font-bold text-lani-navy">{n.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {[
          {label:"Active Courses",val:programs.length.toString(),icon:BookOpen,color:"text-lani-blue"},
          {label:"Avg. Progress",val:`${avgProgress}%`,icon:ShieldCheck,color:"text-lani-green"},
          {label:"Certificates",val:certificates.length.toString(),icon:Award,color:"text-lani-gold"},
          {label:"Payments",val:transactions.length.toString(),icon:CreditCard,color:"text-slate-600"},
        ].map(t => (
          <div key={t.label} className="rounded-xl border border-slate-150 bg-slate-50 p-5 flex items-center gap-4">
            <div className={`h-10 w-10 rounded-lg bg-white shadow-sm flex items-center justify-center ${t.color}`}><t.icon size={20}/></div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">{t.label}</span>
              <strong className="block text-xl font-extrabold text-lani-navy mt-0.5">{t.val}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-bold text-slate-500 gap-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`pb-3 border-b-2 px-3 transition-all whitespace-nowrap flex items-center gap-1.5 ${tab === t.key ? "border-lani-green text-lani-green" : "border-transparent hover:text-slate-800"}`}>
            <t.icon size={14}/>{t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            {/* Recent Announcements */}
            <div className="rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-lani-navy mb-4 flex items-center gap-2"><Bell size={15} className="text-lani-blue"/>Recent Announcements</h3>
              {myAnnouncements.slice(0,3).map(a => (
                <div key={a.id} className="py-3 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold"><span className="text-lani-blue">{a.courseTitle}</span> • {formatDate(a.createdAt)}</div>
                  <p className="text-sm font-bold text-lani-navy mt-1">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{a.body}</p>
                </div>
              ))}
              {myAnnouncements.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No announcements yet.</p>}
            </div>
            {/* Active Courses Quick View */}
            <div className="rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-lani-navy mb-4">Course Progress</h3>
              {programs.slice(0,3).map(({enrollment: en, course: c}) => c && (
                <div key={en.id} className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0">
                  <img src={c.image} alt="" className="h-10 w-10 rounded-lg object-cover bg-slate-100 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-lani-navy truncate">{c.title}</p>
                    <div className="progress-bar mt-1.5 !h-2"><span style={{width:`${en.progress}%`}}/></div>
                  </div>
                  <span className="text-xs font-bold text-lani-green shrink-0">{en.progress}%</span>
                </div>
              ))}
            </div>
          </div>
          {/* Sidebar */}
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-lani-navy mb-4 flex items-center gap-2"><Calendar size={15} className="text-lani-green"/>Upcoming Schedule</h3>
              {myEvents.map(ev => (
                <div key={ev.id} className="flex gap-3 py-2.5 border-b border-slate-50 last:border-0">
                  <div className="h-9 w-9 rounded-lg bg-lani-mist flex items-center justify-center shrink-0">
                    {ev.type === "Live Class" ? <PlayCircle size={16} className="text-lani-green"/> : ev.type === "Assessment Deadline" ? <AlertCircle size={16} className="text-lani-coral"/> : <Calendar size={16} className="text-lani-blue"/>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-lani-navy truncate">{ev.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(ev.date)} • {ev.time}</p>
                  </div>
                </div>
              ))}
              {myEvents.length === 0 && <p className="text-xs text-slate-400 py-4 text-center">No upcoming events.</p>}
            </div>
            <div className="rounded-xl border border-slate-200 p-5">
              <h3 className="text-sm font-bold text-lani-navy mb-3">Quick Actions</h3>
              <div className="grid gap-2">
                <button onClick={() => setTab("courses")} className="text-left text-xs font-bold text-lani-blue hover:underline flex items-center gap-1"><ChevronRight size={12}/>Resume Learning</button>
                <button onClick={() => setTab("assessments")} className="text-left text-xs font-bold text-lani-blue hover:underline flex items-center gap-1"><ChevronRight size={12}/>View Pending Assessments</button>
                <button onClick={() => setTab("certificates")} className="text-left text-xs font-bold text-lani-blue hover:underline flex items-center gap-1"><ChevronRight size={12}/>Download Certificates</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COURSES TAB */}
      {tab === "courses" && (
        <div className="grid gap-5">
          {programs.length > 0 ? programs.map(({enrollment: en, course: c}) => c && (
            <div key={en.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex gap-4 items-start">
                <img src={c.image} alt={c.title} className="h-16 w-16 rounded-lg object-cover bg-slate-100 shrink-0"/>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lani-blue">{c.code}</span>
                  <h3 className="text-base font-bold text-lani-navy leading-snug">{c.title}</h3>
                  <p className="text-xs text-slate-400">Enrolled: {formatDate(en.enrolledAt)} • {c.deliveryModes.join(", ")}</p>
                </div>
              </div>
              <div className="flex-1 max-w-xs space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-500"><span>Progress</span><span>{en.progress}%</span></div>
                <div className="progress-bar"><span style={{width:`${en.progress}%`}}/></div>
              </div>
              <button onClick={() => onOpenPlayer(c, en)} className="btn-primary min-h-10 px-5 text-xs self-start md:self-auto gap-2">
                <PlayCircle size={15}/>{en.progress === 100 ? "Review" : "Resume Learning"}
              </button>
            </div>
          )) : (
            <div className="py-20 text-center border border-slate-200 rounded-2xl bg-slate-50/50">
              <BookOpen className="mx-auto text-slate-300" size={44}/>
              <h3 className="mt-4 text-base font-bold text-lani-navy">No Active Enrollments</h3>
              <p className="mt-1 text-xs text-slate-500">Browse the course catalogue to get started.</p>
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE TAB */}
      {tab === "schedule" && (
        <div className="space-y-4">
          {myEvents.length > 0 ? myEvents.map(ev => (
            <div key={ev.id} className="rounded-xl border border-slate-200 p-5 flex items-center gap-4 hover:shadow-sm transition-all">
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${ev.type==="Live Class"?"bg-lani-green/10 text-lani-green":ev.type==="Assessment Deadline"?"bg-red-50 text-lani-coral":"bg-lani-blue/10 text-lani-blue"}`}>
                {ev.type==="Live Class"?<PlayCircle size={22}/>:ev.type==="Assessment Deadline"?<AlertCircle size={22}/>:<Calendar size={22}/>}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{ev.courseTitle}</span>
                <h3 className="text-sm font-bold text-lani-navy mt-0.5">{ev.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2"><Clock size={12}/>{formatDate(ev.date)} • {ev.time} • {ev.venue}</p>
              </div>
              {ev.meetingLink && <a href={ev.meetingLink} target="_blank" rel="noopener noreferrer" className="btn-primary min-h-9 px-4 text-xs gap-1"><ExternalLink size={13}/>Join</a>}
              {!ev.meetingLink && <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${ev.type==="Assessment Deadline"?"bg-red-50 text-lani-coral":"bg-slate-100 text-slate-500"}`}>{ev.type}</span>}
            </div>
          )) : (
            <div className="py-20 text-center border border-slate-200 rounded-2xl bg-slate-50/50">
              <Calendar className="mx-auto text-slate-300" size={44}/>
              <h3 className="mt-4 text-base font-bold text-lani-navy">No Scheduled Events</h3>
            </div>
          )}
        </div>
      )}

      {/* ASSESSMENTS TAB */}
      {tab === "assessments" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold text-lani-navy mb-4">Quizzes</h3>
            <div className="grid gap-4">
              {myQuizzes.map(q => {
                const attempt = quizAttempts.find(a => a.quizId === q.id);
                return (
                  <div key={q.id} className="rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-lani-blue">{q.courseTitle}</span>
                      <h4 className="text-sm font-bold text-lani-navy mt-1">{q.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{q.questions.length} questions • {q.timeLimitMinutes} min • Pass: {q.passingScore}% • Due: {formatDate(q.dueDate)}</p>
                    </div>
                    {attempt ? (
                      <div className="text-right shrink-0">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${attempt.passed?"bg-lani-emerald/15 text-lani-green":"bg-red-50 text-red-600"}`}>{attempt.passed?"Passed":"Failed"} — {attempt.score}%</span>
                        <p className="text-[10px] text-slate-400 mt-1">Taken {formatDate(attempt.submittedAt)}</p>
                      </div>
                    ) : (
                      <button onClick={() => onTakeQuiz(q)} className="btn-primary min-h-9 px-4 text-xs shrink-0"><ClipboardCheck size={14}/>Take Quiz</button>
                    )}
                  </div>
                );
              })}
              {myQuizzes.length === 0 && <p className="text-xs text-slate-400 py-8 text-center">No quizzes available.</p>}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-lani-navy mb-4">Assignments</h3>
            <div className="grid gap-4">
              {myAssignments.map(a => {
                const sub = submissions.find(s => s.assignmentId === a.id && s.learnerEmail === "learner@lani.academy");
                return (
                  <div key={a.id} className="rounded-xl border border-slate-200 p-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-lani-blue">{a.courseTitle}</span>
                    <h4 className="text-sm font-bold text-lani-navy mt-1">{a.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <span className="text-[10px] text-slate-400">Due: {formatDate(a.dueDate)} • Max Score: {a.maxScore}</span>
                      {sub ? (
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${sub.status==="Graded"?"bg-lani-emerald/15 text-lani-green":"bg-amber-100 text-amber-700"}`}>
                          {sub.status==="Graded"?`Graded: ${sub.score}/${a.maxScore}`:sub.status}
                        </span>
                      ) : <span className="inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-slate-100 text-slate-500">Not Submitted</span>}
                    </div>
                    {sub?.feedback && <div className="mt-2 rounded-lg bg-lani-mist/50 p-3 text-xs text-slate-600"><strong className="text-lani-navy">Feedback:</strong> {sub.feedback}</div>}
                  </div>
                );
              })}
              {myAssignments.length === 0 && <p className="text-xs text-slate-400 py-8 text-center">No assignments available.</p>}
            </div>
          </div>
        </div>
      )}

      {/* CERTIFICATES TAB */}
      {tab === "certificates" && (
        <div className="grid gap-4">
          {certificates.length > 0 ? certificates.map(cert => (
            <div key={cert.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center">
              <div className="flex gap-4 items-center">
                <div className="h-10 w-10 rounded-full bg-lani-gold/10 text-lani-gold flex items-center justify-center shrink-0"><Award size={22}/></div>
                <div>
                  <h3 className="text-sm font-bold text-lani-navy">{cert.courseTitle}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ID: <span className="font-semibold text-slate-600">{cert.id}</span> • Issued {formatDate(cert.issueDate)}</p>
                </div>
              </div>
              <button onClick={() => onOpenCertificate(cert)} className="btn-secondary min-h-10 text-xs px-4 border border-slate-200">View Diploma</button>
            </div>
          )) : (
            <div className="py-20 text-center border border-slate-200 rounded-2xl bg-slate-50/50">
              <Award className="mx-auto text-slate-300" size={44}/>
              <h3 className="mt-4 text-base font-bold text-lani-navy">No Certificates Yet</h3>
              <p className="mt-1 text-xs text-slate-500">Complete 100% of a course to earn your certificate.</p>
            </div>
          )}
        </div>
      )}

      {/* TRANSACTIONS TAB */}
      {tab === "transactions" && (
        <div className="table-shell border border-slate-200">
          {transactions.length > 0 ? (
            <table>
              <thead><tr><th>Receipt</th><th>Gateway</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(txn => (
                  <tr key={txn.id}>
                    <td><strong>{txn.receiptNumber}</strong><span>TxID: {txn.id}</span></td>
                    <td>{txn.gateway}</td>
                    <td className="font-bold text-lani-navy">{formatMoney(txn.amount)}</td>
                    <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${txn.status==="Successful"||txn.status==="Manually Confirmed"?"bg-lani-emerald/15 text-lani-green":"bg-amber-100 text-amber-700"}`}>{txn.status}</span></td>
                    <td>{formatDate(txn.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center bg-slate-50/50">
              <CreditCard className="mx-auto text-slate-300" size={44}/>
              <h3 className="mt-4 text-base font-bold text-lani-navy">No Payment History</h3>
            </div>
          )}
        </div>
      )}

      {/* PROFILE TAB */}
      {tab === "profile" && (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <div className="h-16 w-16 rounded-full bg-lani-green text-white flex items-center justify-center text-xl font-bold">AO</div>
              <div>
                <h3 className="text-lg font-bold text-lani-navy">Adewale Okonkwo</h3>
                <p className="text-xs text-slate-500">learner@lani.academy • Learner</p>
              </div>
            </div>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={e => {e.preventDefault(); toast.success("Profile updated (demo)");}}>
              <label className="form-field">Full Name<input defaultValue="Adewale Okonkwo"/></label>
              <label className="form-field">Email<input defaultValue="learner@lani.academy" disabled className="!bg-slate-50"/></label>
              <label className="form-field">Phone<input defaultValue="+234 812 345 6789"/></label>
              <label className="form-field">Organisation<input defaultValue="Apex Bank Plc"/></label>
              <label className="form-field">Job Title<input defaultValue="Senior Digital Analyst"/></label>
              <label className="form-field">Location<input defaultValue="Lagos, Nigeria"/></label>
              <div className="sm:col-span-2 pt-2"><button type="submit" className="btn-primary text-xs px-6">Save Changes</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
