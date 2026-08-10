import React, { useState, useEffect, useRef } from "react";
import { Shield, Users, Award, DollarSign, TrendingUp, FileText, Upload, RefreshCw, BarChart2, BookOpen, CreditCard, ClipboardCheck, Megaphone, Settings, Download, Search, Edit, Trash2, CheckCircle, XCircle, ExternalLink, Eye, Plus, ArrowLeft, Save, Tag, Send, Calendar, Route, Bell } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import type { Course, Enrollment, Transaction, Certificate, CorporateLead, ProgrammeApplication, CmsAsset, FacilitatorAssignment, PromoCode, ContentItem, CalendarEvent, AttendanceRecord, Pathway, AnalyticsEvent, AuditLog } from "../lib/types";
import { formatMoney, formatDate } from "../lib/utils";
import { seedDatabase, dbUploadFile, dbGetAnalyticsEvents, dbGetAuditLogs } from "../lib/db";
import CourseEditor from "../components/CourseEditor";
import SessionScheduler from "../components/SessionScheduler";
import toast from "react-hot-toast";

type Tab = "overview"|"courses"|"learners"|"payments"|"leads"|"applications"|"certificates"|"cms"|"content"|"pathways"|"sessions"|"promos"|"broadcast"|"audit";

interface Props {
  courses: Course[];
  enrollments: Enrollment[];
  transactions: Transaction[];
  certificates: Certificate[];
  leads: CorporateLead[];
  applications: ProgrammeApplication[];
  assets: CmsAsset[];
  facilitators: {fullName: string, email: string}[];
  facilitatorAssignments: FacilitatorAssignment[];
  promos: PromoCode[];
  subscribers: string[];
  content: ContentItem[];
  calendarEvents: CalendarEvent[];
  attendance: AttendanceRecord[];
  onSaveAttendance: (records: AttendanceRecord[]) => Promise<void> | void;
  pathways: Pathway[];
  onSavePathway: (p: Partial<Pathway>) => Promise<void> | void;
  onDeletePathway: (id: string) => Promise<void> | void;
  onSavePromo: (p: Partial<PromoCode>) => Promise<void> | void;
  onBroadcast: (emails: string[], subject: string, message: string) => Promise<void> | void;
  onSaveContent: (i: Partial<ContentItem>) => Promise<void> | void;
  onDeleteContent: (id: string) => Promise<void> | void;
  onSaveEvent: (e: CalendarEvent) => Promise<void> | void;
  onDeleteEvent: (id: string) => Promise<void> | void;
  onUpdateLeadStage: (id: string, stage: CorporateLead["stage"]) => Promise<void>;
  onUpdateAppStatus: (id: string, status: ProgrammeApplication["status"]) => Promise<void>;
  onConvertApplicant: (app: ProgrammeApplication, courseId: string) => Promise<void> | void;
  onUpdateCertificateStatus: (cert: Certificate, status: Certificate["status"]) => Promise<void> | void;
  onAddAsset: (d: any) => Promise<void>;
  onAddCourse: (course: Partial<Course>) => Promise<void>;
  onAssignFacilitator: (assignment: FacilitatorAssignment) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onUpdatePaymentStatus: (id: string, status: Transaction["status"]) => void;
}

const COLORS = ["#087443","#0b66c3","#c9972b","#d95845","#10a768","#6366f1","#ec4899","#14b8a6"];

