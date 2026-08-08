import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, X, Save, Loader2, GripVertical } from "lucide-react";
import type { Course, CourseModule } from "../lib/types";
import { dbUploadFile } from "../lib/db";
import toast from "react-hot-toast";

interface Props {
  course: Course;
  onSave: (courseId: string, patch: Partial<Course>) => Promise<void> | void;
  onCancel: () => void;
}

// Focused editor for a course's modules & lessons — used by facilitators
// (and reusable elsewhere). It does not expose commercial course fields.
export default function CurriculumEditor({ course, onSave, onCancel }: Props) {
  const [modules, setModules] = useState<CourseModule[]>(
    course.modules?.length ? course.modules.map((m) => ({ title: m.title, lessons: [...m.lessons] })) : [{ title: "", lessons: [""] }]
  );
  const [videoUrl, setVideoUrl] = useState(course.videoUrl || "");
  const [materialFiles, setMaterialFiles] = useState(course.materialFiles || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  const removeMaterial = (i: number) => setMaterialFiles((mf) => mf.filter((_, idx) => idx !== i));

  const addModule = () => setModules((m) => [...m, { title: "", lessons: [""] }]);
  const removeModule = (i: number) => setModules((m) => (m.length > 1 ? m.filter((_, idx) => idx !== i) : m));
  const setTitle = (i: number, v: string) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, title: v } : mod)));
  const addLesson = (i: number) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: [...mod.lessons, ""] } : mod)));
  const setLesson = (i: number, li: number, v: string) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: mod.lessons.map((l, j) => (j === li ? v : l)) } : mod)));
  const removeLesson = (i: number, li: number) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: mod.lessons.length > 1 ? mod.lessons.filter((_, j) => j !== li) : mod.lessons } : mod)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const clean = modules
      .map((m) => ({ title: m.title.trim(), lessons: m.lessons.map((l) => l.trim()).filter(Boolean) }))
      .filter((m) => m.title || m.lessons.length);
    const uploaded = [...materialFiles];
    for (const file of newFiles) {
      const url = await dbUploadFile(file, "materials");
      if (url) uploaded.push({ name: file.name, url });
    }
    await onSave(course.id, { modules: clean, videoUrl: videoUrl.trim() || undefined, materialFiles: uploaded });
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
        <label className="form-field">Intro / lesson video URL<input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo, or direct .mp4 link" /></label>
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
            <div className="mt-3 grid gap-2 pl-6">
              {mod.lessons.map((les, li) => (
                <div key={li} className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">{i + 1}.{li + 1}</span>
                  <input value={les} onChange={(e) => setLesson(i, li, e.target.value)} placeholder="Lesson title" className="min-h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lani-gold focus:ring-2 focus:ring-lani-gold/20" />
                  {mod.lessons.length > 1 && <button type="button" onClick={() => removeLesson(i, li)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>}
                </div>
              ))}
              <button type="button" onClick={() => addLesson(i)} className="justify-self-start inline-flex items-center gap-1 text-xs font-bold text-lani-blue hover:underline"><Plus size={11} />Add lesson</button>
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
