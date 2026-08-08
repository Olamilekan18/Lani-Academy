import React, { useState } from "react";
import { Calendar, Clock, MapPin, Video, Send, Trash2, ExternalLink } from "lucide-react";
import type { Course, CalendarEvent } from "../lib/types";
import { formatDate } from "../lib/utils";
import toast from "react-hot-toast";

interface Props {
  courses: Course[];              // courses this user may schedule for
  events: CalendarEvent[];        // all calendar events
  onSave: (event: CalendarEvent) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

const TYPES: CalendarEvent["type"][] = ["Live Class", "Workshop", "Webinar", "Orientation", "Assessment Deadline"];

export default function SessionScheduler({ courses, events, onSave, onDelete }: Props) {
  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarEvent["type"]>("Live Class");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);

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
        {myEvents.length > 0 ? myEvents.map((ev) => (
          <div key={ev.id} className="flex items-center gap-4 rounded-xl border border-slate-200 p-4">
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
              </p>
            </div>
            <button onClick={() => onDelete(ev.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={15} /></button>
          </div>
        )) : (
          <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-xs text-slate-400">No sessions scheduled yet.</div>
        )}
      </div>
    </div>
  );
}