export default function AdminDashboard({ courses, enrollments, transactions, certificates, leads, applications, assets, facilitators, facilitatorAssignments, promos, subscribers, content, calendarEvents, attendance, onSaveAttendance, pathways, onSavePathway, onDeletePathway, onSavePromo, onBroadcast, onSaveContent, onDeleteContent, onSaveEvent, onDeleteEvent, onUpdateLeadStage, onUpdateAppStatus, onConvertApplicant, onUpdateCertificateStatus, onAddAsset, onAddCourse, onAssignFacilitator, onRefreshData, onUpdatePaymentStatus }: Props) {
  const [tab, setTab] = useState<Tab>(() => {
    try { return (localStorage.getItem("lani-admin-tab") as Tab) || "overview"; } catch { return "overview"; }
  });
  useEffect(() => { try { localStorage.setItem("lani-admin-tab", tab); } catch { /* ignore */ } }, [tab]);
  const [seeding, setSeeding] = useState(false);
  const [addingAsset, setAddingAsset] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [addingCourseObj, setAddingCourseObj] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | "new" | null>(null);
  const courseThemes = Array.from(new Set(courses.map(c => c.thematicArea).filter(Boolean)));
  const [assigningCourse, setAssigningCourse] = useState<Course | null>(null);
  const [enrollingApp, setEnrollingApp] = useState<ProgrammeApplication | null>(null);
  const [enrolCourseId, setEnrolCourseId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!alertsOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) setAlertsOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setAlertsOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [alertsOpen]);
  const [proofModalTxn, setProofModalTxn] = useState<Transaction | null>(null);
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  useEffect(() => { dbGetAnalyticsEvents().then(setEvents).catch(() => {}); }, []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  useEffect(() => { if (tab === "audit") dbGetAuditLogs().then(setAuditLogs).catch(() => {}); }, [tab]);
  const viewCount = events.filter(e => e.type === "view").length;
  const startCount = events.filter(e => e.type === "checkout_start").length;
  const completeCount = events.filter(e => e.type === "checkout_complete").length;
  const abandoned = Math.max(0, startCount - completeCount);
  const checkoutConversion = startCount > 0 ? Math.round((completeCount / startCount) * 100) : 0;
  const viewsByCourse = events.filter(e => e.type === "view" && e.courseId).reduce((acc: Record<string, number>, e) => { acc[e.courseId!] = (acc[e.courseId!] || 0) + 1; return acc; }, {});
  const topViewed = Object.entries(viewsByCourse).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxViews = topViewed.length ? topViewed[0][1] : 0;
  const totalRevenue = transactions.filter(t => t.status==="Successful"||t.status==="Manually Confirmed").reduce((s,t) => s+Number(t.amount), 0);
  const avgCompletion = enrollments.length > 0 ? Math.round(enrollments.reduce((s,e) => s+e.progress, 0)/enrollments.length) : 0;
  const pendingPayments = transactions.filter(t => t.status === "Pending").length;
  const adminAlerts = [
    { label: "Payments to confirm", count: pendingPayments, tab: "payments" as Tab },
    { label: "New corporate leads", count: leads.filter(l => l.stage === "New").length, tab: "leads" as Tab },
    { label: "New applications", count: applications.filter(a => a.status === "Submitted").length, tab: "applications" as Tab },
  ].filter(a => a.count > 0);
  const totalAlerts = adminAlerts.reduce((s, a) => s + a.count, 0);

  // Real revenue for the last 6 months, from confirmed transactions
  const chartData = (() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { name: d.toLocaleString(undefined, { month: "short" }), key: `${d.getFullYear()}-${d.getMonth()}`, Revenue: 0 };
    });
    const idx = new Map(months.map((m, i) => [m.key, i]));
    for (const t of transactions) {
      if (t.status !== "Successful" && t.status !== "Manually Confirmed") continue;
      const d = new Date(t.createdAt);
      if (isNaN(d.getTime())) continue;
      const i = idx.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (i !== undefined) months[i].Revenue += Number(t.amount) || 0;
    }
    return months.map(({ name, Revenue }) => ({ name, Revenue }));
  })();

  const areaCounts = courses.reduce((acc:Record<string,number>, c) => {
    acc[c.thematicArea] = (acc[c.thematicArea]||0) + enrollments.filter(e => e.courseId===c.id).length;
    return acc;
  }, {});
  const enrollChart = Object.keys(areaCounts).map(k => ({name:k.split(" ").slice(0,2).join(" "),Enrollments:areaCounts[k]}));

  const leadStageData = ["New","Contacted","Proposal Sent","Negotiation","Won","Lost"].map(s => ({name:s,count:leads.filter(l=>l.stage===s).length}));
  const pieData = courses.reduce((acc:any[], c) => {
    const area = acc.find(a => a.name === c.thematicArea);
    if (area) area.value++; else acc.push({name:c.thematicArea.split(" ").slice(0,2).join(" "), value:1});
    return acc;
  }, []);

  // Revenue by thematic area (BRD REP-004)
  const revenueByArea = courses.reduce((acc:Record<string,number>, c) => {
    const rev = transactions
      .filter(t => t.courseId===c.id && (t.status==="Successful"||t.status==="Manually Confirmed"))
      .reduce((s,t) => s+Number(t.amount), 0);
    if (rev>0) acc[c.thematicArea] = (acc[c.thematicArea]||0) + rev;
    return acc;
  }, {});
  const revenueAreaList = Object.entries(revenueByArea).sort((a,b) => b[1]-a[1]);
  const maxAreaRevenue = revenueAreaList.length ? revenueAreaList[0][1] : 0;

  // Lead conversion rate (BRD REP-008)
  const wonLeads = leads.filter(l => l.stage==="Won").length;
  const conversionRate = leads.length ? Math.round((wonLeads/leads.length)*100) : 0;

  // Real CSV export (BRD REP-010)
  const exportCsv = (filename: string, rows: Record<string, any>[]) => {
    if (!rows.length) { toast.error("Nothing to export yet."); return; }
    const headers = Object.keys(rows[0]);
    const esc = (v:any) => `"${String(v ?? "").replace(/"/g,'""')}"`;
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded.");
  };

  const handleSeed = async () => { setSeeding(true); const ok = await seedDatabase(); if(ok){toast.success("Courses seeded!"); await onRefreshData();}else{toast.error("Seed failed.");} setSeeding(false); };

  const handleSubmitAsset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    setAddingAsset(true);
    const fd = new FormData(form);
    try {
      const file = fd.get("assetFile") as File | null;
      let url: string | undefined;
      if (file && file.size > 0) {
        const uploaded = await dbUploadFile(file, "cms");
        if (!uploaded) { toast.error("File upload failed."); setAddingAsset(false); return; }
        url = uploaded;
      }
      await onAddAsset({
        name: fd.get("assetName"),
        type: fd.get("assetType"),
        placement: fd.get("placement"),
        owner: fd.get("owner") || "Content Manager",
        status: fd.get("status") || "Draft",
        url,
      });
      toast.success("Asset registered.");
      form.reset();
    } catch (err) { console.error(err); }
    setAddingAsset(false);
  };

  const handleAddCourseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAddingCourseObj(true);
    const fd = new FormData(e.currentTarget);

    // Upload any attached course material files to Storage
    const files = (fd.getAll("materialFiles") as File[]).filter(f => f && f.size > 0);
    const materialFiles: { name: string; url: string }[] = [];
    for (const f of files) {
      const url = await dbUploadFile(f, "materials");
      if (url) materialFiles.push({ name: f.name, url });
    }

    const newCourse: Partial<Course> = {
      id: "course-" + Math.random().toString(36).substring(2, 9),
      title: fd.get("title") as string,
      code: fd.get("code") as string,
      category: fd.get("category") as string,
      thematicArea: fd.get("thematicArea") as string,
      type: fd.get("type") as any,
      level: fd.get("level") as any,
      price: Number(fd.get("price")),
      duration: fd.get("duration") as string,
      status: fd.get("status") as any,
      startDate: fd.get("startDate") as string,
      endDate: fd.get("endDate") as string,
      seats: Number(fd.get("seats")),
      enrolled: 0,
      image: (fd.get("image") as string) || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      shortDescription: fd.get("shortDescription") as string,
      fullDescription: (fd.get("shortDescription") as string) + " (Full description pending)",
      outcomes: ["Understand core concepts", "Apply knowledge in practical scenarios", "Earn certification"],
      audience: ["Professionals", "Students"],
      deliveryModes: ["Virtual", "Self-paced"] as any[],
      modules: [],
      materials: [],
      videoUrl: (fd.get("videoUrl") as string) || undefined,
      materialFiles,
      assessment: "Final Quiz",
      featured: false,
      certification: "Certificate of Completion",
      facilitator: "TBD"
    };

    try {
      await onAddCourse(newCourse);
      setIsAddingCourse(false);
    } catch (err) {
      console.error(err);
    }
    setAddingCourseObj(false);
  };

  const handleAssignSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!assigningCourse) return;
    setIsAssigning(true);
    const fd = new FormData(e.currentTarget);
    const selectedEmail = fd.get("facilitator") as string;
    const selectedFacilitator = facilitators.find(f => f.email === selectedEmail);

    if (!selectedFacilitator) return;

    const assignment: FacilitatorAssignment = {
      facilitatorEmail: selectedFacilitator.email,
      facilitatorName: selectedFacilitator.fullName,
      courseId: assigningCourse.id,
      courseTitle: assigningCourse.title,
      assignedAt: new Date().toISOString()
    };
    try {
      await onAssignFacilitator(assignment);
      setAssigningCourse(null);
    } catch(err) {
      console.error(err);
    }
    setIsAssigning(false);
  };

  const tabs: {key:Tab;label:string;icon:any;count?:number}[] = [
    {key:"overview",label:"Overview",icon:BarChart2},
    {key:"courses",label:"Courses",icon:BookOpen,count:courses.length},
    {key:"learners",label:"Learners",icon:Users,count:enrollments.length},
    {key:"payments",label:"Payments",icon:CreditCard,count:transactions.length},
    {key:"leads",label:"Corporate Leads",icon:Shield,count:leads.length},
    {key:"applications",label:"Applications",icon:ClipboardCheck,count:applications.length},
    {key:"certificates",label:"Certificates",icon:Award,count:certificates.length},
    {key:"cms",label:"CMS Assets",icon:FileText,count:assets.length},
    {key:"content",label:"Articles & Resources",icon:Edit,count:content.length},
    {key:"pathways",label:"Pathways",icon:Route,count:pathways.length},
    {key:"sessions",label:"Sessions",icon:Calendar,count:calendarEvents.length},
    {key:"promos",label:"Promo Codes",icon:Tag,count:promos.length},
    {key:"broadcast",label:"Broadcast",icon:Send},
    {key:"audit",label:"Audit Log",icon:ClipboardCheck},
  ];

  // Broadcast email state
  const [bcAudience, setBcAudience] = useState("learners");
  const [bcCourse, setBcCourse] = useState("");
  const [bcCourseIds, setBcCourseIds] = useState<string[]>([]);
  const [bcSelected, setBcSelected] = useState<string[]>([]);
  const [bcCustom, setBcCustom] = useState("");
  const [bcSubject, setBcSubject] = useState("");
  const [bcMessage, setBcMessage] = useState("");
  const [bcBusy, setBcBusy] = useState(false);

  // Unique participants (name + email) across all enrollments
  const participants = Array.from(new Map(enrollments.map(e => [e.learnerEmail, e])).values());
  const toggleBcCourse = (id: string) => setBcCourseIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleBcSelected = (email: string) => setBcSelected(p => p.includes(email) ? p.filter(x => x !== email) : [...p, email]);

  const bcRecipients = (): string[] => {
    if (bcAudience === "learners") return enrollments.map(e => e.learnerEmail);
    if (bcAudience === "course") return enrollments.filter(e => e.courseId === bcCourse).map(e => e.learnerEmail);
    if (bcAudience === "courses") return enrollments.filter(e => bcCourseIds.includes(e.courseId)).map(e => e.learnerEmail);
    if (bcAudience === "participants") return bcSelected;
    if (bcAudience === "leads") return leads.map(l => l.email);
    if (bcAudience === "subscribers") return subscribers;
    if (bcAudience === "custom") return bcCustom.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    return [];
  };
  const bcCount = Array.from(new Set(bcRecipients().map(e => (e || "").trim().toLowerCase()).filter(e => e.includes("@")))).length;

  const handleSendBroadcast = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!bcSubject.trim() || !bcMessage.trim()) { toast.error("Add a subject and message."); return; }
    if (bcCount === 0) { toast.error("No valid recipients for that audience."); return; }
    setBcBusy(true);
    await onBroadcast(bcRecipients(), bcSubject.trim(), bcMessage.trim());
    setBcBusy(false);
    setBcSubject(""); setBcMessage("");
  };

  const [pathwayCourses, setPathwayCourses] = useState<string[]>([]);
  const [savingPathway, setSavingPathway] = useState(false);
  const [pathwayCoverPreview, setPathwayCoverPreview] = useState<string>("");
  const togglePathwayCourse = (id: string) => setPathwayCourses((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const onPathwayCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setPathwayCoverPreview(f ? URL.createObjectURL(f) : "");
  };
  const handleSavePathwaySubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    if (pathwayCourses.length === 0) { toast.error("Select at least one course."); return; }
    setSavingPathway(true);
    try {
      // Prefer an uploaded image; fall back to a pasted URL if provided.
      const coverFile = fd.get("pcover") as File | null;
      let image = (fd.get("pimage") as string) || "";
      if (coverFile && coverFile.size > 0) {
        const uploaded = await dbUploadFile(coverFile, "content");
        if (!uploaded) { toast.error("Cover image upload failed."); setSavingPathway(false); return; }
        image = uploaded;
      }
      await onSavePathway({
        id: "path-" + Date.now().toString(36),
        title: fd.get("ptitle") as string,
        description: (fd.get("pdesc") as string) || "",
        image,
        courseIds: pathwayCourses,
        price: Number(fd.get("pprice")) || 0,
        featured: false,
        published: fd.get("ppublished") === "on",
      });
      setPathwayCourses([]);
      setPathwayCoverPreview("");
      form.reset();
    } finally {
      setSavingPathway(false);
    }
  };

  const [savingContent, setSavingContent] = useState(false);
  const handleSaveContentSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSavingContent(true);
    try {
      const coverFile = fd.get("cover") as File | null;
      const docFile = fd.get("file") as File | null;
      let imageUrl = "";
      let fileUrl = "";
      if (coverFile && coverFile.size > 0) imageUrl = (await dbUploadFile(coverFile, "content")) || "";
      if (docFile && docFile.size > 0) fileUrl = (await dbUploadFile(docFile, "content")) || "";
      await onSaveContent({
        id: "cnt-" + Date.now().toString(36),
        type: fd.get("type") as ContentItem["type"],
        title: fd.get("title") as string,
        category: (fd.get("category") as string) || "",
        excerpt: (fd.get("excerpt") as string) || "",
        body: (fd.get("body") as string) || "",
        author: (fd.get("author") as string) || "LANI Academy",
        imageUrl,
        fileUrl,
        published: fd.get("published") === "on",
      });
      form.reset();
    } catch (err) { console.error(err); }
    setSavingContent(false);
  };

  const handleSavePromoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    await onSavePromo({
      code: (fd.get("code") as string).trim().toUpperCase(),
      description: (fd.get("pdesc") as string) || "",
      discountPercent: Number(fd.get("discount")) || 0,
      active: true,
      expiresAt: (fd.get("expires") as string) || null,
      maxUses: Number(fd.get("maxUses")) || 0,
      uses: 0,
    });
    form.reset();
  };

  return (
    <div className="section bg-white text-left min-h-[50rem]">
      {/* Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-lani-blue to-slate-900 p-8 text-white relative z-30 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 rounded-2xl overflow-hidden bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"/>
        <div className="relative z-10 space-y-2">
          <span className="eyebrow border-white/20 bg-white/5 text-white/90">Administrative Operations</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-300 max-w-md">Manage courses, learners, payments, leads, applications, certificates and CMS assets.</p>
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <div className="relative" ref={alertsRef}>
            <button onClick={() => setAlertsOpen(!alertsOpen)} className="relative rounded-lg bg-white/10 border border-white/20 p-2.5 hover:bg-white/20 transition-all">
              <Bell size={18} />
              {totalAlerts > 0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">{totalAlerts}</span>}
            </button>
            {alertsOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 z-50 text-left">
                <div className="p-3 border-b border-slate-100"><h3 className="text-sm font-bold text-lani-navy">Action needed</h3></div>
                {adminAlerts.length > 0 ? adminAlerts.map(a => (
                  <button key={a.tab} onClick={() => { setTab(a.tab); setAlertsOpen(false); }} className="flex w-full items-center justify-between px-3 py-2.5 border-b border-slate-50 text-left hover:bg-slate-50">
                    <span className="text-xs font-semibold text-lani-navy">{a.label}</span>
                    <span className="rounded-full bg-lani-coral/15 text-lani-coral text-[10px] font-bold px-2 py-0.5">{a.count}</span>
                  </button>
                )) : <div className="px-3 py-8 text-center text-xs text-slate-400">You're all caught up 🎉</div>}
              </div>
            )}
          </div>
          <button onClick={handleSeed} disabled={seeding} className="rounded-lg bg-lani-gold hover:bg-yellow-600 text-lani-navy px-4 py-2.5 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5">
            <RefreshCw size={13} className={seeding?"animate-spin":""}/>{seeding?"Seeding...":"Seed Courses"}
          </button>
          <button onClick={onRefreshData} className="rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2.5 text-xs font-bold text-white transition-all flex items-center gap-1.5"><RefreshCw size={13}/>Refresh</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {[
          {label:"Revenue",val:formatMoney(totalRevenue),icon:DollarSign,color:"text-lani-green"},
          {label:"Enrollments",val:enrollments.length.toString(),icon:Users,color:"text-lani-blue"},
          {label:"Completion",val:`${avgCompletion}%`,icon:TrendingUp,color:"text-lani-emerald"},
          {label:"Certificates",val:certificates.length.toString(),icon:Award,color:"text-lani-gold"},
          {label:"Pending Payments",val:pendingPayments.toString(),icon:CreditCard,color:"text-lani-coral"},
        ].map(t => (
          <div key={t.label} className="rounded-xl border border-slate-150 bg-slate-50 p-4 flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg bg-white shadow-sm flex items-center justify-center ${t.color}`}><t.icon size={18}/></div>
            <div><span className="text-[10px] uppercase font-bold text-slate-400">{t.label}</span><strong className="block text-lg font-extrabold text-lani-navy">{t.val}</strong></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 text-sm font-bold text-slate-500 gap-1 mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`pb-3 border-b-2 px-3 transition-all whitespace-nowrap flex items-center gap-1.5 ${tab===t.key?"border-lani-blue text-lani-blue":"border-transparent hover:text-slate-800"}`}>
            <t.icon size={14}/>{t.label}{t.count!==undefined&&<span className="text-[10px] bg-slate-100 rounded-full px-1.5 py-0.5 text-slate-500">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="grid gap-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-lani-navy flex items-center gap-1.5 mb-6 uppercase tracking-wider"><TrendingUp size={16} className="text-lani-green"/>Revenue Trend (YTD)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs><linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0b66c3" stopOpacity={0.2}/><stop offset="95%" stopColor="#0b66c3" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₦${v/1000}k`}/>
                    <Tooltip formatter={v => [`₦${Number(v).toLocaleString()}`,"Revenue"]}/>
                    <Area type="monotone" dataKey="Revenue" stroke="#0b66c3" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)"/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-lani-navy flex items-center gap-1.5 mb-6 uppercase tracking-wider"><BarChart2 size={16} className="text-lani-blue"/>Enrollments by Theme</h3>
              <div className="h-56">
                {enrollChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={enrollChart}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/><XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false}/><YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="Enrollments" fill="#087443" radius={[4,4,0,0]}/></BarChart>
                  </ResponsiveContainer>
                ) : <div className="h-full flex items-center justify-center text-xs text-slate-400">No data</div>}
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-lani-navy mb-4 uppercase tracking-wider">Lead Pipeline</h3>
              <div className="grid gap-2">
                {leadStageData.map(s => (
                  <div key={s.name} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 w-28">{s.name}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-lani-blue rounded-full transition-all" style={{width:`${leads.length>0?(s.count/leads.length)*100:0}%`}}/></div>
                    <span className="text-xs font-bold text-lani-navy w-6 text-right">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-lani-navy mb-4 uppercase tracking-wider">Courses by Thematic Area</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({name,value}) => `${name} (${value})`} fontSize={9}>
                    {pieData.map((_:any,i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie><Tooltip/></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-lani-navy mb-4 uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={16} className="text-lani-green"/>Revenue by Thematic Area</h3>
              {revenueAreaList.length > 0 ? (
                <div className="grid gap-3">
                  {revenueAreaList.map(([area, rev]) => (
                    <div key={area} className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-slate-500 w-40 truncate" title={area}>{area}</span>
                      <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-lani-green rounded-full transition-all" style={{width:`${maxAreaRevenue>0?(rev/maxAreaRevenue)*100:0}%`}}/></div>
                      <span className="text-xs font-bold text-lani-navy w-24 text-right">{formatMoney(rev)}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="py-10 text-center text-xs text-slate-400">No confirmed revenue yet.</div>}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-lani-navy mb-4 uppercase tracking-wider">Commercial KPIs</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Lead Conversion</span>
                  <strong className="block text-2xl font-extrabold text-lani-navy mt-1">{conversionRate}%</strong>
                  <span className="text-[10px] text-slate-400">{wonLeads} won / {leads.length} leads</span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Certificates Issued</span>
                  <strong className="block text-2xl font-extrabold text-lani-navy mt-1">{certificates.filter(c=>c.status==="Issued").length}</strong>
                  <span className="text-[10px] text-slate-400">of {certificates.length} total</span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Avg. Revenue / Learner</span>
                  <strong className="block text-2xl font-extrabold text-lani-navy mt-1">{formatMoney(enrollments.length? Math.round(totalRevenue/enrollments.length):0)}</strong>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Active Courses</span>
                  <strong className="block text-2xl font-extrabold text-lani-navy mt-1">{courses.filter(c=>c.status==="Open").length}</strong>
                  <span className="text-[10px] text-slate-400">of {courses.length} total</span>
                </div>
              </div>
              <button onClick={() => exportCsv("lani-leads.csv", leads.map(l => ({ organisation:l.organisation, contact:l.contactName, email:l.email, sector:l.sector, participants:l.participants, stage:l.stage, date:l.createdAt })))} className="btn-secondary mt-4 w-full justify-center text-xs"><Download size={13}/>Export Leads CSV</button>
            </div>
          </div>

          {/* Traffic & funnel */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-lani-navy mb-4 uppercase tracking-wider flex items-center gap-1.5"><Eye size={16} className="text-lani-blue"/>Most Viewed Courses</h3>
              {topViewed.length > 0 ? (
                <div className="grid gap-3">
                  {topViewed.map(([cid, n]) => {
                    const c = courses.find(x => x.id === cid);
                    return (
                      <div key={cid} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-500 w-44 truncate" title={c?.title || cid}>{c?.title || cid}</span>
                        <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-lani-blue rounded-full" style={{width:`${maxViews>0?(n/maxViews)*100:0}%`}}/></div>
                        <span className="text-xs font-bold text-lani-navy w-8 text-right">{n}</span>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="py-10 text-center text-xs text-slate-400">No course views recorded yet.</div>}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-bold text-lani-navy mb-4 uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={16} className="text-lani-green"/>Enrolment Funnel</h3>
              <div className="grid gap-3">
                {[
                  { label: "Course views", val: viewCount, pct: 100 },
                  { label: "Checkouts started", val: startCount, pct: viewCount > 0 ? (startCount / viewCount) * 100 : 0 },
                  { label: "Checkouts completed", val: completeCount, pct: viewCount > 0 ? (completeCount / viewCount) * 100 : 0 },
                ].map(step => (
                  <div key={step.label} className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-slate-500 w-36">{step.label}</span>
                    <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-lani-green rounded-full" style={{width:`${step.pct}%`}}/></div>
                    <span className="text-xs font-bold text-lani-navy w-8 text-right">{step.val}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Checkout conversion</span>
                  <strong className="block text-2xl font-extrabold text-lani-navy mt-1">{checkoutConversion}%</strong>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Abandoned checkouts</span>
                  <strong className="block text-2xl font-extrabold text-lani-coral mt-1">{abandoned}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COURSES */}
      {tab === "courses" && (
        <div>
          {editingCourse === null ? (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1 max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search courses..." className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2.5 text-sm"/></div>
                <button onClick={() => setEditingCourse("new")} className="btn-primary min-h-10 text-xs gap-1.5"><Plus size={14}/>Add New Course</button>
              </div>
              <div className="table-shell border border-slate-200">
                <table>
                  <thead><tr><th>Course</th><th>Facilitator</th><th>Curriculum</th><th>Price</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())||c.code.toLowerCase().includes(searchTerm.toLowerCase())).map(c => {
                      const lessons = (c.modules || []).reduce((n, m) => n + (m.lessons?.length || 0), 0);
                      const assigned = facilitatorAssignments.filter(a => a.courseId === c.id).map(a => a.facilitatorName);
                      const facilitatorLabel = assigned.length ? assigned.join(", ") : (c.facilitator && c.facilitator !== "TBD" ? c.facilitator : "—");
                      return (
                      <tr key={c.id}>
                        <td><strong>{c.title}</strong><span>{c.code} • {c.thematicArea}</span></td>
                        <td className="text-xs">{facilitatorLabel === "—" ? <span className="text-slate-400">Unassigned</span> : <span className="font-semibold text-lani-navy">{facilitatorLabel}</span>}</td>
                        <td className="text-xs">{(c.modules||[]).length} modules · {lessons} lessons</td>
                        <td className="font-bold text-lani-navy">{formatMoney(c.price)}</td>
                        <td><span className="text-xs font-bold">{c.enrolled}/{c.seats}</span></td>
                        <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${c.status==="Open"?"bg-lani-emerald/15 text-lani-green":c.status==="Archived"?"bg-slate-200 text-slate-500":"bg-slate-100 text-slate-500"}`}>{c.status}</span></td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setEditingCourse(c)} className="btn-secondary px-2 py-1 min-h-0 text-[10px] gap-1 h-6"><Edit size={12}/> Edit</button>
                            <button onClick={() => setAssigningCourse(c)} className="btn-secondary px-2 py-1 min-h-0 text-[10px] gap-1 h-6"><Users size={12}/> Assign</button>
                            {c.status !== "Archived" && (
                              <button onClick={() => onAddCourse({ ...c, status: "Archived" })} className="text-[10px] font-bold text-slate-400 hover:text-red-500 px-1">Archive</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <CourseEditor
              initial={editingCourse === "new" ? null : editingCourse}
              thematicAreas={courseThemes}
              facilitators={facilitators}
              onSave={onAddCourse}
              onAssign={onAssignFacilitator}
              onCancel={() => setEditingCourse(null)}
            />
          )}
        </div>
      )}

      {/* LEARNERS */}
      {tab === "learners" && (
        <div>
          <div className="mb-4 flex items-center">
            <span className="text-xs font-bold text-slate-500">{enrollments.length} enrolment{enrollments.length===1?"":"s"}</span>
            <button className="ml-auto btn-secondary min-h-9 px-3 text-xs gap-1" onClick={() => exportCsv("lani-learners.csv", enrollments.map(e => ({ learner:e.learnerName, email:e.learnerEmail, course:(courses.find(c=>c.id===e.courseId)?.title)||e.courseId, progress:`${e.progress}%`, payment:e.paymentStatus, sponsor:e.sponsorOrganisation||"", enrolled:e.enrolledAt })))}><Download size={13}/>Export CSV</button>
          </div>
          <div className="table-shell border border-slate-200">
          <table>
            <thead><tr><th>Learner</th><th>Course</th><th>Progress</th><th>Payment</th><th>Enrolled</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {enrollments.map(e => {
                const c = courses.find(x => x.id===e.courseId);
                return (
                  <tr key={e.id}>
                    <td><strong>{e.learnerName}</strong><span>{e.learnerEmail}</span></td>
                    <td className="text-xs font-semibold">{c?.title||e.courseId}</td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div className={`h-full rounded-full transition-all duration-500 ${e.progress>=100?"bg-lani-green":"bg-lani-blue"}`} style={{width:`${Math.max(e.progress,2)}%`}}/>
                        </div>
                        <span className="w-9 text-right text-xs font-bold tabular-nums text-slate-600">{e.progress}%</span>
                      </div>
                    </td>
                    <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${e.paymentStatus==="Successful"?"bg-lani-emerald/15 text-lani-green":"bg-amber-100 text-amber-700"}`}>{e.paymentStatus}</span></td>
                    <td className="text-xs">{formatDate(e.enrolledAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {enrollments.length===0&&<div className="py-16 text-center"><Users className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No Enrollments</h3></div>}
          </div>
        </div>
      )}

      {/* PAYMENTS */}
      {tab === "payments" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Total Revenue: <span className="text-lani-navy text-sm">{formatMoney(totalRevenue)}</span></span>
            <button className="ml-auto btn-secondary min-h-9 px-3 text-xs gap-1" onClick={() => exportCsv("lani-transactions.csv", transactions.map(t => ({ receipt:t.receiptNumber, learner:t.learnerEmail, amount:t.amount, gateway:t.gateway, status:t.status, date:t.createdAt, depositor: t.depositorName || "", bank: t.sourceBank || "", ref: t.transferReference || "" })))}><Download size={13}/>Export CSV</button>
          </div>
          <div className="table-shell border border-slate-200">
            <table>
              <thead><tr><th>Receipt</th><th>Learner</th><th>Amount</th><th>Gateway</th><th>Transfer Proof</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.receiptNumber}</strong><span>{t.id}</span></td>
                    <td className="text-xs">{t.learnerEmail}</td>
                    <td className="font-bold text-lani-navy">{formatMoney(t.amount)}</td>
                    <td className="text-xs">{t.gateway}</td>
                    <td className="text-xs">
                      {t.gateway === "Bank Transfer" ? (
                        <div className="space-y-1 py-1">
                          {t.depositorName && <div><span className="text-slate-400">Depositor:</span> <strong>{t.depositorName}</strong></div>}
                          {t.sourceBank && <div><span className="text-slate-400">Bank:</span> <span>{t.sourceBank}</span></div>}
                          {t.transferReference && <div><span className="text-slate-400">Ref:</span> <code className="font-mono text-[11px]">{t.transferReference}</code></div>}
                          {t.receiptUrl ? (
                            <a href={t.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold text-lani-green hover:underline text-[11px]">
                              <ExternalLink size={12} /> View Receipt
                            </a>
                          ) : (
                            !t.depositorName && !t.sourceBank && <span className="text-slate-400 italic">No details submitted</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status==="Successful"||t.status==="Manually Confirmed"?"bg-lani-emerald/15 text-lani-green":t.status==="Pending"?"bg-amber-100 text-amber-700":"bg-red-50 text-red-600"}`}>{t.status}</span></td>
                    <td className="text-xs">{formatDate(t.createdAt)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {t.gateway === "Bank Transfer" && (
                          <button onClick={() => setProofModalTxn(t)} className="text-xs font-bold text-lani-blue hover:underline flex items-center gap-1">
                            <Eye size={12} /> Inspect Proof
                          </button>
                        )}
                        {t.status === "Pending" && (
                          <>
                            <button onClick={() => onUpdatePaymentStatus(t.id, "Manually Confirmed")} className="text-xs font-bold text-lani-green hover:underline flex items-center gap-1">
                              <CheckCircle size={12} /> Confirm
                            </button>
                            <button onClick={() => onUpdatePaymentStatus(t.id, "Failed")} className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1">
                              <XCircle size={12} /> Deny
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* LEADS */}
      {tab === "leads" && (
        <div className="table-shell border border-slate-200">
          {leads.length > 0 ? (
            <table>
              <thead><tr><th>Organisation</th><th>Contact</th><th>Theme</th><th>Date</th><th>Stage</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map(l => (
                  <tr key={l.id}>
                    <td><strong>{l.organisation}</strong><span>{l.sector} ({l.participants} staff)</span></td>
                    <td><strong>{l.contactName}</strong><span>{l.email}</span></td>
                    <td className="text-xs">{l.thematicArea} ({l.deliveryMode})</td>
                    <td className="text-xs">{formatDate(l.preferredDate)}</td>
                    <td><select value={l.stage} onChange={e => onUpdateLeadStage(l.id, e.target.value as any)} className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold">
                      {["New","Contacted","Proposal Sent","Negotiation","Won","Lost"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="py-16 text-center"><Shield className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No Leads</h3></div>}
        </div>
      )}

      {/* APPLICATIONS */}
      {tab === "applications" && (
        <div>
          {applications.length > 0 && (
            <div className="mb-4 flex items-center">
              <span className="text-xs font-bold text-slate-500">{applications.length} application{applications.length===1?"":"s"}</span>
              <button className="ml-auto btn-secondary min-h-9 px-3 text-xs gap-1" onClick={() => exportCsv("lani-applications.csv", applications.map(a => ({ applicant:a.applicantName, email:a.email, phone:a.phone, location:a.location, organisation:a.organisation, programme:a.programmeType, status:a.status, score:a.score, submitted:a.createdAt })))}><Download size={13}/>Export CSV</button>
            </div>
          )}
          <div className="table-shell border border-slate-200">
          {applications.length > 0 ? (
            <table>
              <thead><tr><th>Applicant</th><th>Programme</th><th>Docs</th><th>Status</th><th>Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.applicantName}</strong><span>{a.email} • {a.location}</span></td>
                    <td className="text-xs">{a.programmeType}</td>
                    <td className="text-xs">
                      {(a.attachments && a.attachments.length > 0) ? (
                        <div className="flex flex-col gap-0.5">
                          {a.attachments.map((f, i) => (
                            <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-lani-blue hover:underline"><Eye size={11}/>{f.name.length > 18 ? f.name.slice(0, 16) + "…" : f.name}</a>
                          ))}
                        </div>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td><select value={a.status} onChange={e => onUpdateAppStatus(a.id, e.target.value as any)} className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold">
                      {["Submitted","Under Review","Shortlisted","Accepted","Waitlisted","Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select></td>
                    <td><button onClick={() => setEnrollingApp(a)} className="btn-secondary px-2 py-1 min-h-0 text-[10px] gap-1 h-6"><Plus size={12}/>Enrol</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="py-16 text-center"><ClipboardCheck className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No Applications</h3></div>}
          </div>
        </div>
      )}

      {/* CERTIFICATES */}
      {tab === "certificates" && (
        <div className="table-shell border border-slate-200">
          {certificates.length > 0 ? (
            <table>
              <thead><tr><th>Certificate ID</th><th>Learner</th><th>Course</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.id}</strong><span>{formatDate(c.issueDate)}</span></td>
                    <td><strong>{c.learnerName}</strong><span>{c.learnerEmail}</span></td>
                    <td className="text-xs font-semibold">{c.courseTitle}</td>
                    <td className="text-xs">{c.type || "Completion"}</td>
                    <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${c.status==="Issued"?"bg-lani-emerald/15 text-lani-green":"bg-red-50 text-red-600"}`}>{c.status}</span></td>
                    <td>
                      {c.status === "Issued"
                        ? <button onClick={() => onUpdateCertificateStatus(c, "Revoked")} className="text-xs font-bold text-red-500 hover:underline">Revoke</button>
                        : <button onClick={() => onUpdateCertificateStatus(c, "Issued")} className="text-xs font-bold text-lani-green hover:underline">Reissue</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="py-16 text-center"><Award className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No Certificates</h3></div>}
        </div>
      )}

      {/* CMS */}
      {tab === "cms" && (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <form className="form-panel border border-slate-200" onSubmit={handleSubmitAsset}>
            <div><span className="eyebrow">Creative Asset</span><h2 className="mt-3 text-lg font-bold text-lani-navy">Upload Asset</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="form-field">Name<input name="assetName" required placeholder="e.g. Q3 Brochure"/></label>
              <label className="form-field">Type<select name="assetType"><option value="Banner">Banner</option><option value="Flyer">Flyer</option><option value="Brochure">Brochure</option><option value="Video">Video</option><option value="Testimonial">Testimonial</option></select></label>
              <label className="form-field">Placement<input name="placement" required placeholder="e.g. Homepage Hero"/></label>
              <label className="form-field">Owner<input name="owner" defaultValue="Content Manager"/></label>
              <label className="form-field">Status<select name="status"><option value="Draft">Draft</option><option value="Scheduled">Scheduled</option><option value="Published">Published</option></select></label>
              <label className="form-field">Upload File<input name="assetFile" type="file" accept="image/*,application/pdf,video/*,.ppt,.pptx,.doc,.docx"/></label>
            </div>
            <button type="submit" disabled={addingAsset} className="btn-primary w-full justify-center text-xs"><Upload size={14}/>{addingAsset?"Uploading...":"Register Asset"}</button>
          </form>
          <div className="table-shell border border-slate-200">
            {assets.length > 0 ? (
              <table>
                <thead><tr><th>Asset</th><th>Placement</th><th>File</th><th>Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map(a => (
                    <tr key={a.id}>
                      <td><strong>{a.name}</strong><span>{a.type} ({a.owner})</span></td>
                      <td>{a.placement}</td>
                      <td>{a.url ? <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-lani-blue hover:underline inline-flex items-center gap-1"><Eye size={12}/>View</a> : <span className="text-[10px] text-slate-400">—</span>}</td>
                      <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${a.status==="Published"?"bg-lani-emerald/15 text-lani-green":"bg-slate-100 text-slate-500"}`}>{a.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="py-16 text-center"><FileText className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No Assets</h3></div>}
          </div>
        </div>
      )}

      {/* SESSIONS */}
      {tab === "sessions" && (
        <SessionScheduler courses={courses.filter(c => c.status !== "Archived")} events={calendarEvents} enrollments={enrollments} attendance={attendance} onSave={onSaveEvent} onDelete={onDeleteEvent} onSaveAttendance={onSaveAttendance} />
      )}

      {/* PATHWAYS */}
      {tab === "pathways" && (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form className="form-panel border border-slate-200" onSubmit={handleSavePathwaySubmit}>
            <div><span className="eyebrow">Bundle</span><h2 className="mt-3 text-lg font-bold text-lani-navy">Create Learning Pathway</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="form-field sm:col-span-2">Title<input name="ptitle" required placeholder="e.g. Digital Transformation Officer"/></label>
              <label className="form-field sm:col-span-2">Description<textarea name="pdesc" rows={2} placeholder="What this pathway leads to"/></label>
              <label className="form-field sm:col-span-2">Cover image
                <input name="pcover" type="file" accept="image/*" onChange={onPathwayCoverChange}/>
                <span className="mt-1 block text-[10px] text-slate-400">Select an image to upload, or paste a URL below.</span>
              </label>
              {pathwayCoverPreview && (
                <div className="sm:col-span-2">
                  <img src={pathwayCoverPreview} alt="Cover preview" className="h-32 w-full rounded-lg object-cover border border-slate-200"/>
                </div>
              )}
              <label className="form-field">Cover image URL (optional)<input name="pimage" placeholder="https://..."/></label>
              <label className="form-field">Bundle price (NGN, 0 = sum)<input name="pprice" type="number" min={0} defaultValue={0}/></label>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Courses in this pathway ({pathwayCourses.length})</span>
              <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {courses.filter(c => c.status !== "Archived").map(c => (
                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={pathwayCourses.includes(c.id)} onChange={() => togglePathwayCourse(c.id)} className="h-4 w-4 accent-lani-green"/>
                    <span className="truncate text-lani-navy">{c.title}</span>
                  </label>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-lani-navy"><input name="ppublished" type="checkbox" defaultChecked className="h-4 w-4 accent-lani-green"/> Published</label>
            <button type="submit" disabled={savingPathway} className="btn-primary w-full justify-center text-xs"><Route size={14}/>{savingPathway ? "Saving..." : "Save Pathway"}</button>
          </form>
          <div className="table-shell border border-slate-200">
            {pathways.length > 0 ? (
              <table>
                <thead><tr><th>Pathway</th><th>Courses</th><th>Price</th><th>Status</th><th></th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {pathways.map(p => (
                    <tr key={p.id}>
                      <td><strong>{p.title}</strong><span className="line-clamp-1">{p.description}</span></td>
                      <td className="text-xs">{p.courseIds.length}</td>
                      <td className="font-bold text-lani-navy">{p.price > 0 ? formatMoney(p.price) : "Sum"}</td>
                      <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${p.published?"bg-lani-emerald/15 text-lani-green":"bg-slate-100 text-slate-500"}`}>{p.published?"Published":"Draft"}</span></td>
                      <td><button onClick={() => onDeletePathway(p.id)} className="text-red-500 hover:text-red-600"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="py-16 text-center"><Route className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No pathways yet</h3></div>}
          </div>
        </div>
      )}

      {/* CONTENT */}
      {tab === "content" && (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form className="form-panel border border-slate-200" onSubmit={handleSaveContentSubmit}>
            <div><span className="eyebrow">Publish</span><h2 className="mt-3 text-lg font-bold text-lani-navy">Add Article or Resource</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="form-field">Type
                <select name="type" defaultValue="Article">
                  <option value="Article">Article</option>
                  <option value="Guide">Guide (download)</option>
                  <option value="Brochure">Brochure (download)</option>
                  <option value="Flyer">Flyer (download)</option>
                </select>
              </label>
              <label className="form-field">Category<input name="category" placeholder="e.g. Human Capital"/></label>
              <label className="form-field sm:col-span-2">Title<input name="title" required placeholder="Article or resource title"/></label>
              <label className="form-field sm:col-span-2">Excerpt / summary<input name="excerpt" placeholder="One-line summary"/></label>
              <label className="form-field sm:col-span-2">Body (articles only)<textarea name="body" rows={5} placeholder="Full article text. Line breaks are preserved."/></label>
              <label className="form-field">Cover image<input name="cover" type="file" accept="image/*"/></label>
              <label className="form-field">Downloadable file<input name="file" type="file" accept="application/pdf,.doc,.docx,.ppt,.pptx"/></label>
              <label className="form-field">Author<input name="author" defaultValue="LANI Academy"/></label>
              <label className="form-field flex-row items-center gap-2 mt-6"><input name="published" type="checkbox" defaultChecked className="h-4 w-4 accent-lani-green"/> Published</label>
            </div>
            <button type="submit" disabled={savingContent} className="btn-primary w-full justify-center text-xs"><Upload size={14}/>{savingContent ? "Saving..." : "Publish Content"}</button>
          </form>
          <div className="table-shell border border-slate-200">
            {content.length > 0 ? (
              <table>
                <thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {content.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.title}</strong><span>{c.category} • {c.author}</span></td>
                      <td className="text-xs">{c.type}</td>
                      <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${c.published?"bg-lani-emerald/15 text-lani-green":"bg-slate-100 text-slate-500"}`}>{c.published?"Published":"Draft"}</span></td>
                      <td className="flex items-center gap-2">
                        {c.fileUrl && <a href={c.fileUrl} target="_blank" rel="noopener noreferrer" className="text-lani-blue hover:underline"><Eye size={14}/></a>}
                        <button onClick={() => onDeleteContent(c.id)} className="text-red-500 hover:text-red-600"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="py-16 text-center"><Edit className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No content yet</h3></div>}
          </div>
        </div>
      )}

      {/* PROMOS */}
      {tab === "promos" && (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <form className="form-panel border border-slate-200" onSubmit={handleSavePromoSubmit}>
            <div><span className="eyebrow">Discount</span><h2 className="mt-3 text-lg font-bold text-lani-navy">Create Promo Code</h2></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="form-field">Code<input name="code" required placeholder="e.g. LAUNCH20" className="uppercase"/></label>
              <label className="form-field">Discount (%)<input name="discount" type="number" min={1} max={100} required defaultValue={10}/></label>
              <label className="form-field sm:col-span-2">Description<input name="pdesc" placeholder="e.g. Launch offer"/></label>
              <label className="form-field">Expires (optional)<input name="expires" type="date"/></label>
              <label className="form-field">Max uses (0 = ∞)<input name="maxUses" type="number" min={0} defaultValue={0}/></label>
            </div>
            <button type="submit" className="btn-primary w-full justify-center text-xs"><Tag size={14}/>Save Promo Code</button>
          </form>
          <div className="table-shell border border-slate-200">
            {promos.length > 0 ? (
              <table>
                <thead><tr><th>Code</th><th>Discount</th><th>Uses</th><th>Expires</th><th>Status</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {promos.map(p => (
                    <tr key={p.code}>
                      <td><strong className="font-mono">{p.code}</strong><span>{p.description}</span></td>
                      <td className="font-bold text-lani-navy">{p.discountPercent}%</td>
                      <td className="text-xs">{p.uses}{p.maxUses ? ` / ${p.maxUses}` : ""}</td>
                      <td className="text-xs">{p.expiresAt ? formatDate(p.expiresAt) : "—"}</td>
                      <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${p.active?"bg-lani-emerald/15 text-lani-green":"bg-slate-100 text-slate-500"}`}>{p.active?"Active":"Inactive"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="py-16 text-center"><Tag className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No promo codes</h3></div>}
          </div>
        </div>
      )}

      {/* BROADCAST */}
      {tab === "broadcast" && (
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-xl border border-slate-200 p-5 space-y-3 self-start">
            <h3 className="text-sm font-bold text-lani-navy flex items-center gap-2"><Send size={15} className="text-lani-blue"/>Audience</h3>
            {[
              { key: "learners", label: "All learners", count: new Set(enrollments.map(e => e.learnerEmail)).size },
              { key: "course", label: "Learners of a course", count: null },
              { key: "courses", label: "Learners of selected courses", count: null },
              { key: "participants", label: "Selected participants", count: null },
              { key: "leads", label: "Corporate leads", count: leads.length },
              { key: "subscribers", label: "Newsletter subscribers", count: subscribers.length },
              { key: "custom", label: "Custom email list", count: null },
            ].map(a => (
              <label key={a.key} className={`flex items-center justify-between rounded-lg border p-3 text-sm cursor-pointer transition-all ${bcAudience === a.key ? "border-lani-blue bg-lani-blue/5" : "border-slate-200 hover:bg-slate-50"}`}>
                <span className="flex items-center gap-2 font-semibold text-lani-navy">
                  <input type="radio" name="bcAudience" checked={bcAudience === a.key} onChange={() => setBcAudience(a.key)} className="accent-lani-blue"/>
                  {a.label}
                </span>
                {a.count !== null && <span className="text-[10px] font-bold text-slate-400">{a.count}</span>}
              </label>
            ))}
            {bcAudience === "course" && (
              <select value={bcCourse} onChange={e => setBcCourse(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="">Select a course...</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}
            {bcAudience === "courses" && (
              <div className="max-h-44 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {courses.map(c => (
                  <label key={c.id} className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={bcCourseIds.includes(c.id)} onChange={() => toggleBcCourse(c.id)} className="h-4 w-4 accent-lani-blue"/>
                    <span className="truncate text-lani-navy">{c.title}</span>
                  </label>
                ))}
              </div>
            )}
            {bcAudience === "participants" && (
              <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100">
                {participants.length === 0 && <p className="px-3 py-3 text-xs text-slate-400">No participants yet.</p>}
                {participants.map(p => (
                  <label key={p.learnerEmail} className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={bcSelected.includes(p.learnerEmail)} onChange={() => toggleBcSelected(p.learnerEmail)} className="h-4 w-4 accent-lani-blue"/>
                    <span className="min-w-0"><span className="block truncate font-semibold text-lani-navy">{p.learnerName}</span><span className="block truncate text-slate-400">{p.learnerEmail}</span></span>
                  </label>
                ))}
              </div>
            )}
            {bcAudience === "custom" && (
              <textarea value={bcCustom} onChange={e => setBcCustom(e.target.value)} rows={4} placeholder="Emails separated by comma or new line" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"/>
            )}
          </div>

          <form onSubmit={handleSendBroadcast} className="form-panel border border-slate-200">
            <div><span className="eyebrow">Compose</span><h2 className="mt-3 text-lg font-bold text-lani-navy">Broadcast Message</h2></div>
            <label className="form-field">Subject<input value={bcSubject} onChange={e => setBcSubject(e.target.value)} required placeholder="e.g. New cohort now open"/></label>
            <label className="form-field">Message<textarea value={bcMessage} onChange={e => setBcMessage(e.target.value)} required rows={8} placeholder="Write your message. Line breaks are preserved."/></label>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <span className="text-xs font-semibold text-slate-500">Recipients: <strong className="text-lani-navy">{bcCount}</strong></span>
              <button type="submit" disabled={bcBusy || bcCount === 0} className="btn-primary text-xs px-6 disabled:opacity-50">
                <Send size={14}/>{bcBusy ? "Sending..." : `Send to ${bcCount}`}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">Emails are delivered via the send-email function (Resend). Until it's connected, this records intent without sending.</p>
          </form>
        </div>
      )}

      {/* AUDIT LOG */}
      {tab === "audit" && (
        <div>
          <div className="mb-4 flex items-center">
            <span className="text-xs font-bold text-slate-500">{auditLogs.length} recorded action{auditLogs.length===1?"":"s"}</span>
            <button className="ml-auto btn-secondary min-h-9 px-3 text-xs gap-1" onClick={() => exportCsv("lani-audit-log.csv", auditLogs.map(a => ({ when:a.createdAt, actor:a.actorEmail||"", role:a.actorRole||"", action:a.action, target_type:a.targetType||"", target_id:a.targetId||"", detail:a.detail })))}><Download size={13}/>Export CSV</button>
          </div>
          <div className="table-shell border border-slate-200">
            {auditLogs.length > 0 ? (
              <table>
                <thead><tr><th>When</th><th>Actor</th><th>Action</th><th>Target</th><th>Detail</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map(a => (
                    <tr key={a.id}>
                      <td className="text-xs whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</td>
                      <td><strong>{a.actorEmail||"System"}</strong><span>{a.actorRole||""}</span></td>
                      <td><span className="inline-flex rounded-full bg-lani-blue/10 px-2 py-0.5 text-[10px] font-bold text-lani-blue">{a.action}</span></td>
                      <td className="text-xs">{a.targetType ? `${a.targetType}${a.targetId?` · ${a.targetId}`:""}` : "—"}</td>
                      <td className="text-xs text-slate-600 max-w-[280px] truncate" title={a.detail}>{a.detail || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="py-16 text-center"><ClipboardCheck className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No audit entries yet</h3><p className="mt-1 text-xs text-slate-400">Role changes, course archives, certificate revocations and broadcasts will appear here.</p></div>}
          </div>
        </div>
      )}

      {/* Enrol Applicant Modal */}
      {enrollingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative">
            <button onClick={() => { setEnrollingApp(null); setEnrolCourseId(""); }} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><XCircle size={20}/></button>
            <h3 className="text-lg font-bold text-lani-navy">Enrol applicant</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">Convert <strong>{enrollingApp.applicantName}</strong> into an enrolled learner.</p>
            <label className="form-field">Select course
              <select value={enrolCourseId} onChange={e => setEnrolCourseId(e.target.value)} required className="mt-1">
                <option value="">-- Choose a course --</option>
                {courses.filter(c => c.status !== "Archived").map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </label>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <button onClick={() => { setEnrollingApp(null); setEnrolCourseId(""); }} className="btn-secondary text-xs px-4">Cancel</button>
              <button
                onClick={async () => { if (!enrolCourseId) { toast.error("Choose a course."); return; } await onConvertApplicant(enrollingApp, enrolCourseId); setEnrollingApp(null); setEnrolCourseId(""); }}
                className="btn-primary text-xs px-6"
              >Enrol learner</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Facilitator Modal Overlay */}
      {assigningCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setAssigningCourse(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"><XCircle size={20}/></button>
            <h3 className="text-lg font-bold text-lani-navy">Assign Facilitator</h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">Assigning to <strong>{assigningCourse.title}</strong></p>

            <form onSubmit={handleAssignSubmit} className="grid gap-4">
              <label className="form-field">
                Select Facilitator
                <select name="facilitator" required className="w-full rounded border border-slate-200 px-3 py-2 text-sm mt-1">
                  <option value="" disabled selected>-- Choose a facilitator --</option>
                  {facilitators.map(f => (
                    <option key={f.email} value={f.email}>{f.fullName} ({f.email})</option>
                  ))}
                </select>
              </label>

              <div className="flex justify-end gap-2 mt-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setAssigningCourse(null)} className="btn-secondary text-xs px-4">Cancel</button>
                <button type="submit" disabled={isAssigning} className="btn-primary text-xs px-6">
                  {isAssigning ? "Assigning..." : "Assign"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Bank Transfer Proof Inspector Modal */}
      {proofModalTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-lani-navy/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setProofModalTxn(null)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
              <XCircle size={20} />
            </button>
            <h3 className="text-lg font-bold text-lani-navy">Bank Transfer Proof</h3>
            <p className="text-xs text-slate-500 mt-0.5 mb-4">Receipt #{proofModalTxn.receiptNumber} — {formatDate(proofModalTxn.createdAt)}</p>

            <div className="grid gap-3 text-xs text-slate-700 rounded-xl bg-slate-50 p-4 border border-slate-200">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Learner Email:</span>
                <strong className="text-lani-navy font-mono">{proofModalTxn.learnerEmail}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Course ID:</span>
                <strong className="text-lani-navy">{proofModalTxn.courseId}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Amount Paid:</span>
                <strong className="text-lani-green text-sm font-extrabold">{formatMoney(proofModalTxn.amount)}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Depositor Name:</span>
                <strong className="text-lani-navy">{proofModalTxn.depositorName || "—"}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Source Bank:</span>
                <strong className="text-lani-navy">{proofModalTxn.sourceBank || "—"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transfer Ref / Session ID:</span>
                <code className="font-mono text-lani-navy">{proofModalTxn.transferReference || "—"}</code>
              </div>
            </div>

            {/* Receipt Upload Preview / Link */}
            <div className="mt-4">
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Uploaded Receipt</span>
              {proofModalTxn.receiptUrl ? (
                <div className="space-y-3">
                  {proofModalTxn.receiptUrl.match(/\.(jpeg|jpg|png|webp|gif)(\?.*)?$/i) ? (
                    <img src={proofModalTxn.receiptUrl} alt="Payment Receipt" className="w-full max-h-64 rounded-xl border border-slate-200 object-contain bg-slate-150" />
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <FileText size={32} className="mx-auto text-lani-blue mb-1" />
                      <span className="text-xs text-slate-600 font-semibold block">Document / PDF Receipt</span>
                    </div>
                  )}
                  <a href={proofModalTxn.receiptUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary w-full justify-center text-xs gap-1.5">
                    <ExternalLink size={14} /> Open Full Receipt in New Tab
                  </a>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 italic">
                  No receipt image/file was attached by the learner.
                </div>
              )}
            </div>

            {/* Actions inside modal */}
            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500">Status: <span className="font-bold text-lani-navy">{proofModalTxn.status}</span></span>
              <div className="flex gap-2">
                {proofModalTxn.status === "Pending" && (
                  <>
                    <button
                      onClick={() => {
                        onUpdatePaymentStatus(proofModalTxn.id, "Failed");
                        setProofModalTxn(null);
                      }}
                      className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100"
                    >
                      Deny Transfer
                    </button>
                    <button
                      onClick={() => {
                        onUpdatePaymentStatus(proofModalTxn.id, "Manually Confirmed");
                        setProofModalTxn(null);
                      }}
                      className="btn-primary text-xs px-5"
                    >
                      Confirm & Approve Enrolment
                    </button>
                  </>
                )}
                {proofModalTxn.status !== "Pending" && (
                  <button onClick={() => setProofModalTxn(null)} className="btn-secondary text-xs px-4">
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
