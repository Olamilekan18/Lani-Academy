import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, Save, Loader2, X, GripVertical } from "lucide-react";
import type { Course, CourseModule, CourseStatus, DeliveryMode, FacilitatorAssignment } from "../lib/types";
import { dbUploadFile } from "../lib/db";
import toast from "react-hot-toast";

interface CourseEditorProps {
  initial: Course | null;
  thematicAreas: string[];
  facilitators: { fullName: string; email: string }[];
  onSave: (course: Partial<Course>) => Promise<void> | void;
  onAssign: (assignment: FacilitatorAssignment) => Promise<void> | void;
  onCancel: () => void;
}

const STATUSES: CourseStatus[] = ["Open", "Coming Soon", "Application Required", "Corporate Only", "Sold Out", "Archived"];
const DELIVERY: DeliveryMode[] = ["Self-paced", "Instructor-led", "Virtual", "Physical", "Hybrid", "In-plant"];
const TYPES: Course["type"][] = ["Open Programme", "Certification Prep", "Bootcamp", "Corporate", "Sponsored"];
const LEVELS: Course["level"][] = ["Foundation", "Intermediate", "Advanced", "Executive"];

export default function CourseEditor({ initial, thematicAreas, facilitators, onSave, onAssign, onCancel }: CourseEditorProps) {
  const [facilitatorEmail, setFacilitatorEmail] = useState(
    facilitators.find((x) => x.fullName === initial?.facilitator)?.email || ""
  );
  const [f, setF] = useState({
    title: initial?.title || "",
    code: initial?.code || "",
    category: initial?.category || "",
    thematicArea: initial?.thematicArea || thematicAreas[0] || "",
    type: initial?.type || "Open Programme",
    level: initial?.level || "Foundation",
    status: initial?.status || "Open",
    price: String(initial?.price ?? 0),
    duration: initial?.duration || "",
    startDate: initial?.startDate || "",
    endDate: initial?.endDate || "",
    seats: String(initial?.seats ?? 50),
    image: initial?.image || "",
    videoUrl: initial?.videoUrl || "",
    certification: initial?.certification || "Certificate of Completion",
    facilitator: initial?.facilitator || "TBD",
    shortDescription: initial?.shortDescription || "",
    fullDescription: initial?.fullDescription || "",
    featured: initial?.featured || false,
  });
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>(initial?.deliveryModes?.length ? initial.deliveryModes : ["Self-paced"]);
  const [outcomes, setOutcomes] = useState((initial?.outcomes || []).join("\n"));
  const [audience, setAudience] = useState((initial?.audience || []).join("\n"));
  const [modules, setModules] = useState<CourseModule[]>(initial?.modules?.length ? initial.modules : [{ title: "", lessons: [""] }]);
  const [materialFiles, setMaterialFiles] = useState(initial?.materialFiles || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }));
  const toggleMode = (m: DeliveryMode) => setDeliveryModes((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  // Module/lesson builder
  const addModule = () => setModules((m) => [...m, { title: "", lessons: [""] }]);
  const removeModule = (i: number) => setModules((m) => (m.length > 1 ? m.filter((_, idx) => idx !== i) : m));
  const setModuleTitle = (i: number, v: string) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, title: v } : mod)));
  const addLesson = (i: number) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: [...mod.lessons, ""] } : mod)));
  const setLesson = (i: number, li: number, v: string) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: mod.lessons.map((l, j) => (j === li ? v : l)) } : mod)));
  const removeLesson = (i: number, li: number) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: mod.lessons.length > 1 ? mod.lessons.filter((_, j) => j !== li) : mod.lessons } : mod)));

  const removeMaterial = (i: number) => setMaterialFiles((mf) => mf.filter((_, idx) => idx !== i));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title.trim() || !f.code.trim()) { toast.error("Title and code are required."); return; }
    setSaving(true);
    try {
      // Uploads
      let image = f.image;
      if (coverFile) image = (await dbUploadFile(coverFile, "courses")) || image;
      const uploaded = [...materialFiles];
      for (const file of newFiles) {
        const url = await dbUploadFile(file, "materials");
        if (url) uploaded.push({ name: file.name, url });
      }

      const cleanModules = modules
        .map((m) => ({ title: m.title.trim(), lessons: m.lessons.map((l) => l.trim()).filter(Boolean) }))
        .filter((m) => m.title || m.lessons.length);

      const chosenFacilitator = facilitators.find((x) => x.email === facilitatorEmail);
      const facilitatorName = chosenFacilitator?.fullName || f.facilitator || "TBD";
      const courseId = initial?.id || "course-" + Math.random().toString(36).substring(2, 9);

      const course: Partial<Course> = {
        id: courseId,
        title: f.title.trim(),
        code: f.code.trim(),
        category: f.category.trim(),
        thematicArea: f.thematicArea,
        type: f.type as Course["type"],
        level: f.level as Course["level"],
        status: f.status as CourseStatus,
        price: Number(f.price) || 0,
        duration: f.duration,
        startDate: f.startDate,
        endDate: f.endDate,
        seats: Number(f.seats) || 0,
        enrolled: initial?.enrolled ?? 0,
        image: image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
        videoUrl: f.videoUrl || undefined,
        materialFiles: uploaded,
        certification: f.certification,
        facilitator: facilitatorName,
        shortDescription: f.shortDescription,
        fullDescription: f.fullDescription || f.shortDescription,
        outcomes: outcomes.split("\n").map((s) => s.trim()).filter(Boolean),
        audience: audience.split("\n").map((s) => s.trim()).filter(Boolean),
        deliveryModes,
        modules: cleanModules,
        materials: initial?.materials || [],
        assessment: initial?.assessment || "Final Quiz",
        featured: f.featured,
      };
      await onSave(course);
      if (chosenFacilitator) {
        await onAssign({
          facilitatorEmail: chosenFacilitator.email,
          facilitatorName: chosenFacilitator.fullName,
          courseId,
          courseTitle: course.title || "",
          assignedAt: new Date().toISOString(),
        });
      }
      onCancel();
    } catch (err) {
      console.error(err);
      toast.error("Could not save course.");
    }
    setSaving(false);
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-4">
        <button onClick={onCancel} className="grid h-8 w-8 place-items-center rounded-full text-slate-500 hover:bg-slate-100"><ArrowLeft size={16} /></button>
        <div>
          <h2 className="text-lg font-bold text-lani-navy">{initial ? "Edit Course" : "Create New Course"}</h2>
          <p className="text-xs text-slate-500">Build the course details, curriculum, video and materials.</p>
        </div>
      </div>

      <form onSubmit={submit} className="grid gap-6">
        {/* Basics */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-field">Title<input value={f.title} onChange={(e) => set("title", e.target.value)} required /></label>
          <label className="form-field">Code<input value={f.code} onChange={(e) => set("code", e.target.value)} required placeholder="e.g. LDR-301" /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="form-field">Category<input value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="e.g. Leadership" /></label>
          <label className="form-field">Thematic Area
            <select value={f.thematicArea} onChange={(e) => set("thematicArea", e.target.value)}>
              {thematicAreas.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="form-field">Facilitator
            <select value={facilitatorEmail} onChange={(e) => setFacilitatorEmail(e.target.value)}>
              <option value="">— Assign later —</option>
              {facilitators.map((fa) => <option key={fa.email} value={fa.email}>{fa.fullName}</option>)}
            </select>
            {facilitators.length === 0 && <span className="text-[11px] font-medium text-slate-400">No facilitators yet — they appear here once they sign up via the Facilitator portal.</span>}
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="form-field">Type<select value={f.type} onChange={(e) => set("type", e.target.value)}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label className="form-field">Level<select value={f.level} onChange={(e) => set("level", e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></label>
          <label className="form-field">Status<select value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
          <label className="form-field">Price (NGN)<input type="number" min={0} value={f.price} onChange={(e) => set("price", e.target.value)} /></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="form-field col-span-2 sm:col-span-1">Duration<input value={f.duration} onChange={(e) => set("duration", e.target.value)} placeholder="e.g. 4 Weeks" /></label>
          <label className="form-field">Start Date<input type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} /></label>
          <label className="form-field">End Date<input type="date" value={f.endDate} onChange={(e) => set("endDate", e.target.value)} /></label>
          <label className="form-field">Seats<input type="number" min={0} value={f.seats} onChange={(e) => set("seats", e.target.value)} /></label>
        </div>

        {/* Delivery modes */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Delivery modes</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {DELIVERY.map((m) => (
              <button key={m} type="button" onClick={() => toggleMode(m)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${deliveryModes.includes(m) ? "border-lani-green bg-lani-green/5 text-lani-green" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>{m}</button>
            ))}
          </div>
        </div>

        {/* Media */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-field">Cover image URL<input value={f.image} onChange={(e) => set("image", e.target.value)} placeholder="https://... (or upload below)" /></label>
          <label className="form-field">Upload cover image<input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} /></label>
          <label className="form-field sm:col-span-2">Intro / lesson video URL<input value={f.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="YouTube, Vimeo, or direct .mp4" /></label>
        </div>

        {/* Descriptions */}
        <label className="form-field">Short description<textarea rows={2} value={f.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} required /></label>
        <label className="form-field">Full description<textarea rows={3} value={f.fullDescription} onChange={(e) => set("fullDescription", e.target.value)} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="form-field">Learning outcomes (one per line)<textarea rows={3} value={outcomes} onChange={(e) => setOutcomes(e.target.value)} /></label>
          <label className="form-field">Who should attend (one per line)<textarea rows={3} value={audience} onChange={(e) => setAudience(e.target.value)} /></label>
        </div>

        {/* Curriculum */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Curriculum</span>
            <button type="button" onClick={addModule} className="text-xs font-bold text-lani-blue hover:underline inline-flex items-center gap-1"><Plus size={12} />Add module</button>
          </div>
          <div className="mt-3 grid gap-4">
            {modules.map((mod, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2">
                  <GripVertical size={15} className="text-slate-300" />
                  <input value={mod.title} onChange={(e) => setModuleTitle(i, e.target.value)} placeholder={`Module ${i + 1} title`} className="min-h-10 flex-1 rounded-lg border border-slate-200 px-3 text-sm font-semibold outline-none focus:border-lani-green focus:ring-2 focus:ring-lani-green/20" />
                  {modules.length > 1 && <button type="button" onClick={() => removeModule(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={15} /></button>}
                </div>
                <div className="mt-3 grid gap-2 pl-6">
                  {mod.lessons.map((les, li) => (
                    <div key={li} className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">{i + 1}.{li + 1}</span>
                      <input value={les} onChange={(e) => setLesson(i, li, e.target.value)} placeholder="Lesson title" className="min-h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lani-green focus:ring-2 focus:ring-lani-green/20" />
                      {mod.lessons.length > 1 && <button type="button" onClick={() => removeLesson(i, li)} className="text-slate-300 hover:text-red-500"><X size={14} /></button>}
                    </div>
                  ))}
                  <button type="button" onClick={() => addLesson(i)} className="justify-self-start text-xs font-bold text-lani-blue hover:underline inline-flex items-center gap-1"><Plus size={11} />Add lesson</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Materials */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Downloadable materials</span>
          {materialFiles.length > 0 && (
            <div className="mt-2 grid gap-2">
              {materialFiles.map((mf, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs">
                  <span className="truncate text-slate-600">{mf.name}</span>
                  <button type="button" onClick={() => removeMaterial(i)} className="text-slate-400 hover:text-red-500"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          )}
          <input type="file" multiple accept="application/pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,image/*" onChange={(e) => setNewFiles(Array.from(e.target.files || []))} className="mt-2 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-lani-mist file:px-3 file:py-2 file:text-xs file:font-bold file:text-lani-green" />
        </div>

        <label className="flex items-center gap-2 text-sm font-semibold text-lani-navy">
          <input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-lani-green" /> Feature on homepage
        </label>

        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
          <button type="button" onClick={onCancel} className="btn-secondary text-xs">Cancel</button>
          <button type="submit" disabled={saving} className="btn-primary min-h-10 gap-2 px-6 text-xs">
            {saving ? <><Loader2 size={14} className="animate-spin" />Saving...</> : <><Save size={14} />{initial ? "Save changes" : "Publish course"}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
