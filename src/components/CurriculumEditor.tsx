import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, X, Save, Loader2, GripVertical, Video } from "lucide-react";
import type { Course, CourseModule } from "../lib/types";
import { dbUploadFile, validateUpload, MAX_VIDEO_BYTES, MAX_VIDEO_MB } from "../lib/db";
import toast from "react-hot-toast";

interface Props {
  course: Course;
  onSave: (courseId: string, patch: Partial<Course>) => Promise<void> | void;
  onCancel: () => void;
}

// Focused editor for a course's modules & lessons — used by facilitators
// (and reusable elsewhere). It does not expose commercial course fields.
type Mat = { name: string; url: string };
type DraftLesson = { title: string; materials: Mat[]; newFiles: File[]; videoUrl: string; videoFile: File | null };
type DraftMod = { title: string; lessons: DraftLesson[]; materials: Mat[]; newFiles: File[]; draft: boolean; releaseAt: string; videoUrl: string; videoFile: File | null };

const emptyLesson = (): DraftLesson => ({ title: "", materials: [], newFiles: [], videoUrl: "", videoFile: null });
const emptyModule = (): DraftMod => ({ title: "", lessons: [emptyLesson()], materials: [], newFiles: [], draft: false, releaseAt: "", videoUrl: "", videoFile: null });

const toDraftLessons = (m: CourseModule): DraftLesson[] =>
  (m.lessons.length ? m.lessons : [""]).map((t) => ({ title: t, materials: m.lessonMaterials?.[t] || [], newFiles: [], videoUrl: m.lessonVideos?.[t] || "", videoFile: null }));

// Validate a picked video against the 20MB / video-only rules.
const pickVideo = (file: File | null, apply: (f: File | null) => void) => {
  if (file) {
    const err = validateUpload(file, ["video/*"], MAX_VIDEO_BYTES);
    if (err) { toast.error(err); return; }
  }
  apply(file);
};

