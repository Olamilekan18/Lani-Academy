import React, { useState } from "react";
import { X, PlayCircle, Download, FileText, CheckCircle2, ChevronRight, Check } from "lucide-react";
import type { Course, Enrollment } from "../lib/types";
import toast from "react-hot-toast";

interface CoursePlayerProps {
  course: Course;
  enrollment: Enrollment;
  onClose: () => void;
  onUpdateProgress: (completedLessons: string[], progress: number) => Promise<void>;
}

export default function CoursePlayer({
  course,
  enrollment,
  onClose,
  onUpdateProgress,
}: CoursePlayerProps) {
  // Extract all lessons into a flat list for simple navigation
  const allLessons = course.modules.flatMap((m) =>
    m.lessons.map((l) => ({ moduleTitle: m.title, lessonTitle: l }))
  );

  const initialCompleted = enrollment.completedLessons || [];
  // Resume from the first lesson the learner hasn't completed yet
  const firstIncomplete = allLessons.findIndex((l) => !initialCompleted.includes(l.lessonTitle));

  const [activeLessonIndex, setActiveLessonIndex] = useState(firstIncomplete === -1 ? 0 : firstIncomplete);
  const [completed, setCompleted] = useState<string[]>(initialCompleted);
  const [saving, setSaving] = useState(false);

  const activeLesson = allLessons[activeLessonIndex] || {
    moduleTitle: "Introduction",
    lessonTitle: "Welcome to LANI Academy",
  };

  const progress = Math.min(100, Math.round((completed.length / Math.max(1, allLessons.length)) * 100));
  const isComplete = progress === 100 && allLessons.length > 0;
  const materialFiles = course.materialFiles || [];

  // Build an embeddable video element from an intro/lesson URL
  const renderVideo = (url: string) => {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (yt) return <iframe title="lesson" src={`https://www.youtube.com/embed/${yt[1]}`} className="absolute inset-0 h-full w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
    if (vimeo) return <iframe title="lesson" src={`https://player.vimeo.com/video/${vimeo[1]}`} className="absolute inset-0 h-full w-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
    return <video controls src={url} className="absolute inset-0 h-full w-full bg-black" />;
  };

  const handleToggleLessonComplete = async (lessonTitle: string) => {
    setSaving(true);
    let updatedCompleted = [...completed];
    if (updatedCompleted.includes(lessonTitle)) {
      updatedCompleted = updatedCompleted.filter((l) => l !== lessonTitle);
    } else {
      updatedCompleted.push(lessonTitle);
    }

    // Calculate progress percentage
    const progressPercent = Math.min(
      100,
      Math.round((updatedCompleted.length / allLessons.length) * 100)
    );

    try {
      await onUpdateProgress(updatedCompleted, progressPercent);
      setCompleted(updatedCompleted);
    } catch (err) {
      console.error("Failed to save progress:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleNextLesson = () => {
    // Check off current lesson first if not already done
    const currentTitle = activeLesson.lessonTitle;
    if (!completed.includes(currentTitle)) {
      handleToggleLessonComplete(currentTitle);
    }

    if (activeLessonIndex < allLessons.length - 1) {
      setActiveLessonIndex(activeLessonIndex + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white">
      {/* Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="text-sm font-bold truncate max-w-sm sm:max-w-md">{course.title}</h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
              <span>{course.code}</span>
              <span>•</span>
              <span>Progress: {Math.min(100, Math.round((completed.length / allLessons.length) * 100))}%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-lani-green transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((completed.length / allLessons.length) * 100))}%`,
              }}
            />
          </div>
          <button onClick={onClose} className="btn-primary min-h-9 px-4 text-xs">
            Save & Exit
          </button>
        </div>
      </header>

      {/* Main Split Body */}
      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        {/* Left Side: Video & Details */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-slate-950 p-6 lg:p-8">
          {/* Video Player — real stream when a URL is set, else a placeholder */}
          <div className="relative aspect-video w-full rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            {course.videoUrl ? (
              renderVideo(course.videoUrl)
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 to-slate-900 opacity-60" />
                <div className="relative z-10 text-center px-4">
                  <PlayCircle size={64} className="mx-auto text-lani-gold animate-pulse mb-4" />
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
              <h2 className="text-md font-bold text-white tracking-tight">Active Lesson Guide</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                In this segment of <strong>{activeLesson.lessonTitle}</strong>, we cover key concepts, business applications, and case references. Review accompanying PDF slides for optimal comprehension.
              </p>
              <button
                type="button"
                onClick={handleNextLesson}
                className="mt-6 btn-primary w-full justify-center text-xs"
              >
                Complete and Continue
              </button>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
              <h2 className="text-md font-bold text-white tracking-tight">Accompanying Materials</h2>
              <div className="mt-4 grid gap-3">
                {materialFiles.length > 0 ? (
                  materialFiles.map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg bg-slate-900 p-3 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <FileText size={16} className="text-lani-gold shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </span>
                      <Download size={14} className="shrink-0" />
                    </a>
                  ))
                ) : course.materials.length > 0 ? (
                  course.materials.map((m, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-slate-900 p-3 text-xs font-semibold text-slate-400">
                      <FileText size={16} className="text-lani-gold shrink-0" />
                      <span className="truncate">{m}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No materials uploaded yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Navigation Syllabus List */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/80">
            <h2 className="text-sm font-bold text-white tracking-tight">Course Outline</h2>
            <p className="text-xs text-slate-400 mt-1">Click a topic to launch video</p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-850">
            {course.modules.map((mod, modIdx) => (
              <div key={mod.title} className="p-4">
                <h3 className="text-xs font-bold text-lani-gold uppercase tracking-wider">
                  Module {modIdx + 1}: {mod.title}
                </h3>
                <div className="mt-3 grid gap-1.5">
                  {mod.lessons.map((les) => {
                    const idx = allLessons.findIndex((al) => al.lessonTitle === les);
                    const isActive = idx === activeLessonIndex;
                    const isDone = completed.includes(les);

                    return (
                      <div
                        key={les}
                        className={`group flex items-center justify-between rounded-lg p-2.5 transition-all text-xs ${
                          isActive
                            ? "bg-lani-green text-white font-bold"
                            : "text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveLessonIndex(idx)}
                          className="flex-1 text-left flex items-start gap-2.5 focus:outline-none"
                        >
                          <PlayCircle
                            size={14}
                            className={`shrink-0 mt-0.5 ${
                              isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                            }`}
                          />
                          <span>{les}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleLessonComplete(les)}
                          disabled={saving}
                          className={`ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                            isDone
                              ? "border-lani-emerald bg-lani-emerald text-white"
                              : "border-slate-700 bg-slate-950 text-transparent hover:border-slate-500"
                          }`}
                        >
                          <Check size={11} className={isDone ? "block" : "hidden"} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
