import React, { useState } from "react";
import { Shield, Users, Award, DollarSign, TrendingUp, FileText, Upload, RefreshCw, BarChart2, BookOpen, CreditCard, ClipboardCheck, Megaphone, Settings, Download, Search, Edit, Trash2, CheckCircle, XCircle, Eye, Plus, ArrowLeft, Save } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import type { Course, Enrollment, Transaction, Certificate, CorporateLead, ProgrammeApplication, CmsAsset, FacilitatorAssignment } from "../lib/types";
import { formatMoney, formatDate } from "../lib/utils";
import { seedDatabase, dbUploadFile } from "../lib/db";
import toast from "react-hot-toast";

type Tab = "overview"|"courses"|"learners"|"payments"|"leads"|"applications"|"certificates"|"cms";

interface Props {
  courses: Course[];
  enrollments: Enrollment[];
  transactions: Transaction[];
  certificates: Certificate[];
  leads: CorporateLead[];
  applications: ProgrammeApplication[];
  assets: CmsAsset[];
  facilitators: {fullName: string, email: string}[];
  onUpdateLeadStage: (id: string, stage: CorporateLead["stage"]) => Promise<void>;
  onUpdateAppStatus: (id: string, status: ProgrammeApplication["status"]) => Promise<void>;
  onAddAsset: (d: any) => Promise<void>;
  onAddCourse: (course: Partial<Course>) => Promise<void>;
  onAssignFacilitator: (assignment: FacilitatorAssignment) => Promise<void>;
  onRefreshData: () => Promise<void>;
  onUpdatePaymentStatus: (id: string, status: Transaction["status"]) => void;
}

const COLORS = ["#087443","#0b66c3","#c9972b","#d95845","#10a768","#6366f1","#ec4899","#14b8a6"];

