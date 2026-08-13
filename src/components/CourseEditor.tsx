import React, { useState } from "react";
import { ArrowLeft, Plus, Trash2, Save, Loader2, X, GripVertical, Video } from "lucide-react";
import type { Course, CourseModule, CourseStatus, DeliveryMode, FacilitatorAssignment } from "../lib/types";
import { dbUploadFile, validateUpload, MAX_VIDEO_BYTES, MAX_VIDEO_MB } from "../lib/db";
import toast from "react-hot-toast";

interface CourseEditorProps {
  initial: Course | null;
  thematicAreas: string[];
  facilitators: { fullName: string; email: string }[];
  onSave: (course: Partial<Course>) => Promise<void> | void;
  onAssign: (assignment: FacilitatorAssignment) => Promise<void> | void;
  onCancel: () => void;
}

type Mat = { name: string; url: string };
type DraftLesson = { title: string; materials: Mat[]; newFiles: File[]; videoUrl: string; videoFile: File | null };
type DraftMod = { title: string; lessons: DraftLesson[]; materials: Mat[]; newFiles: File[]; draft: boolean; releaseAt: string; videoUrl: string; videoFile: File | null };
const emptyLesson = (): DraftLesson => ({ title: "", materials: [], newFiles: [], videoUrl: "", videoFile: null });
const emptyModule = (): DraftMod => ({ title: "", lessons: [emptyLesson()], materials: [], newFiles: [], draft: false, releaseAt: "", videoUrl: "", videoFile: null });
const toDraftLessons = (m: CourseModule): DraftLesson[] =>
  (m.lessons.length ? m.lessons : [""]).map((t) => ({ title: t, materials: m.lessonMaterials?.[t] || [], newFiles: [], videoUrl: m.lessonVideos?.[t] || "", videoFile: null }));
