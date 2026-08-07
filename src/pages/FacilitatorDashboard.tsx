import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { GraduationCap, BookOpen, Users, ClipboardCheck, Megaphone, TrendingUp, Clock, CheckCircle, Send, ChevronRight, PlayCircle, FileText, BarChart2, ListChecks, Plus, Trash2, X } from "lucide-react";
import type { Course, Enrollment, FacilitatorAssignment, AssignmentSubmission, Assignment, Announcement, CalendarEvent, Quiz, QuizAttempt } from "../lib/types";
import { formatDate } from "../lib/utils";
import toast from "react-hot-toast";

type DraftQuestion = { question: string; options: string[]; correctIndex: number };

type Tab = "overview"|"courses"|"learners"|"grading"|"quizzes"|"assignments"|"announcements";

interface Props {
  courses: Course[];
  enrollments: Enrollment[];
  assignments: FacilitatorAssignment[];
  courseAssignments: Assignment[];
  submissions: AssignmentSubmission[];
  announcements: Announcement[];
  calendarEvents: CalendarEvent[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  onPostAnnouncement: (a: Omit<Announcement,"id"|"createdAt">) => void;
  onGradeSubmission: (subId: string, score: number, feedback: string) => void;
  onSaveQuiz: (q: Quiz) => Promise<void> | void;
  onSaveAssignment: (a: Assignment) => Promise<void> | void;
}

export default function FacilitatorDashboard({ courses, enrollments, assignments, courseAssignments, submissions, announcements, calendarEvents, quizzes, quizAttempts, onPostAnnouncement, onGradeSubmission, onSaveQuiz, onSaveAssignment }: Props) {
  const { profile, user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [gradingId, setGradingId] = useState<string|null>(null);
  const [gradeScore, setGradeScore] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annCourse, setAnnCourse] = useState("");

  // Quiz builder state
  const [qCourse, setQCourse] = useState("");
  const [qTitle, setQTitle] = useState("");
  const [qDesc, setQDesc] = useState("");
  const [qPass, setQPass] = useState("70");
  const [qTime, setQTime] = useState("15");
  const [qDue, setQDue] = useState("");
  const [qQuestions, setQQuestions] = useState<DraftQuestion[]>([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  const [savingQuiz, setSavingQuiz] = useState(false);

  const myCourseIds = assignments.map(a => a.courseId);
  const myCourses = courses.filter(c => myCourseIds.includes(c.id));
  // Facilitators build quizzes for their assigned courses; fall back to all
  // courses if none are assigned yet so the feature is still usable.
  const quizCourses = myCourses.length ? myCourses : courses;
  const myQuizzes = quizzes.filter(q => quizCourses.some(c => c.id === q.courseId));

  const addQuestion = () => setQQuestions(qs => [...qs, { question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  const removeQuestion = (i: number) => setQQuestions(qs => qs.length > 1 ? qs.filter((_, idx) => idx !== i) : qs);
  const patchQuestion = (i: number, patch: Partial<DraftQuestion>) => setQQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  const setOption = (i: number, oi: number, val: string) => setQQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, options: q.options.map((o, j) => j === oi ? val : o) } : q));
  const addOption = (i: number) => setQQuestions(qs => qs.map((q, idx) => idx === i && q.options.length < 6 ? { ...q, options: [...q.options, ""] } : q));
  const removeOption = (i: number, oi: number) => setQQuestions(qs => qs.map((q, idx) => {
    if (idx !== i || q.options.length <= 2) return q;
    const options = q.options.filter((_, j) => j !== oi);
    let correctIndex = q.correctIndex;
    if (oi === q.correctIndex) correctIndex = 0;
    else if (oi < q.correctIndex) correctIndex = q.correctIndex - 1;
    return { ...q, options, correctIndex };
  }));

  const resetQuizForm = () => {
    setQCourse(""); setQTitle(""); setQDesc(""); setQPass("70"); setQTime("15"); setQDue("");
    setQQuestions([{ question: "", options: ["", "", "", ""], correctIndex: 0 }]);
  };

  // Assignment builder state
  const [aCourse, setACourse] = useState("");
  const [aTitle, setATitle] = useState("");
  const [aDesc, setADesc] = useState("");
  const [aDue, setADue] = useState("");
  const [aMax, setAMax] = useState("100");
  const [savingA, setSavingA] = useState(false);
  const myAssignments = courseAssignments.filter(a => quizCourses.some(c => c.id === a.courseId));

  const submitAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aCourse) { toast.error("Select a course."); return; }
    if (!aTitle.trim()) { toast.error("Give the assignment a title."); return; }
    const course = quizCourses.find(c => c.id === aCourse);
    const assignment: Assignment = {
      id: "asgn-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      courseId: aCourse,
      courseTitle: course?.title || "",
      title: aTitle.trim(),
      description: aDesc.trim(),
      dueDate: aDue,
      maxScore: parseInt(aMax) || 100,
    };
    setSavingA(true);
    await onSaveAssignment(assignment);
    setSavingA(false);
    setACourse(""); setATitle(""); setADesc(""); setADue(""); setAMax("100");
  };

  const submitQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qCourse) { toast.error("Select a course for this quiz."); return; }
    if (!qTitle.trim()) { toast.error("Give the quiz a title."); return; }
    const built = qQuestions.map((q, i) => {
      const correctText = (q.options[q.correctIndex] ?? "").trim();
      const options = q.options.map(o => o.trim()).filter(o => o !== "");
      const correctIndex = Math.max(0, options.indexOf(correctText));
      return { id: `q${i + 1}`, question: q.question.trim(), options, correctIndex };
    });
    if (built.some(q => !q.question || q.options.length < 2)) {
      toast.error("Each question needs text and at least 2 options.");
      return;
    }
    const course = quizCourses.find(c => c.id === qCourse);
    const quiz: Quiz = {
      id: "quiz-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      courseId: qCourse,
      courseTitle: course?.title || "",
      title: qTitle.trim(),
      description: qDesc.trim(),
      questions: built,
      passingScore: parseInt(qPass) || 0,
      timeLimitMinutes: parseInt(qTime) || 0,
      dueDate: qDue,
    };
    setSavingQuiz(true);
    await onSaveQuiz(quiz);
    setSavingQuiz(false);
    resetQuizForm();
  };
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
    {key:"quizzes",label:"Quizzes",icon:ListChecks},
    {key:"assignments",label:"Assignments",icon:FileText},
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
    onPostAnnouncement({ courseId: annCourse, courseTitle: course?.title || "", authorName: profile?.full_name || user?.email || "Facilitator", authorRole: "facilitator", title: annTitle, body: annBody });
    setAnnTitle(""); setAnnBody(""); setAnnCourse("");
  };

  return (
    <div className="section bg-white text-left min-h-[50rem]">
      {/* Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-lani-gold/90 to-amber-700 p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"/>
        <div className="relative z-10 space-y-2">
          <span className="eyebrow border-white/20 bg-white/5 text-white/90">Facilitator Portal</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome, {profile?.full_name || user?.email || "Facilitator"}</h1>
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

      {/* QUIZZES */}
      {tab === "quizzes" && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Builder */}
          <form onSubmit={submitQuiz} className="rounded-xl border border-slate-200 p-6 space-y-5">
            <div><span className="eyebrow">Quiz builder</span><h2 className="mt-2 text-lg font-bold text-lani-navy">Create a quiz</h2></div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="form-field">Course
                <select value={qCourse} onChange={e => setQCourse(e.target.value)} required>
                  <option value="">Select course...</option>
                  {quizCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </label>
              <label className="form-field">Quiz Title<input value={qTitle} onChange={e => setQTitle(e.target.value)} required placeholder="e.g. Module 1 Assessment"/></label>
              <label className="form-field sm:col-span-2">Description<input value={qDesc} onChange={e => setQDesc(e.target.value)} placeholder="Short description (optional)"/></label>
              <label className="form-field">Passing score (%)<input type="number" value={qPass} onChange={e => setQPass(e.target.value)} min={0} max={100}/></label>
              <label className="form-field">Time limit (min)<input type="number" value={qTime} onChange={e => setQTime(e.target.value)} min={0} placeholder="0 = no limit"/></label>
              <label className="form-field sm:col-span-2">Due date<input type="date" value={qDue} onChange={e => setQDue(e.target.value)}/></label>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              {qQuestions.map((q, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-lani-navy">Question {i + 1}</span>
                    {qQuestions.length > 1 && (
                      <button type="button" onClick={() => removeQuestion(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={15}/></button>
                    )}
                  </div>
                  <input value={q.question} onChange={e => patchQuestion(i, { question: e.target.value })} placeholder="Enter the question..." className="mt-2 min-h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lani-gold focus:ring-2 focus:ring-lani-gold/20"/>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Options — select the correct one</p>
                  <div className="mt-2 grid gap-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`correct-${i}`} checked={q.correctIndex === oi} onChange={() => patchQuestion(i, { correctIndex: oi })} className="h-4 w-4 accent-lani-green"/>
                        <input value={opt} onChange={e => setOption(i, oi, e.target.value)} placeholder={`Option ${String.fromCharCode(65 + oi)}`} className="min-h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lani-gold focus:ring-2 focus:ring-lani-gold/20"/>
                        {q.options.length > 2 && (
                          <button type="button" onClick={() => removeOption(i, oi)} className="text-slate-300 hover:text-red-500"><X size={15}/></button>
                        )}
                      </div>
                    ))}
                  </div>
                  {q.options.length < 6 && (
                    <button type="button" onClick={() => addOption(i)} className="mt-2 text-xs font-bold text-lani-blue hover:underline inline-flex items-center gap-1"><Plus size={12}/>Add option</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addQuestion} className="btn-secondary text-xs"><Plus size={14}/>Add question</button>
            </div>

            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button type="submit" disabled={savingQuiz} className="btn-primary text-xs px-6"><Send size={14}/>{savingQuiz ? "Publishing..." : "Publish Quiz"}</button>
            </div>
          </form>

          {/* Existing quizzes */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-lani-navy">Published quizzes</h3>
            {myQuizzes.length > 0 ? myQuizzes.map(q => {
              const attempts = quizAttempts.filter(a => a.quizId === q.id);
              const passed = attempts.filter(a => a.passed).length;
              return (
                <div key={q.id} className="rounded-xl border border-slate-200 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lani-gold">{q.courseTitle}</span>
                  <h4 className="text-sm font-bold text-lani-navy mt-0.5">{q.title}</h4>
                  <p className="text-xs text-slate-500 mt-1">{q.questions.length} questions • Pass {q.passingScore}% • {q.timeLimitMinutes || "No"} min limit</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                    <span>{attempts.length} attempts</span>
                    <span className="text-lani-green">{passed} passed</span>
                    {q.dueDate && <span>Due {formatDate(q.dueDate)}</span>}
                  </div>
                </div>
              );
            }) : (
              <div className="py-12 text-center border border-slate-200 rounded-2xl bg-slate-50/50">
                <ListChecks className="mx-auto text-slate-300" size={40}/>
                <p className="mt-3 text-xs text-slate-500">No quizzes yet. Build one on the left.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ASSIGNMENTS */}
      {tab === "assignments" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <form onSubmit={submitAssignment} className="rounded-xl border border-slate-200 p-6 space-y-4">
            <div><span className="eyebrow">Assignment builder</span><h2 className="mt-2 text-lg font-bold text-lani-navy">Create an assignment</h2></div>
            <label className="form-field">Course
              <select value={aCourse} onChange={e => setACourse(e.target.value)} required>
                <option value="">Select course...</option>
                {quizCourses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <label className="form-field">Title<input value={aTitle} onChange={e => setATitle(e.target.value)} required placeholder="e.g. Capstone project brief"/></label>
            <label className="form-field">Instructions / description<textarea value={aDesc} onChange={e => setADesc(e.target.value)} rows={4} placeholder="What should learners submit?"/></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="form-field">Due date<input type="date" value={aDue} onChange={e => setADue(e.target.value)}/></label>
              <label className="form-field">Max score<input type="number" value={aMax} onChange={e => setAMax(e.target.value)} min={1}/></label>
            </div>
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button type="submit" disabled={savingA} className="btn-primary text-xs px-6"><Send size={14}/>{savingA ? "Publishing..." : "Publish Assignment"}</button>
            </div>
          </form>
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-lani-navy">Published assignments</h3>
            {myAssignments.length > 0 ? myAssignments.map(a => {
              const subs = submissions.filter(s => s.assignmentId === a.id);
              const graded = subs.filter(s => s.status === "Graded").length;
              return (
                <div key={a.id} className="rounded-xl border border-slate-200 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lani-gold">{a.courseTitle}</span>
                  <h4 className="text-sm font-bold text-lani-navy mt-0.5">{a.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{a.description}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                    <span>{subs.length} submissions</span>
                    <span className="text-lani-green">{graded} graded</span>
                    {a.dueDate && <span>Due {formatDate(a.dueDate)}</span>}
                    <span>Max {a.maxScore}</span>
                  </div>
                </div>
              );
            }) : (
              <div className="py-12 text-center border border-slate-200 rounded-2xl bg-slate-50/50">
                <FileText className="mx-auto text-slate-300" size={40}/>
                <p className="mt-3 text-xs text-slate-500">No assignments yet. Create one on the left.</p>
              </div>
            )}
          </div>
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
