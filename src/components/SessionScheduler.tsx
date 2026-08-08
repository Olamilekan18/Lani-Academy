import React, { useState } from "react";
import { Calendar, Clock, MapPin, Video, Send, Trash2, ExternalLink, UserCheck, Loader2 } from "lucide-react";
import type { Course, CalendarEvent, Enrollment, AttendanceRecord } from "../lib/types";
import { formatDate } from "../lib/utils";
import toast from "react-hot-toast";

interface Props {
  courses: Course[];              // courses this user may schedule for
  events: CalendarEvent[];        // all calendar events
  enrollments: Enrollment[];      // to build attendance rosters
  attendance: AttendanceRecord[]; // existing attendance records
  onSave: (event: CalendarEvent) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
  onSaveAttendance: (records: AttendanceRecord[]) => Promise<void> | void;
}

const TYPES: CalendarEvent["type"][] = ["Live Class", "Workshop", "Webinar", "Orientation", "Assessment Deadline"];

export default function SessionScheduler({ courses, events, enrollments, attendance, onSave, onDelete, onSaveAttendance }: Props) {
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("Live Class");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);

  // Attendance
  const [openAtt, setOpenAtt] = useState<string | null>(null);
  const [marks, setMarks] = useState<Record<string, "Present" | "Absent">>({});
  const [savingAtt, setSavingAtt] = useState(false);

  const openAttendance = (ev: CalendarEvent) => {
    const roster = enrollments.filter((en) => en.courseId === ev.courseId);
    const existing = attendance.filter((a) => a.sessionId === ev.id);
    const initial: Record<string, "Present" | "Absent"> = {};
    roster.forEach((r) => {
      initial[r.learnerEmail] = existing.find((a) => a.learnerEmail === r.learnerEmail)?.status || "Present";
    });
    setMarks(initial);
    setOpenAtt(ev.id);
  };

  const saveAttendance = async (ev: CalendarEvent) => {
    const roster = enrollments.filter((en) => en.courseId === ev.courseId);
    if (roster.length === 0) { toast.error("No enrolled learners for this course."); return; }
    const records: AttendanceRecord[] = roster.map((r) => ({
      sessionId: ev.id,
      learnerEmail: r.learnerEmail,
      learnerName: r.learnerName,
      courseId: ev.courseId,
      status: marks[r.learnerEmail] || "Present",
    }));
    setSavingAtt(true);
    await onSaveAttendance(records);
    setSavingAtt(false);
    setOpenAtt(null);
  };

  const courseIds = courses.map((c) => c.id);
  const myEvents = events
    .filter((e) => courseIds.includes(e.courseId))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) { toast.error("Select a course."); return; }
    if (!title.trim() || !date) { toast.error("Add a title and date."); return; }
    const course = courses.find((c) => c.id === courseId);
    const event: CalendarEvent = {
      id: "evt-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      courseId,
      courseTitle: course?.title || "",
      title: title.trim(),
      type,
      date,
      time: time || "TBC",
      venue: venue.trim() || (link ? "Online" : "TBC"),
      meetingLink: link.trim() || undefined,
    };
    setSaving(true);
    await onSave(event);
    setSaving(false);
    setTitle(""); setDate(""); setTime(""); setVenue(""); setLink("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form onSubmit={submit} className="rounded-xl border border-slate-200 p-6 space-y-4">
        <div><span className="eyebrow">Schedule</span><h2 className="mt-2 text-lg font-bold text-lani-navy">New session</h2></div>
        <label className="form-field">Course
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
            <option value="">Select course...</option>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-field">Title<input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Module 2 live class" /></label>
          <label className="form-field">Type
            <select value={type} onChange={(e) => setType(e.target.value as CalendarEvent["type"])}>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="form-field">Date<input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
          <label className="form-field">Time<input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          <label className="form-field">Venue<input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Room / address (physical)" /></label>
          <label className="form-field">Meeting link<input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Teams / Zoom URL (virtual)" /></label>
        </div>
        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button type="submit" disabled={saving} className="btn-primary text-xs px-6"><Send size={14} />{saving ? "Scheduling..." : "Schedule session"}</button>
        </div>
      </form>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-lani-navy">Upcoming sessions</h3>
        {myEvents.length > 0 ? myEvents.map((ev) => {
          const recs = attendance.filter((a) => a.sessionId === ev.id);
          const present = recs.filter((a) => a.status === "Present").length;
          const roster = enrollments.filter((en) => en.courseId === ev.courseId);
          const isOpen = openAtt === ev.id;
          return (
          <div key={ev.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-lani-mist text-lani-green">
                {ev.type === "Live Class" || ev.type === "Webinar" ? <Video size={18} /> : <Calendar size={18} />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{ev.type} · {ev.courseTitle}</span>
                <h4 className="text-sm font-bold text-lani-navy">{ev.title}</h4>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> {formatDate(ev.date)} · {ev.time}</span>
                  {ev.venue && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {ev.venue}</span>}
                  {ev.meetingLink && <a href={ev.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-lani-blue hover:underline"><ExternalLink size={12} /> Link</a>}
                  {recs.length > 0 && <span className="inline-flex items-center gap-1 font-bold text-lani-green"><UserCheck size={12} /> {present}/{recs.length} present</span>}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button onClick={() => (isOpen ? setOpenAtt(null) : openAttendance(ev))} className="btn-secondary min-h-8 px-3 text-[11px] gap-1"><UserCheck size={13} /> Attendance</button>
                <button onClick={() => onDelete(ev.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
              </div>
            </div>

            {isOpen && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                {roster.length === 0 ? (
                  <p className="text-xs text-slate-400">No learners enrolled in this course yet.</p>
                ) : (
                  <>
                    <div className="grid gap-1.5">
                      {roster.map((r) => (
                        <div key={r.learnerEmail} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-lani-navy">{r.learnerName}</p>
                            <p className="truncate text-[10px] text-slate-400">{r.learnerEmail}</p>
                          </div>
                          <div className="flex gap-1">
                            {(["Present", "Absent"] as const).map((s) => (
                              <button key={s} type="button" onClick={() => setMarks((m) => ({ ...m, [r.learnerEmail]: s }))} className={`rounded-md px-2.5 py-1 text-[11px] font-bold transition-all ${marks[r.learnerEmail] === s ? (s === "Present" ? "bg-lani-green text-white" : "bg-red-500 text-white") : "bg-white text-slate-500 ring-1 ring-slate-200"}`}>{s}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex justify-end gap-2">
                      <button onClick={() => setOpenAtt(null)} className="btn-secondary min-h-8 px-3 text-xs">Cancel</button>
                      <button onClick={() => saveAttendance(ev)} disabled={savingAtt} className="btn-primary min-h-8 px-4 text-xs">
                        {savingAtt ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : "Save attendance"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );}) : (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-xs text-slate-400">No sessions scheduled yet.</div>
        )}
      </div>
    </div>
  );
}