export default function CurriculumEditor({ course, onSave, onCancel }: Props) {
  const [modules, setModules] = useState<DraftMod[]>(
    course.modules?.length
      ? course.modules.map((m) => ({ title: m.title, lessons: toDraftLessons(m), materials: m.materials || [], newFiles: [], draft: m.draft || false, releaseAt: m.releaseAt || "", videoUrl: m.videoUrl || "", videoFile: null }))
      : [emptyModule()]
  );
  const [videoUrl, setVideoUrl] = useState(course.videoUrl || "");
  const [sequential, setSequential] = useState(course.sequential || false);
  const [materialFiles, setMaterialFiles] = useState(course.materialFiles || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const removeMaterial = (i: number) => setMaterialFiles((mf) => mf.filter((_, idx) => idx !== i));
  const setModuleFiles = (i: number, files: File[]) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, newFiles: files } : mod)));
  const removeModuleMaterial = (i: number, mi: number) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, materials: mod.materials.filter((_, j) => j !== mi) } : mod)));

  const addModule = () => setModules((m) => [...m, emptyModule()]);
  const setModRelease = (i: number, patch: Partial<Pick<DraftMod, "draft" | "releaseAt">>) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, ...patch } : mod)));
  const setModuleVideoUrl = (i: number, v: string) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, videoUrl: v } : mod)));
  const setModuleVideoFile = (i: number, file: File | null) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, videoFile: file } : mod)));
  const removeModule = (i: number) => setModules((m) => (m.length > 1 ? m.filter((_, idx) => idx !== i) : m));
  const setTitle = (i: number, v: string) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, title: v } : mod)));
  const mapLesson = (i: number, li: number, fn: (l: DraftLesson) => DraftLesson) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: mod.lessons.map((l, j) => (j === li ? fn(l) : l)) } : mod)));
  const addLesson = (i: number) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: [...mod.lessons, emptyLesson()] } : mod)));
  const setLesson = (i: number, li: number, v: string) => mapLesson(i, li, (l) => ({ ...l, title: v }));
  const removeLesson = (i: number, li: number) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: mod.lessons.length > 1 ? mod.lessons.filter((_, j) => j !== li) : mod.lessons } : mod)));
  const setLessonFiles = (i: number, li: number, files: File[]) => mapLesson(i, li, (l) => ({ ...l, newFiles: files }));
  const setLessonVideoUrl = (i: number, li: number, v: string) => mapLesson(i, li, (l) => ({ ...l, videoUrl: v }));
  const setLessonVideoFile = (i: number, li: number, file: File | null) => mapLesson(i, li, (l) => ({ ...l, videoFile: file }));
  const removeLessonMaterial = (i: number, li: number, mi: number) => mapLesson(i, li, (l) => ({ ...l, materials: l.materials.filter((_, j) => j !== mi) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Upload per-module + per-lesson materials, then assemble clean modules
    const clean: CourseModule[] = [];
    for (const m of modules) {
      const materials = [...m.materials];
      for (const file of m.newFiles) {
        const url = await dbUploadFile(file, "materials");
        if (url) materials.push({ name: file.name, url });
      }
      // Module video: uploaded file takes precedence over a pasted URL.
      let modVideo = m.videoUrl.trim();
      if (m.videoFile) {
        const url = await dbUploadFile(m.videoFile, "videos", ["video/*"], MAX_VIDEO_BYTES);
        if (url) modVideo = url;
      }
      const lessons: string[] = [];
      const lessonMaterials: Record<string, Mat[]> = {};
      const lessonVideos: Record<string, string> = {};
      for (const l of m.lessons) {
        const lt = l.title.trim();
        if (!lt) continue;
        lessons.push(lt);
        const lmats = [...l.materials];
        for (const file of l.newFiles) {
          const url = await dbUploadFile(file, "materials");
          if (url) lmats.push({ name: file.name, url });
        }
        if (lmats.length) lessonMaterials[lt] = lmats;
        let lVideo = l.videoUrl.trim();
        if (l.videoFile) {
          const url = await dbUploadFile(l.videoFile, "videos", ["video/*"], MAX_VIDEO_BYTES);
          if (url) lVideo = url;
        }
        if (lVideo) lessonVideos[lt] = lVideo;
      }
      const title = m.title.trim();
      if (title || lessons.length || materials.length) clean.push({
        title, lessons, materials, lessonMaterials,
        videoUrl: modVideo || undefined,
        lessonVideos: Object.keys(lessonVideos).length ? lessonVideos : undefined,
        draft: m.draft || undefined, releaseAt: m.releaseAt || undefined,
      });
    }
    const uploaded = [...materialFiles];
    for (const file of newFiles) {
      const url = await dbUploadFile(file, "materials");
      if (url) uploaded.push({ name: file.name, url });
    }
    await onSave(course.id, { modules: clean, videoUrl: videoUrl.trim() || undefined, sequential, materialFiles: uploaded });
    setSaving(false);
    onCancel();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-4">
        <button onClick={onCancel} className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><ArrowLeft size={16} /></button>
        <div>
          <h2 className="text-lg font-bold text-lani-navy">Manage Curriculum</h2>
          <p className="text-xs text-slate-500">{course.code} · {course.title}</p>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-4">
        {/* Video + materials */}
        <label className="form-field">Course-wide video URL <span className="font-normal text-slate-400">(fallback for lessons without their own)</span><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo, or direct .mp4 link" /></label>

        <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
          <input type="checkbox" checked={sequential} onChange={(e) => setSequential(e.target.checked)} className="mt-0.5 h-4 w-4 accent-lani-green" />
          <span>
            <span className="font-semibold text-lani-navy">Sequential modules</span>
            <span className="mt-0.5 block text-xs text-slate-500">Learners must finish each module before the next one unlocks.</span>
          </span>
        </label>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Downloadable materials</span>
          {materialFiles.length > 0 && (
            <div className="mt-2 grid gap-2">
              {materialFiles.map((mf, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                  <a href={mf.url} target="_blank" rel="noopener noreferrer" className="truncate text-lani-blue hover:underline">{mf.name}</a>
                  <button type="button" onClick={() => removeMaterial(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <input type="file" multiple accept="application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" onChange={(e) => setNewFiles(Array.from(e.target.files || []))} className="mt-2 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-lani-mist file:px-3 file:py-2 file:text-xs file:font-bold file:text-lani-green" />
        </div>

        <div className="pt-1"><span className="text-xs font-bold uppercase tracking-wider text-slate-500">Modules & lessons</span></div>
        {modules.map((mod, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <GripVertical size={15} className="text-slate-300" />
              <input value={mod.title} onChange={(e) => setTitle(i, e.target.value)} placeholder={`Module ${i + 1} title`} className="min-h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-lani-gold focus:ring-2 focus:ring-lani-gold/20" />
              {modules.length > 1 && <button type="button" onClick={() => removeModule(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>}
            </div>

            {/* Release control */}
            <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 bg-white p-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Availability</span>
              <select
                value={mod.draft ? "draft" : mod.releaseAt ? "scheduled" : "now"}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "now") setModRelease(i, { draft: false, releaseAt: "" });
                  else if (v === "draft") setModRelease(i, { draft: true, releaseAt: "" });
                  else setModRelease(i, { draft: false, releaseAt: mod.releaseAt || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) });
                }}
                className="min-h-9 rounded-lg border border-slate-200 px-2 text-xs font-semibold outline-none focus:border-lani-gold"
              >
                <option value="now">Available now</option>
                <option value="scheduled">Schedule release</option>
                <option value="draft">Draft (hidden)</option>
              </select>
              {!mod.draft && mod.releaseAt && (
                <input
                  type="datetime-local"
                  value={mod.releaseAt.slice(0, 16)}
                  onChange={(e) => setModRelease(i, { releaseAt: e.target.value })}
                  className="min-h-9 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-lani-gold"
                />
              )}
              <span className="text-[10px] text-slate-400">Locked content still counts toward the learner's total.</span>
            </div>

            {/* Module video (applies to all lessons in this module without their own) */}
            <div className="mt-3 rounded-lg border border-slate-100 bg-white p-3">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"><Video size={12} className="text-lani-gold" /> Module video (optional)</span>
              <input value={mod.videoUrl} onChange={(e) => setModuleVideoUrl(i, e.target.value)} placeholder="YouTube / Vimeo / .mp4 link" className="mt-1.5 min-h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-lani-gold" />
              <input type="file" accept="video/*" onChange={(e) => pickVideo(e.target.files?.[0] || null, (fl) => setModuleVideoFile(i, fl))} className="mt-1.5 block w-full text-[10px] file:mr-2 file:rounded file:border-0 file:bg-lani-mist file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-lani-green" />
              <span className="mt-1 block text-[10px] text-slate-400">{mod.videoFile ? `Selected: ${mod.videoFile.name}` : `Upload a video (max ${MAX_VIDEO_MB}MB) or paste a link.`}</span>
            </div>

            <div className="mt-3 grid gap-3 pl-6">
              {mod.lessons.map((les, li) => (
                <div key={li} className="rounded-lg border border-slate-100 bg-white p-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400">{i + 1}.{li + 1}</span>
                    <input value={les.title} onChange={(e) => setLesson(i, li, e.target.value)} placeholder="Lesson title" className="min-h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lani-gold focus:ring-2 focus:ring-lani-gold/20" />
                    {mod.lessons.length > 1 && <button type="button" onClick={() => removeLesson(i, li)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>}
                  </div>
                  {les.materials.length > 0 && (
                    <div className="mt-1.5 grid gap-1 pl-8">
                      {les.materials.map((mf, mi) => (
                        <div key={mi} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1 text-[11px]">
                          <a href={mf.url} target="_blank" rel="noopener noreferrer" className="truncate text-lani-blue hover:underline">{mf.name}</a>
                          <button type="button" onClick={() => removeLessonMaterial(i, li, mi)} className="text-slate-400 hover:text-red-500"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input type="file" multiple accept="application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" onChange={(e) => setLessonFiles(i, li, Array.from(e.target.files || []))} className="mt-1.5 ml-8 block text-[10px] file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2 file:py-0.5 file:text-[10px] file:font-bold file:text-lani-navy" />
                  {/* Lesson video */}
                  <div className="mt-1.5 ml-8 flex flex-col gap-1.5 sm:flex-row sm:items-center">
                    <input value={les.videoUrl} onChange={(e) => setLessonVideoUrl(i, li, e.target.value)} placeholder="Lesson video link (optional)" className="min-h-8 flex-1 rounded border border-slate-200 px-2 text-[11px] outline-none focus:border-lani-gold" />
                    <input type="file" accept="video/*" onChange={(e) => pickVideo(e.target.files?.[0] || null, (fl) => setLessonVideoFile(i, li, fl))} className="block text-[10px] file:mr-2 file:rounded file:border-0 file:bg-lani-mist file:px-2 file:py-0.5 file:text-[10px] file:font-bold file:text-lani-green" />
                  </div>
                  {les.videoFile && <span className="mt-0.5 ml-8 block text-[10px] text-slate-400">Selected: {les.videoFile.name}</span>}
                </div>
              ))}
              <button type="button" onClick={() => addLesson(i)} className="justify-self-start inline-flex items-center gap-1 text-xs font-bold text-lani-blue hover:underline"><Plus size={11} />Add lesson</button>
            </div>
            {/* Module materials */}
            <div className="mt-3 pl-6">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Module materials</span>
              {mod.materials.length > 0 && (
                <div className="mt-1.5 grid gap-1.5">
                  {mod.materials.map((mf, mi) => (
                    <div key={mi} className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-1.5 text-xs">
                      <a href={mf.url} target="_blank" rel="noopener noreferrer" className="truncate text-lani-blue hover:underline">{mf.name}</a>
                      <button type="button" onClick={() => removeModuleMaterial(i, mi)} className="text-slate-400 hover:text-red-500"><X size={13} /></button>
                    </div>
                  ))}
                </div>
              )}
              <input type="file" multiple accept="application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" onChange={(e) => setModuleFiles(i, Array.from(e.target.files || []))} className="mt-1.5 block w-full text-[11px] file:mr-2 file:rounded-md file:border-0 file:bg-lani-mist file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-lani-green" />
            </div>
          </div>
        ))}
        <button type="button" onClick={addModule} className="btn-secondary justify-self-start text-xs"><Plus size={14} />Add module</button>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onCancel} className="btn-secondary text-xs">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary min-h-10 gap-2 px-6 text-xs">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Save size={14} />Save curriculum</>}
          </button>
        </div>
      </form>
    </div>
  );
}