export default function AdminDashboard({ courses, enrollments, transactions, certificates, leads, applications, assets, facilitators, onUpdateLeadStage, onUpdateAppStatus, onAddAsset, onAddCourse, onAssignFacilitator, onRefreshData, onUpdatePaymentStatus }: Props) {
  const [tab, setTab] = useState<Tab>("overview");
  const [seeding, setSeeding] = useState(false);
  const [addingAsset, setAddingAsset] = useState(false);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [addingCourseObj, setAddingCourseObj] = useState(false);
  const [assigningCourse, setAssigningCourse] = useState<Course | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const totalRevenue = transactions.filter(t => t.status==="Successful"||t.status==="Manually Confirmed").reduce((s,t) => s+Number(t.amount), 0);
  const avgCompletion = enrollments.length > 0 ? Math.round(enrollments.reduce((s,e) => s+e.progress, 0)/enrollments.length) : 0;
  const pendingPayments = transactions.filter(t => t.status === "Pending").length;

  const chartData = [{name:"Jan",Revenue:150000},{name:"Feb",Revenue:320000},{name:"Mar",Revenue:210000},{name:"Apr",Revenue:450000},{name:"May",Revenue:620000},{name:"Jun",Revenue:totalRevenue>0?totalRevenue:350000}];

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
  ];

  return (
    <div className="section bg-white text-left min-h-[50rem]">
      {/* Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-lani-blue to-slate-900 p-8 text-white relative overflow-hidden shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]"/>
        <div className="relative z-10 space-y-2">
          <span className="eyebrow border-white/20 bg-white/5 text-white/90">Administrative Operations</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-300 max-w-md">Manage courses, learners, payments, leads, applications, certificates and CMS assets.</p>
        </div>
        <div className="relative z-10 flex gap-2">
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
        </div>
      )}

      {/* COURSES */}
      {tab === "courses" && (
        <div>
          {!isAddingCourse ? (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div className="relative flex-1 max-w-sm"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search courses..." className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2.5 text-sm"/></div>
                <button onClick={() => setIsAddingCourse(true)} className="btn-primary min-h-10 text-xs gap-1.5"><Plus size={14}/>Add New Course</button>
              </div>
              <div className="table-shell border border-slate-200">
                <table>
                  <thead><tr><th>Course</th><th>Category</th><th>Price</th><th>Enrolled</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())||c.code.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.title}</strong><span>{c.code} • {c.thematicArea}</span></td>
                        <td className="text-xs">{c.level}</td>
                        <td className="font-bold text-lani-navy">{formatMoney(c.price)}</td>
                        <td><span className="text-xs font-bold">{c.enrolled}/{c.seats}</span></td>
                        <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${c.status==="Open"?"bg-lani-emerald/15 text-lani-green":"bg-slate-100 text-slate-500"}`}>{c.status}</span></td>
                        <td>
                          <button onClick={() => setAssigningCourse(c)} className="btn-secondary px-2 py-1 min-h-0 text-[10px] gap-1 h-6">
                            <Users size={12}/> Assign Facilitator
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-3xl">
              <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                <button onClick={() => setIsAddingCourse(false)} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"><ArrowLeft size={16}/></button>
                <div>
                  <h2 className="text-lg font-bold text-lani-navy">Create New Course</h2>
                  <p className="text-xs text-slate-500">Fill in the details to publish a new course to the catalog.</p>
                </div>
              </div>
              
              <form onSubmit={handleAddCourseSubmit} className="grid gap-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="form-field">Course Title<input name="title" required placeholder="e.g. Advanced Leadership Skills"/></label>
                  <label className="form-field">Course Code<input name="code" required placeholder="e.g. LDR-301"/></label>
                </div>
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <label className="form-field">Category
                    <select name="category" required>
                      <option value="Leadership">Leadership</option>
                      <option value="Technology">Technology</option>
                      <option value="Business">Business</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </label>
                  <label className="form-field">Thematic Area<input name="thematicArea" required placeholder="e.g. Executive Management"/></label>
                  <label className="form-field">Level
                    <select name="level" required>
                      <option value="Foundation">Foundation</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Executive">Executive</option>
                    </select>
                  </label>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <label className="form-field">Course Type
                    <select name="type" required>
                      <option value="Open Programme">Open Programme</option>
                      <option value="Certification Prep">Certification Prep</option>
                      <option value="Bootcamp">Bootcamp</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </label>
                  <label className="form-field">Status
                    <select name="status" required>
                      <option value="Open">Open</option>
                      <option value="Coming Soon">Coming Soon</option>
                      <option value="Sold Out">Sold Out</option>
                    </select>
                  </label>
                  <label className="form-field">Price (NGN)<input name="price" type="number" required placeholder="e.g. 150000" min="0"/></label>
                </div>

                <div className="grid sm:grid-cols-4 gap-4">
                  <label className="form-field col-span-2">Duration<input name="duration" required placeholder="e.g. 4 Weeks"/></label>
                  <label className="form-field">Start Date<input name="startDate" type="date" required/></label>
                  <label className="form-field">End Date<input name="endDate" type="date" required/></label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="form-field">Total Seats<input name="seats" type="number" required defaultValue="50" min="1"/></label>
                  <label className="form-field">Cover Image URL<input name="image" placeholder="https://..."/></label>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <label className="form-field">Intro / Lesson Video URL<input name="videoUrl" placeholder="YouTube, Vimeo, or direct .mp4 link"/></label>
                  <label className="form-field">Course Materials (files)<input name="materialFiles" type="file" multiple accept="image/*,application/pdf,video/*,.ppt,.pptx,.doc,.docx,.xls,.xlsx"/></label>
                </div>

                <label className="form-field">Short Description
                  <textarea name="shortDescription" required rows={2} placeholder="A brief summary of what this course offers..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-lani-green focus:outline-none focus:ring-1 focus:ring-lani-green resize-y"></textarea>
                </label>

                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                  <button type="button" onClick={() => setIsAddingCourse(false)} className="btn-secondary text-xs">Cancel</button>
                  <button type="submit" disabled={addingCourseObj} className="btn-primary min-h-10 text-xs px-6 gap-2">
                    {addingCourseObj ? "Saving..." : <><Save size={14}/> Publish Course</>}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* LEARNERS */}
      {tab === "learners" && (
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
                    <td><div className="flex items-center gap-2"><div className="progress-bar !h-2 w-20"><span style={{width:`${e.progress}%`}}/></div><span className="text-xs font-bold">{e.progress}%</span></div></td>
                    <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${e.paymentStatus==="Successful"?"bg-lani-emerald/15 text-lani-green":"bg-amber-100 text-amber-700"}`}>{e.paymentStatus}</span></td>
                    <td className="text-xs">{formatDate(e.enrolledAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {enrollments.length===0&&<div className="py-16 text-center"><Users className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No Enrollments</h3></div>}
        </div>
      )}

      {/* PAYMENTS */}
      {tab === "payments" && (
        <div>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">Total Revenue: <span className="text-lani-navy text-sm">{formatMoney(totalRevenue)}</span></span>
            <button className="ml-auto btn-secondary min-h-9 px-3 text-xs gap-1" onClick={() => exportCsv("lani-transactions.csv", transactions.map(t => ({ receipt:t.receiptNumber, learner:t.learnerEmail, amount:t.amount, gateway:t.gateway, status:t.status, date:t.createdAt })))}><Download size={13}/>Export CSV</button>
          </div>
          <div className="table-shell border border-slate-200">
            <table>
              <thead><tr><th>Receipt</th><th>Learner</th><th>Amount</th><th>Gateway</th><th>Status</th><th>Date</th><th>Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(t => (
                  <tr key={t.id}>
                    <td><strong>{t.receiptNumber}</strong><span>{t.id}</span></td>
                    <td className="text-xs">{t.learnerEmail}</td>
                    <td className="font-bold text-lani-navy">{formatMoney(t.amount)}</td>
                    <td className="text-xs">{t.gateway}</td>
                    <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${t.status==="Successful"||t.status==="Manually Confirmed"?"bg-lani-emerald/15 text-lani-green":t.status==="Pending"?"bg-amber-100 text-amber-700":"bg-red-50 text-red-600"}`}>{t.status}</span></td>
                    <td className="text-xs">{formatDate(t.createdAt)}</td>
                    <td>{t.status==="Pending"&&<button onClick={() => onUpdatePaymentStatus(t.id,"Manually Confirmed")} className="text-xs font-bold text-lani-green hover:underline flex items-center gap-1"><CheckCircle size={12}/>Confirm</button>}</td>
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
        <div className="table-shell border border-slate-200">
          {applications.length > 0 ? (
            <table>
              <thead><tr><th>Applicant</th><th>Programme</th><th>Location</th><th>Score</th><th>Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.applicantName}</strong><span>{a.email}</span></td>
                    <td className="text-xs">{a.programmeType}</td>
                    <td className="text-xs">{a.location} ({a.organisation||"N/A"})</td>
                    <td><span className="text-sm font-bold text-lani-navy">{a.score}</span></td>
                    <td><select value={a.status} onChange={e => onUpdateAppStatus(a.id, e.target.value as any)} className="rounded border border-slate-200 px-2 py-1 text-xs font-semibold">
                      {["Submitted","Under Review","Shortlisted","Accepted","Waitlisted","Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="py-16 text-center"><ClipboardCheck className="mx-auto text-slate-300" size={44}/><h3 className="mt-4 text-base font-bold text-lani-navy">No Applications</h3></div>}
        </div>
      )}

      {/* CERTIFICATES */}
      {tab === "certificates" && (
        <div className="table-shell border border-slate-200">
          {certificates.length > 0 ? (
            <table>
              <thead><tr><th>Certificate ID</th><th>Learner</th><th>Course</th><th>Issued</th><th>Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.id}</strong></td>
                    <td><strong>{c.learnerName}</strong><span>{c.learnerEmail}</span></td>
                    <td className="text-xs font-semibold">{c.courseTitle}</td>
                    <td className="text-xs">{formatDate(c.issueDate)}</td>
                    <td><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${c.status==="Issued"?"bg-lani-emerald/15 text-lani-green":"bg-red-50 text-red-600"}`}>{c.status}</span></td>
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
    </div>
  );
}
