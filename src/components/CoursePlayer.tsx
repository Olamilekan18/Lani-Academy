import React, { useState, useEffect } from "react";
import { X, PlayCircle, Download, FileText, CheckCircle2, Check, Eye, Image as ImageIcon, ExternalLink, Bookmark, StickyNote, Loader2, Lock } from "lucide-react";
import type { Course, Enrollment, LessonNote } from "../lib/types";
import { dbGetNotes, dbSaveNote } from "../lib/db";
import toast from "react-hot-toast";

interface CoursePlayerProps {
  course: Course;
  enrollment: Enrollment;
  onClose: () => void;
  onUpdateProgress: (completedLessons: string[], progress: number) => Promise<void>;
}

type Material = { name: string; url: string; scope: string };
type FileKind = "image" | "pdf" | "office" | "other";

// Distinguish a material by extension so we know how to preview it
const kindOf = (name: string, url: string): FileKind => {
  const s = `${name} ${url}`.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|svg|bmp)(\?|$)/.test(s)) return "image";
  if (/\.pdf(\?|$)/.test(s)) return "pdf";
  if (/\.(docx?|pptx?|xlsx?|odt|ods|odp|rtf|txt|csv)(\?|$)/.test(s)) return "office";
  return "other";
};

export default function CoursePlayer({
  course,
  enrollment,
  onClose,
  onUpdateProgress,
}: CoursePlayerProps) {
  // A module is released if it isn't a draft and its release time has passed.
  const nowMs = Date.now();
  const isReleased = (m: Course["modules"][number]) =>
    !m.draft && (!m.releaseAt || new Date(m.releaseAt).getTime() <= nowMs);

  // Extract all lessons into a flat list for simple navigation.
  // Locked (unreleased) lessons stay in the list — they count toward the total
  // but can't be opened or completed until their module is released.
  const allLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ moduleTitle: m.title, lessonTitle: l, released: isReleased(m), releaseAt: m.releaseAt }))
  );

  // Every downloadable/viewable material across the course, module and lesson scopes
  const allMaterials: Material[] = [
    ...(course.materialFiles || []).map((f) => ({ ...f, scope: "Course" })),
    ...course.modules.flatMap((m) => (m.materials || []).map((f) => ({ ...f, scope: `Module: ${m.title}` }))),
    ...course.modules.flatMap((m) =>
      Object.entries(m.lessonMaterials || {}).flatMap(([lesson, arr]) =>
        (arr || []).map((f) => ({ ...f, scope: `Lesson: ${lesson}` }))
      )
    ),
  ];

  // Completion tracks lessons (by title) + materials (by mat:<url>) in one array.
  const materialId = (url: string) => `mat:${url}`;
  const trackableIds = [
    ...allLessons.map((l) => l.lessonTitle),
    ...allMaterials.map((m) => materialId(m.url)),
  ];

  const initialCompleted = enrollment.completedLessons || [];
  // Resume at the first released, incomplete lesson; fall back to the first released lesson.
  const firstIncomplete = allLessons.findIndex((l) => l.released && !initialCompleted.includes(l.lessonTitle));
  const firstReleased = allLessons.findIndex((l) => l.released);
  const startIndex = firstIncomplete !== -1 ? firstIncomplete : firstReleased !== -1 ? firstReleased : 0;

  const [activeLessonIndex, setActiveLessonIndex] = useState(startIndex);
  const [completed, setCompleted] = useState<string[]>(initialCompleted);
  const [saving, setSaving] = useState(false);
  const [viewer, setViewer] = useState<Material | null>(null);

  // Per-lesson notes & bookmarks (owner = this learner)
  const [notes, setNotes] = useState<Record<string, { body: string; bookmarked: boolean }>>({});
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);
  useEffect(() => {
    dbGetNotes(enrollment.learnerEmail)
      .then((rows: LessonNote[]) => {
        const map: Record<string, { body: string; bookmarked: boolean }> = {};
        rows.filter((r) => r.courseId === course.id).forEach((r) => { map[r.lessonTitle] = { body: r.body, bookmarked: r.bookmarked }; });
        setNotes(map);
      })
      .catch(() => {});
  }, [enrollment.learnerEmail, course.id]);

  const activeLesson = allLessons[activeLessonIndex] || {
    moduleTitle: "Introduction",
    lessonTitle: "Welcome to LANI Academy",
  };
  const activeReleased = allLessons[activeLessonIndex]?.released ?? true;

  const pct = Math.min(
    100,
    Math.round((completed.filter((c) => trackableIds.includes(c)).length / Math.max(1, trackableIds.length)) * 100)
  );
  const isComplete = pct === 100 && trackableIds.length > 0;

  const materialFiles = course.materialFiles || [];
  const activeModule = course.modules.find((m) => m.lessons.includes(activeLesson.lessonTitle));
  const moduleMaterials = activeModule?.materials || [];
  const lessonMaterials = activeModule?.lessonMaterials?.[activeLesson.lessonTitle] || [];
  const activeNote = notes[activeLesson.lessonTitle];

  // Keep the note textarea in sync with the active lesson
  useEffect(() => {
    setNoteDraft(notes[activeLesson.lessonTitle]?.body || "");
  }, [activeLessonIndex, activeLesson.lessonTitle, notes]);

  const persistNote = async (body: string, bookmarked: boolean) => {
    setNotes((n) => ({ ...n, [activeLesson.lessonTitle]: { body, bookmarked } }));
    await dbSaveNote({ learnerEmail: enrollment.learnerEmail, courseId: course.id, lessonTitle: activeLesson.lessonTitle, body, bookmarked });
  };

  const saveNote = async () => {
    setNoteSaving(true);
    await persistNote(noteDraft, activeNote?.bookmarked || false);
    setNoteSaving(false);
    toast.success("Note saved");
  };

  const toggleBookmark = () => persistNote(activeNote?.body || noteDraft, !(activeNote?.bookmarked));

  // Build an embeddable video element from an intro/lesson URL
  const renderVideo = (url: string) => {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (yt) return <iframe title="lesson" src={`https://www.youtube.com/embed/${yt[1]}`} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
    if (vimeo) return <iframe title="lesson" src={`https://player.vimeo.com/video/${vimeo[1]}`} className="absolute inset-0 h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
    return <video controls src={url} className="absolute inset-0 h-full w-full bg-black" />;
  };

  // Persist a new completion set, recomputing progress across lessons + materials
  const persist = async (updated: string[]) => {
    setSaving(true);
    const progressPercent = Math.min(
      100,
      Math.round((updated.filter((c) => trackableIds.includes(c)).length / Math.max(1, trackableIds.length)) * 100)
    );
    try {
      await onUpdateProgress(updated, progressPercent);
      setCompleted(updated);
    } catch (err) {
      console.error("Failed to save progress:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleLessonComplete = (lessonTitle: string) =>
    persist(
      completed.includes(lessonTitle)
        ? completed.filter((l) => l !== lessonTitle)
        : [...completed, lessonTitle]
    );

  // Opening a material for viewing counts toward completion (idempotent)
  const openMaterial = (m: Material) => {
    setViewer(m);
    const id = materialId(m.url);
    if (!completed.includes(id)) persist([...completed, id]);
  };

  const handleNextLesson = () => {
    const currentTitle = activeLesson.lessonTitle;
    if (!completed.includes(currentTitle)) toggleLessonComplete(currentTitle);
    // Advance to the next *released* lesson, skipping locked ones.
    const nextReleased = allLessons.findIndex((l, i) => i > activeLessonIndex && l.released);
    if (nextReleased !== -1) setActiveLessonIndex(nextReleased);
  };

  // A single viewable/downloadable material row
  const MaterialRow = ({ f }: { f: Material }) => {
    const done = completed.includes(materialId(f.url));
    const kind = kindOf(f.name, f.url);
    const Icon = kind === "image" ? ImageIcon : FileText;
    return (
      <div className="flex items-center justify-between rounded-lg bg-slate-900 p-3 text-xs font-semibold text-slate-300 transition-all hover:bg-slate-800">
        <button type="button" onClick={() => openMaterial(f)} className="flex flex-1 items-center gap-2 truncate text-left hover:text-white">
          {done ? <CheckCircle2 size={16} className="shrink-0 text-lani-emerald" /> : <Icon size={16} className="shrink-0 text-lani-gold" />}
          <span className="truncate">{f.name}</span>
        </button>
        <div className="ml-2 flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => openMaterial(f)} title="View" className="text-slate-400 hover:text-white"><Eye size={14} /></button>
          <a href={f.url} target="_blank" rel="noopener noreferrer" title="Download" className="text-slate-400 hover:text-white"><Download size={14} /></a>
        </div>
      </div>
    );
  };

  const renderViewerBody = (m: Material) => {
    const kind = kindOf(m.name, m.url);
    if (kind === "image") return <img src={m.url} alt={m.name} className="mx-auto my-auto max-h-full max-w-full object-contain" />;
    if (kind === "pdf") return <iframe title={m.name} src={m.url} className="h-full w-full bg-white" />;
    if (kind === "office")
      return <iframe title={m.name} src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(m.url)}`} className="h-full w-full bg-white" />;
    return (
      <div className="m-auto max-w-sm text-center text-slate-300">
        <FileText size={48} className="mx-auto mb-4 text-lani-gold" />
        <p className="text-sm">This file type can't be previewed here.</p>
        <a href={m.url} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 inline-flex text-xs">
          <Download size={14} /> Download {m.name}
        </a>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
            <X size={20} />
          </button>
          <div>
            <h1 className="max-w-sm truncate text-sm font-bold sm:max-w-md">{course.title}</h1>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
              <span>{course.code}</span>
              <span>•</span>
              <span>Progress: {pct}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden h-2 w-36 overflow-hidden rounded-full bg-slate-800 sm:block">
            <div className="h-full bg-lani-green transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <button onClick={onClose} className="btn-primary min-h-9 px-4 text-xs">Save & Exit</button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left Side: Video & Details */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-slate-950 p-6 lg:p-8">
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl">
            {course.videoUrl ? (
              renderVideo(course.videoUrl)
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-slate-900 opacity-60" />
                <div className="relative z-10 px-4 text-center">
                  <PlayCircle size={64} className="mx-auto mb-4 animate-pulse text-lani-gold" />
                  <span className="eyebrow border-white/20 bg-white/5 text-white/90">Lesson Video</span>
                  <h3 className="mt-3 text-xl font-bold leading-tight">{activeLesson.lessonTitle}</h3>
                  <p className="mt-1.5 text-xs text-slate-400">Module: {activeLesson.moduleTitle}</p>
                  <p className="mt-3 text-[11px] text-slate-500">No video uploaded yet — your facilitator will add one soon.</p>
                </div>
              </>
            )}
          </div>

          {isComplete && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-lani-emerald/30 bg-lani-emerald/10 p-4 text-sm font-semibold text-lani-green">
              <CheckCircle2 size={20} />
              Course complete — your certificate has been issued. Close the player to view it in your dashboard.
            </div>
          )}

          {/* Lesson Resources & Downloads */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-md font-bold tracking-tight text-white">Active Lesson Guide</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {activeReleased
                  ? <>In this segment of <strong>{activeLesson.lessonTitle}</strong>, we cover key concepts, business applications, and case references. Open the accompanying materials below — each one you view counts toward your progress.</>
                  : "This content hasn't been released yet. Check back when your facilitator publishes the next module — it's already counted in your course total."}
              </p>
              <button type="button" onClick={handleNextLesson} disabled={!activeReleased} className="btn-primary mt-6 w-full justify-center text-xs disabled:opacity-50">
                {activeReleased ? "Complete and Continue" : "Not yet available"}
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-md font-bold tracking-tight text-white">Accompanying Materials</h2>
              <p className="mt-1 text-[11px] text-slate-500">Click to view — viewing counts toward completion.</p>

              {lessonMaterials.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">This lesson: {activeLesson.lessonTitle}</p>
                  <div className="mt-2 grid gap-3">
                    {lessonMaterials.map((f, i) => <MaterialRow key={`l-${i}`} f={{ ...f, scope: "lesson" }} />)}
                  </div>
                </div>
              )}

              {moduleMaterials.length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">This module: {activeModule?.title}</p>
                  <div className="mt-2 grid gap-3">
                    {moduleMaterials.map((f, i) => <MaterialRow key={`m-${i}`} f={{ ...f, scope: "module" }} />)}
                  </div>
                </div>
              )}

              <div className="mt-4">
                {(materialFiles.length > 0 || moduleMaterials.length > 0 || lessonMaterials.length > 0) && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Course materials</p>
                )}
                <div className="mt-2 grid gap-3">
                  {materialFiles.length > 0 ? (
                    materialFiles.map((f, i) => <MaterialRow key={`c-${i}`} f={{ ...f, scope: "course" }} />)
                  ) : course.materials.length > 0 ? (
                    course.materials.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-900 p-3 text-xs font-semibold text-slate-400">
                        <FileText size={16} className="shrink-0 text-lani-gold" />
                        <span className="truncate">{m}</span>
                      </div>
                    ))
                  ) : moduleMaterials.length === 0 && lessonMaterials.length === 0 ? (
                    <p className="text-xs text-slate-500">No materials uploaded yet.</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* My Notes for the active lesson */}
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-md font-bold tracking-tight text-white flex items-center gap-2"><StickyNote size={16} className="text-lani-gold"/>My Notes</h2>
              <button
                type="button"
                onClick={toggleBookmark}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${activeNote?.bookmarked ? "bg-lani-gold/20 text-lani-gold" : "bg-slate-800 text-slate-400 hover:text-white"}`}
              >
                <Bookmark size={14} className={activeNote?.bookmarked ? "fill-lani-gold" : ""}/>{activeNote?.bookmarked ? "Bookmarked" : "Bookmark"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">Private to you — notes for <strong className="text-slate-300">{activeLesson.lessonTitle}</strong>.</p>
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={4}
              placeholder="Jot down key takeaways from this lesson..."
              className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-lani-green focus:ring-2 focus:ring-lani-green/20"
            />
            <button type="button" onClick={saveNote} disabled={noteSaving} className="btn-primary mt-3 text-xs px-5 disabled:opacity-50">
              {noteSaving ? <><Loader2 size={13} className="animate-spin"/>Saving...</> : "Save note"}
            </button>
          </div>
        </div>

        {/* Right Side: Navigation Syllabus List */}
        <div className="flex w-full flex-col overflow-hidden border-t border-slate-800 bg-slate-900 lg:w-96 lg:border-l lg:border-t-0">
          <div className="border-b border-slate-800 bg-slate-900/80 p-4">
            <h2 className="text-sm font-bold tracking-tight text-white">Course Outline</h2>
            <p className="mt-1 text-xs text-slate-400">Click a topic to launch video</p>
          </div>

          <div className="divide-y divide-slate-850 flex-1 overflow-y-auto">
            {course.modules.map((mod, modIdx) => {
              const modReleased = isReleased(mod);
              const releaseLabel = mod.releaseAt ? new Date(mod.releaseAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
              return (
              <div key={mod.title} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-lani-gold">
                    Module {modIdx + 1}: {mod.title}
                  </h3>
                  {!modReleased && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-slate-800 px-2 py-0.5 text-[9px] font-bold text-slate-400">
                      <Lock size={9} />{releaseLabel ? `Releases ${releaseLabel}` : "Coming soon"}
                    </span>
                  )}
                </div>
                <div className="mt-3 grid gap-1.5">
                  {mod.lessons.map((les) => {
                    const idx = allLessons.findIndex((al) => al.lessonTitle === les);
                    const isActive = idx === activeLessonIndex;
                    const isDone = completed.includes(les);

                    if (!modReleased) {
                      return (
                        <div key={les} className="flex items-center gap-2.5 rounded-lg p-2.5 text-xs text-slate-500">
                          <Lock size={13} className="mt-0.5 shrink-0 text-slate-600" />
                          <span className="line-clamp-1">{les}</span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={les}
                        className={`group flex items-center justify-between rounded-lg p-2.5 text-xs transition-all ${
                          isActive ? "bg-lani-green font-bold text-white" : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveLessonIndex(idx)}
                          className="flex flex-1 items-start gap-2.5 text-left focus:outline-none"
                        >
                          <PlayCircle size={14} className={`mt-0.5 shrink-0 ${isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}`} />
                          <span>{les}</span>
                          {notes[les]?.bookmarked && <Bookmark size={11} className={`mt-0.5 shrink-0 ${isActive ? "text-white fill-white" : "text-lani-gold fill-lani-gold"}`} />}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleLessonComplete(les)}
                          disabled={saving}
                          className={`ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                            isDone ? "border-lani-emerald bg-lani-emerald text-white" : "border-slate-700 bg-slate-950 text-transparent hover:border-slate-500"
                          }`}
                        >
                          <Check size={11} className={isDone ? "block" : "hidden"} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Material Viewer Overlay */}
      {viewer && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950/95 backdrop-blur">
          <header className="flex h-14 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={16} className="shrink-0 text-lani-gold" />
              <span className="truncate text-sm font-semibold text-white">{viewer.name}</span>
              <span className="hidden shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-400 sm:inline">{viewer.scope}</span>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a href={viewer.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white" title="Open in new tab">
                <ExternalLink size={14} /> Open
              </a>
              <a href={viewer.url} target="_blank" rel="noopener noreferrer" download className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white" title="Download">
                <Download size={14} /> Download
              </a>
              <button type="button" onClick={() => setViewer(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" title="Close">
                <X size={18} />
              </button>
            </div>
          </header>
          <div className="flex flex-1 overflow-auto p-4">{renderViewerBody(viewer)}</div>
        </div>
      )}
    </div>
  );
}