const pickVideo = (file: File | null, apply: (f: File | null) => void) => {
  if (file) {
    const err = validateUpload(file, ["video/*"], MAX_VIDEO_BYTES);
    if (err) { toast.error(err); return; }
  }
  apply(file);
};

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
    sequential: initial?.sequential || false,
  });
  const [deliveryModes, setDeliveryModes] = useState<DeliveryMode[]>(initial?.deliveryModes?.length ? initial.deliveryModes : ["Self-paced"]);
  const [outcomes, setOutcomes] = useState((initial?.outcomes || []).join("\n"));
  const [audience, setAudience] = useState((initial?.audience || []).join("\n"));
  const [modules, setModules] = useState<DraftMod[]>(
    initial?.modules?.length
      ? initial.modules.map((m) => ({ title: m.title, lessons: toDraftLessons(m), materials: m.materials || [], newFiles: [], draft: m.draft || false, releaseAt: m.releaseAt || "", videoUrl: m.videoUrl || "", videoFile: null }))
      : [emptyModule()]
  );
  const [materialFiles, setMaterialFiles] = useState(initial?.materialFiles || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof f, v: any) => setF((p) => ({ ...p, [k]: v }));
  const toggleMode = (m: DeliveryMode) => setDeliveryModes((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  // Module/lesson builder
  const addModule = () => setModules((m) => [...m, emptyModule()]);
  const setModRelease = (i: number, patch: Partial<Pick<DraftMod, "draft" | "releaseAt">>) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, ...patch } : mod)));
  const setModuleVideoUrl = (i: number, v: string) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, videoUrl: v } : mod)));
  const setModuleVideoFile = (i: number, file: File | null) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, videoFile: file } : mod)));
  const removeModule = (i: number) => setModules((m) => (m.length > 1 ? m.filter((_, idx) => idx !== i) : m));
  const setModuleTitle = (i: number, v: string) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, title: v } : mod)));
  const mapLesson = (i: number, li: number, fn: (l: DraftLesson) => DraftLesson) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: mod.lessons.map((l, j) => (j === li ? fn(l) : l)) } : mod)));
  const addLesson = (i: number) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: [...mod.lessons, emptyLesson()] } : mod)));
  const setLesson = (i: number, li: number, v: string) => mapLesson(i, li, (l) => ({ ...l, title: v }));
  const removeLesson = (i: number, li: number) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, lessons: mod.lessons.length > 1 ? mod.lessons.filter((_, j) => j !== li) : mod.lessons } : mod)));
  const setLessonFiles = (i: number, li: number, files: File[]) => mapLesson(i, li, (l) => ({ ...l, newFiles: files }));
  const setLessonVideoUrl = (i: number, li: number, v: string) => mapLesson(i, li, (l) => ({ ...l, videoUrl: v }));
  const setLessonVideoFile = (i: number, li: number, file: File | null) => mapLesson(i, li, (l) => ({ ...l, videoFile: file }));
  const removeLessonMaterial = (i: number, li: number, mi: number) => mapLesson(i, li, (l) => ({ ...l, materials: l.materials.filter((_, j) => j !== mi) }));
  const setModuleFiles = (i: number, files: File[]) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, newFiles: files } : mod)));
  const removeModuleMaterial = (i: number, mi: number) => setModules((m) => m.map((mod, idx) => (idx === i ? { ...mod, materials: mod.materials.filter((_, j) => j !== mi) } : mod)));

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

      const cleanModules: CourseModule[] = [];
      for (const m of modules) {
        const materials = [...m.materials];
        for (const file of m.newFiles) {
          const url = await dbUploadFile(file, "materials");
          if (url) materials.push({ name: file.name, url });
        }
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
        if (title || lessons.length || materials.length) cleanModules.push({
          title, lessons, materials, lessonMaterials,
          videoUrl: modVideo || undefined,
          lessonVideos: Object.keys(lessonVideos).length ? lessonVideos : undefined,
          draft: m.draft || undefined, releaseAt: m.releaseAt || undefined,
        });
      }

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
        sequential: f.sequential,
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
          <label className="form-field sm:col-span-2">Course-wide video URL <span className="font-normal text-slate-400">(fallback for lessons without their own)</span><input value={f.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="YouTube, Vimeo, or direct .mp4" /></label>
          <label className="sm:col-span-2 flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
            <input type="checkbox" checked={f.sequential} onChange={(e) => set("sequential", e.target.checked)} className="mt-0.5 h-4 w-4 accent-lani-green" />
            <span>
              <span className="font-semibold text-lani-navy">Sequential modules</span>
              <span className="mt-0.5 block text-xs text-slate-500">Learners must finish each module before the next one unlocks.</span>
            </span>
          </label>
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

                {/* Release control */}
                <div className="mt-3 ml-6 flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 bg-white p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Availability</span>
                  <select
                    value={mod.draft ? "draft" : mod.releaseAt ? "scheduled" : "now"}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "now") setModRelease(i, { draft: false, releaseAt: "" });
                      else if (v === "draft") setModRelease(i, { draft: true, releaseAt: "" });
                      else setModRelease(i, { draft: false, releaseAt: mod.releaseAt || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16) });
                    }}
                    className="min-h-9 rounded-lg border border-slate-200 px-2 text-xs font-semibold outline-none focus:border-lani-green"
                  >
                    <option value="now">Available now</option>
                    <option value="scheduled">Schedule release</option>
                    <option value="draft">Draft (hidden)</option>
                  </select>
                  {!mod.draft && mod.releaseAt && (
                    <input type="datetime-local" value={mod.releaseAt.slice(0, 16)} onChange={(e) => setModRelease(i, { releaseAt: e.target.value })} className="min-h-9 rounded-lg border border-slate-200 px-2 text-xs outline-none focus:border-lani-green" />
                  )}
                  <span className="text-[10px] text-slate-400">Locked content still counts toward the learner's total.</span>
                </div>

                {/* Module video (fallback for lessons in this module without their own) */}
                <div className="mt-3 ml-6 rounded-lg border border-slate-100 bg-white p-3">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500"><Video size={12} className="text-lani-green" /> Module video (optional)</span>
                  <input value={mod.videoUrl} onChange={(e) => setModuleVideoUrl(i, e.target.value)} placeholder="YouTube / Vimeo / .mp4 link" className="mt-1.5 min-h-9 w-full rounded-lg border border-slate-200 px-3 text-xs outline-none focus:border-lani-green" />
                  <input type="file" accept="video/*" onChange={(e) => pickVideo(e.target.files?.[0] || null, (fl) => setModuleVideoFile(i, fl))} className="mt-1.5 block w-full text-[10px] file:mr-2 file:rounded file:border-0 file:bg-lani-mist file:px-2 file:py-1 file:text-[10px] file:font-bold file:text-lani-green" />
                  <span className="mt-1 block text-[10px] text-slate-400">{mod.videoFile ? `Selected: ${mod.videoFile.name}` : `Upload a video (max ${MAX_VIDEO_MB}MB) or paste a link.`}</span>
                </div>

                <div className="mt-3 grid gap-3 pl-6">
                  {mod.lessons.map((les, li) => (
                    <div key={li} className="rounded-lg border border-slate-100 bg-white p-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">{i + 1}.{li + 1}</span>
                        <input value={les.title} onChange={(e) => setLesson(i, li, e.target.value)} placeholder="Lesson title" className="min-h-9 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-lani-green focus:ring-2 focus:ring-lani-green/20" />
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
                        <input value={les.videoUrl} onChange={(e) => setLessonVideoUrl(i, li, e.target.value)} placeholder="Lesson video link (optional)" className="min-h-8 flex-1 rounded border border-slate-200 px-2 text-[11px] outline-none focus:border-lani-green" />
                        <input type="file" accept="video/*" onChange={(e) => pickVideo(e.target.files?.[0] || null, (fl) => setLessonVideoFile(i, li, fl))} className="block text-[10px] file:mr-2 file:rounded file:border-0 file:bg-lani-mist file:px-2 file:py-0.5 file:text-[10px] file:font-bold file:text-lani-green" />
                      </div>
                      {les.videoFile && <span className="mt-0.5 ml-8 block text-[10px] text-slate-400">Selected: {les.videoFile.name}</span>}
                    </div>
                  ))}
                  <button type="button" onClick={() => addLesson(i)} className="justify-self-start text-xs font-bold text-lani-blue hover:underline inline-flex items-center gap-1"><Plus size={11} />Add lesson</button>
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
          </div>
        </div>

        {/* Materials */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Course-wide materials</span>
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
