import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Building2, Users, FileText, CheckCircle, Plus, BookOpen, Clock, Loader2, Sparkles } from "lucide-react";
import type { Course, Enrollment, CorporateLead } from "../lib/types";
import { dbSaveLead, toCamelCaseKeys } from "../lib/db";
import toast from "react-hot-toast";

interface Props {
  courses: Course[];
}

type Tab = "learners" | "proposals";

export default function OrganizationDashboard({ courses }: Props) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("learners");
  
  // Data lists
  const [sponsoredLearners, setSponsoredLearners] = useState<Enrollment[]>([]);
  const [myProposals, setMyProposals] = useState<CorporateLead[]>([]);
  
  // Loaders
  const [loadingLearners, setLoadingLearners] = useState(true);
  const [loadingProposals, setLoadingProposals] = useState(true);
  const [submittingLearner, setSubmittingLearner] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Form states
  const [learnerName, setLearnerName] = useState("");
  const [learnerEmail, setLearnerEmail] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  // Bulk enrolment
  const [bulkText, setBulkText] = useState("");
  const [bulkCourse, setBulkCourse] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);

  const [proposalThematicArea, setProposalThematicArea] = useState("");
  const [proposalParticipants, setProposalParticipants] = useState(15);
  const [proposalMode, setProposalMode] = useState("Hybrid");
  const [proposalDate, setProposalDate] = useState("");
  const [proposalNeed, setProposalNeed] = useState("");

  const orgName = profile?.organisation || "Organisation";

  const loadLearners = async () => {
    if (!supabase || !orgName) return;
    setLoadingLearners(true);
    try {
      const { data, error } = await supabase
        .from("enrollments")
        .select("*")
        .eq("sponsor_organisation", orgName)
        .order("enrolled_at", { ascending: false });
      if (error) {
        console.error("Error loading sponsored learners:", error.message);
      } else if (data) {
        // DB rows are snake_case — convert to the camelCase Enrollment shape
        setSponsoredLearners(toCamelCaseKeys(data) as Enrollment[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLearners(false);
    }
  };

  const loadProposals = async () => {
    if (!supabase || !orgName) return;
    setLoadingProposals(true);
    try {
      const { data, error } = await supabase
        .from("corporate_leads")
        .select("*")
        .eq("organisation", orgName);
      if (!error && data) {
        setMyProposals(data as CorporateLead[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    loadLearners();
    loadProposals();
    if (courses.length > 0) {
      setSelectedCourse(courses[0].id);
      setBulkCourse(courses[0].id);
      setProposalThematicArea(courses[0].thematicArea);
    }
  }, [orgName, courses]);

  const handleBulkEnrol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    const courseId = bulkCourse || courses[0]?.id;
    if (!courseId) { toast.error("Select a course."); return; }
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) { toast.error("Add at least one learner (one per line)."); return; }

    setBulkBusy(true);
    const targetCourse = courses.find((c) => c.id === courseId);
    let enrolled = 0, skipped = 0;

    for (const line of lines) {
      const parts = line.split(/[,;\t]/).map((p) => p.trim()).filter(Boolean);
      let name = "", email = "";
      if (parts.length >= 2) { name = parts[0]; email = parts[1]; }
      else { email = parts[0]; name = parts[0].split("@")[0]; }
      if (!email.includes("@")) { skipped++; continue; }
      try {
        const { data: existing } = await supabase
          .from("enrollments").select("id")
          .eq("course_id", courseId).eq("learner_email", email).maybeSingle();
        if (existing) { skipped++; continue; }
        const { error } = await supabase.from("enrollments").insert({
          id: "enr-" + Math.random().toString(36).substring(2, 8),
          course_id: courseId, learner_name: name, learner_email: email,
          payment_status: "Successful", sponsor_organisation: orgName, progress: 0,
        });
        if (error) { skipped++; continue; }
        await supabase.from("transactions").insert({
          course_id: courseId, learner_email: email, amount: targetCourse?.price || 0,
          gateway: "Bank Transfer", status: "Successful",
          receipt_number: "SPON-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        });
        enrolled++;
      } catch { skipped++; }
    }

    setBulkBusy(false);
    setBulkText("");
    toast.success(`Enrolled ${enrolled}${skipped ? `, skipped ${skipped}` : ""}.`);
    loadLearners();
  };

  const handleRegisterLearner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    if (!learnerName || !learnerEmail || !selectedCourse) {
      toast.error("Please fill in all fields.");
      return;
    }

    setSubmittingLearner(true);
    const targetCourse = courses.find((c) => c.id === selectedCourse);
    
    try {
      // 1. Check if learner is already enrolled
      const { data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", selectedCourse)
        .eq("learner_email", learnerEmail)
        .maybeSingle();

      if (existing) {
        toast.error("This learner is already enrolled in this course.");
        setSubmittingLearner(false);
        return;
      }

      // 2. Insert enrollment
      const enrollmentId = "enr-" + Math.random().toString(36).substring(2, 8);
      const { error: enrollErr } = await supabase.from("enrollments").insert({
        id: enrollmentId,
        course_id: selectedCourse,
        learner_name: learnerName,
        learner_email: learnerEmail,
        payment_status: "Successful",
        sponsor_organisation: orgName,
        progress: 0,
      });

      if (enrollErr) throw enrollErr;

      // 3. Log a sponsored transaction
      const receiptNo = "SPON-" + Math.random().toString(36).substring(2, 8).toUpperCase();
      await supabase.from("transactions").insert({
        course_id: selectedCourse,
        learner_email: learnerEmail,
        amount: targetCourse?.price || 0,
        gateway: "Bank Transfer",
        status: "Successful",
        receipt_number: receiptNo,
      });

      toast.success(`${learnerName} has been enrolled successfully!`);
      setLearnerName("");
      setLearnerEmail("");
      loadLearners();
    } catch (err: any) {
      toast.error(err.message || "Failed to register learner.");
    } finally {
      setSubmittingLearner(false);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposalThematicArea || !proposalDate || !proposalNeed) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmittingProposal(true);
    const leadData = {
      id: "lead-" + Math.random().toString(36).substring(2, 8),
      organisation: orgName,
      sector: profile?.job_title || "Other Services",
      contactName: profile?.full_name || "Org Admin",
      email: profile?.email || "",
      phone: profile?.phone || "",
      thematicArea: proposalThematicArea,
      participants: proposalParticipants,
      deliveryMode: proposalMode as any,
      preferredDate: proposalDate,
      need: proposalNeed,
      stage: "New" as const,
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      const ok = await dbSaveLead(leadData);
      if (ok) {
        toast.success("Custom training request registered successfully!");
        setProposalNeed("");
        loadProposals();
      } else {
        toast.error("Failed to submit request.");
      }
    } catch (err) {
      toast.error("Error submitting proposal request.");
    } finally {
      setSubmittingProposal(false);
    }
  };

  const thematicAreas = Array.from(new Set(courses.map((c) => c.thematicArea)));

  return (
    <div className="section bg-white text-left min-h-[50rem]">
      {/* Welcome Banner */}
      <div className="mb-8 rounded-2xl bg-gradient-to-r from-slate-900 to-lani-navy p-8 text-white relative overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="relative z-10 space-y-2">
          <span className="eyebrow border-white/20 bg-white/5 text-white/90">Corporate Portal</span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome, {orgName}</h1>
          <p className="text-xs text-slate-300 max-w-md">
            Manage sponsored corporate learners, track course completion progress, and request custom training cohorts.
          </p>
        </div>
      </div>

      {/* Grid: Stat Summary */}
      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-lani-green/10 text-lani-green flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Sponsored Learners</span>
            <span className="text-xl font-bold text-lani-navy">{sponsoredLearners.length}</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-lani-blue/10 text-lani-blue flex items-center justify-center">
            <BookOpen size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Enrolments</span>
            <span className="text-xl font-bold text-lani-navy">
              {sponsoredLearners.filter((l) => l.progress < 100).length}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-lani-gold/10 text-lani-gold flex items-center justify-center">
            <CheckCircle size={22} />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed Programmes</span>
            <span className="text-xl font-bold text-lani-navy">
              {sponsoredLearners.filter((l) => l.progress === 100).length}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-slate-200 mb-8 flex gap-4">
        <button
          onClick={() => setActiveTab("learners")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "learners"
              ? "border-lani-green text-lani-green"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users size={16} />
          Sponsored Learners
        </button>
        <button
          onClick={() => setActiveTab("proposals")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "proposals"
              ? "border-lani-green text-lani-green"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText size={16} />
          Custom Training Requests
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "learners" && (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Table */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-lani-navy">Sponsored Learner Roster</h2>
            
            {loadingLearners ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-2 text-lani-green" size={24} />
                <p className="text-xs">Loading roster...</p>
              </div>
            ) : sponsoredLearners.length === 0 ? (
              <div className="border border-dashed border-slate-350 rounded-2xl p-12 text-center text-slate-400 bg-slate-50/50">
                <Users size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-500">No sponsored learners yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Enroll your staff members using the form on the right.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                      <th className="p-4">Name / Email</th>
                      <th className="p-4">Programme</th>
                      <th className="p-4 text-center">Progress</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right">Enrolled At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {sponsoredLearners.map((learner) => {
                      const course = courses.find((c) => c.id === learner.courseId);
                      // Total lessons across the course, and how many this learner finished
                      const totalLessons = course?.modules?.reduce((n, m) => n + (m.lessons?.length || 0), 0) || 0;
                      const doneLessons = (learner.completedLessons || []).filter(
                        (id) => !id.startsWith("mat:")
                      ).length;
                      const pct = learner.progress || 0;
                      const status = pct >= 100 ? "Completed" : pct > 0 ? "In progress" : "Not started";
                      const statusClass =
                        status === "Completed"
                          ? "bg-emerald-50 text-emerald-600"
                          : status === "In progress"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-slate-100 text-slate-500";
                      return (
                        <tr key={learner.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{learner.learnerName}</div>
                            <div className="text-[10px] text-slate-400">{learner.learnerEmail}</div>
                          </td>
                          <td className="p-4">
                            <div className="max-w-[200px] truncate font-bold text-slate-700">
                              {course?.title || learner.courseId}
                            </div>
                            {totalLessons > 0 && (
                              <div className="text-[10px] text-slate-400">
                                {doneLessons}/{totalLessons} lessons
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-slate-150 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    pct === 100 ? "bg-lani-green" : "bg-lani-blue"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold text-slate-600">{pct}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-block rounded px-2 py-0.5 text-[9px] font-bold uppercase ${statusClass}`}>
                              {status}
                            </span>
                          </td>
                          <td className="p-4 text-right text-[10px] text-slate-400">
                            {learner.enrolledAt}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right: Form */}
          <div className="rounded-2xl border border-slate-200 shadow-sm p-6 bg-slate-50/50 space-y-4 self-start">
            <div className="flex items-center gap-2">
              <Plus className="text-lani-green" size={18} />
              <h3 className="text-sm font-bold text-lani-navy">Sponsor New Learner</h3>
            </div>
            
            <form onSubmit={handleRegisterLearner} className="space-y-4">
              <label className="form-field bg-white">
                Learner Full Name
                <input
                  type="text"
                  required
                  placeholder="e.g. Samuel Adebayo"
                  value={learnerName}
                  onChange={(e) => setLearnerName(e.target.value)}
                />
              </label>

              <label className="form-field bg-white">
                Learner Email Address
                <input
                  type="email"
                  required
                  placeholder="e.g. s.adebayo@company.com"
                  value={learnerEmail}
                  onChange={(e) => setLearnerEmail(e.target.value)}
                />
              </label>

              <label className="form-field bg-white">
                Select Course / Program
                <select
                  required
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.code})
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={submittingLearner}
                className="btn-primary w-full justify-center text-xs font-bold min-h-10 mt-2"
              >
                {submittingLearner ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Enrolling learner...
                  </>
                ) : (
                  "Enroll and Confirm Sponsorship"
                )}
              </button>
            </form>

            {/* Bulk enrolment */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Users className="text-lani-blue" size={16} />
                <h3 className="text-sm font-bold text-lani-navy">Bulk Enrol a Cohort</h3>
              </div>
              <form onSubmit={handleBulkEnrol} className="space-y-3">
                <label className="form-field bg-white">
                  Course / Program
                  <select value={bulkCourse} onChange={(e) => setBulkCourse(e.target.value)} required>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
                  </select>
                </label>
                <label className="form-field bg-white">
                  Learners — one per line, "Name, email"
                  <textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={5}
                    placeholder={"Samuel Adebayo, s.adebayo@company.com\nJane Doe, jane.doe@company.com"}
                  />
                </label>
                <button type="submit" disabled={bulkBusy} className="btn-secondary w-full justify-center text-xs font-bold min-h-10">
                  {bulkBusy ? <><Loader2 size={14} className="animate-spin" />Enrolling cohort...</> : "Bulk Enrol Cohort"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === "proposals" && (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Left: Proposals List */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-lani-navy">Custom Proposal Log</h2>
            
            {loadingProposals ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="animate-spin mx-auto mb-2 text-lani-green" size={24} />
                <p className="text-xs">Loading requests...</p>
              </div>
            ) : myProposals.length === 0 ? (
              <div className="border border-dashed border-slate-350 rounded-2xl p-12 text-center text-slate-400 bg-slate-50/50">
                <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold text-slate-500">No requests submitted yet.</p>
                <p className="text-[10px] text-slate-400 mt-1">Submit proposal specs using the form on the right.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myProposals.map((prop) => (
                  <div key={prop.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-3 hover:shadow transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-lani-gold bg-lani-gold/10 px-2 py-0.5 rounded uppercase">
                        {prop.id}
                      </span>
                      <span className="text-[9px] uppercase font-bold text-slate-400 flex items-center gap-1">
                        <Clock size={10} />
                        {prop.createdAt}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold text-lani-navy">{prop.thematicArea} Custom Cohort</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-normal italic">"{prop.need}"</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] font-semibold text-slate-500">
                      <div>Mode: <span className="text-slate-700 font-bold">{prop.deliveryMode}</span></div>
                      <div>Staff size: <span className="text-slate-700 font-bold">{prop.participants}</span></div>
                      <div>
                        Status:{" "}
                        <span
                          className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                            prop.stage === "Won"
                              ? "bg-emerald-50 text-emerald-600"
                              : prop.stage === "Lost"
                              ? "bg-red-50 text-red-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {prop.stage}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Proposal Form */}
          <div className="rounded-2xl border border-slate-200 shadow-sm p-6 bg-slate-50/50 space-y-4 self-start">
            <div className="flex items-center gap-2">
              <Sparkles className="text-lani-gold" size={18} />
              <h3 className="text-sm font-bold text-lani-navy">Request Custom Training</h3>
            </div>
            
            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <label className="form-field bg-white">
                Thematic Area
                <select
                  required
                  value={proposalThematicArea}
                  onChange={(e) => setProposalThematicArea(e.target.value)}
                >
                  {thematicAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field bg-white">
                Approx. Participants
                <input
                  type="number"
                  required
                  min={1}
                  value={proposalParticipants}
                  onChange={(e) => setProposalParticipants(parseInt(e.target.value) || 0)}
                />
              </label>

              <label className="form-field bg-white">
                Preferred Mode
                <select
                  required
                  value={proposalMode}
                  onChange={(e) => setProposalMode(e.target.value)}
                >
                  <option value="Hybrid">Hybrid (Classroom + LMS)</option>
                  <option value="In-plant">In-plant (Physical)</option>
                  <option value="Virtual">Virtual Interactive</option>
                  <option value="Self-paced">Self-paced Digital</option>
                </select>
              </label>

              <label className="form-field bg-white">
                Commencement Date
                <input
                  type="date"
                  required
                  value={proposalDate}
                  onChange={(e) => setProposalDate(e.target.value)}
                />
              </label>

              <label className="form-field bg-white">
                Detailed Objectives / Requirements
                <textarea
                  required
                  rows={3}
                  placeholder="Describe your skills gaps or specific regulatory standards needed..."
                  value={proposalNeed}
                  onChange={(e) => setProposalNeed(e.target.value)}
                />
              </label>

              <button
                type="submit"
                disabled={submittingProposal}
                className="btn-primary w-full justify-center text-xs font-bold min-h-10 mt-2"
              >
                {submittingProposal ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Submitting proposal specs...
                  </>
                ) : (
                  "Submit Proposal Request"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
