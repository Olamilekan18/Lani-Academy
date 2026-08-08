import React, { useState } from "react";
import { MessageSquare, Send, Trash2, CornerDownRight, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import type { Course, DiscussionPost } from "../lib/types";
import { formatDate } from "../lib/utils";
import toast from "react-hot-toast";

interface Props {
  courses: Course[];                 // courses this user can discuss
  discussions: DiscussionPost[];     // all posts (RLS-scoped)
  onPost: (post: DiscussionPost) => Promise<void> | void;
  onDelete: (id: string) => Promise<void> | void;
}

export default function CourseForum({ courses, discussions, onPost, onDelete }: Props) {
  const { profile, user } = useAuth();
  const email = profile?.email || user?.email || "";
  const name = profile?.full_name || "You";
  const role = profile?.role || "learner";

  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [busy, setBusy] = useState(false);

  const course = courses.find((c) => c.id === courseId);
  const threads = discussions
    .filter((d) => d.courseId === courseId && !d.parentId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const repliesFor = (id: string) => discussions.filter((d) => d.parentId === id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const makePost = (text: string, parentId: string | null): DiscussionPost => ({
    id: "post-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    courseId,
    courseTitle: course?.title || "",
    authorEmail: email,
    authorName: name,
    authorRole: role,
    body: text.trim(),
    parentId,
    createdAt: new Date().toISOString(),
  });

  const submitThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) { toast.error("Select a course."); return; }
    if (!body.trim()) return;
    setBusy(true);
    await onPost(makePost(body, null));
    setBusy(false);
    setBody("");
  };

  const submitReply = async (parentId: string) => {
    if (!replyBody.trim()) return;
    setBusy(true);
    await onPost(makePost(replyBody, parentId));
    setBusy(false);
    setReplyBody("");
    setReplyTo(null);
  };

  const badge = (r: string) => (r === "learner" ? "bg-lani-blue/10 text-lani-blue" : "bg-lani-gold/10 text-lani-gold");

  if (courses.length === 0) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center text-sm text-slate-400">No courses to discuss yet.</div>;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="filter-field">
          <span>Course</span>
          <select value={courseId} onChange={(e) => { setCourseId(e.target.value); setReplyTo(null); }}>
            {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
      </div>

      {/* New thread */}
      <form onSubmit={submitThread} className="rounded-xl border border-slate-200 p-4">
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Ask a question or start a discussion…" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-lani-green focus:ring-2 focus:ring-lani-green/20" />
        <div className="mt-2 flex justify-end">
          <button type="submit" disabled={busy || !body.trim()} className="btn-primary min-h-9 px-4 text-xs disabled:opacity-50"><Send size={13} />Post</button>
        </div>
      </form>

      {/* Threads */}
      <div className="grid gap-4">
        {threads.length === 0 && <p className="py-8 text-center text-xs text-slate-400">No discussions yet — be the first to post.</p>}
        {threads.map((t) => (
          <div key={t.id} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lani-navy text-xs font-bold text-white">{(t.authorName || "?").charAt(0).toUpperCase()}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-lani-navy">{t.authorName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${badge(t.authorRole)}`}>{t.authorRole}</span>
                    <span className="text-[10px] text-slate-400">{formatDate(t.createdAt)}</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{t.body}</p>
                </div>
              </div>
              {(t.authorEmail === email || role !== "learner") && (
                <button onClick={() => onDelete(t.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={14} /></button>
              )}
            </div>

            {/* Replies */}
            <div className="mt-3 space-y-3 border-l-2 border-slate-100 pl-4">
              {repliesFor(t.id).map((r) => (
                <div key={r.id} className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <CornerDownRight size={14} className="mt-1 shrink-0 text-slate-300" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-lani-navy">{r.authorName}</span>
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ${badge(r.authorRole)}`}>{r.authorRole}</span>
                        <span className="text-[10px] text-slate-400">{formatDate(r.createdAt)}</span>
                      </div>
                      <p className="mt-0.5 whitespace-pre-wrap text-xs text-slate-600">{r.body}</p>
                    </div>
                  </div>
                  {(r.authorEmail === email || role !== "learner") && (
                    <button onClick={() => onDelete(r.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={13} /></button>
                  )}
                </div>
              ))}

              {replyTo === t.id ? (
                <div className="flex items-center gap-2">
                  <input value={replyBody} onChange={(e) => setReplyBody(e.target.value)} placeholder="Write a reply…" className="min-h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lani-green focus:ring-2 focus:ring-lani-green/20" />
                  <button onClick={() => submitReply(t.id)} disabled={busy || !replyBody.trim()} className="btn-primary min-h-9 px-3 text-xs disabled:opacity-50">{busy ? <Loader2 size={13} className="animate-spin" /> : "Reply"}</button>
                  <button onClick={() => { setReplyTo(null); setReplyBody(""); }} className="text-xs text-slate-400 hover:text-lani-navy">Cancel</button>
                </div>
              ) : (
                <button onClick={() => { setReplyTo(t.id); setReplyBody(""); }} className="inline-flex items-center gap-1 text-xs font-bold text-lani-blue hover:underline"><MessageSquare size={12} />Reply</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
