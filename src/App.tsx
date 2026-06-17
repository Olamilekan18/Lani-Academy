import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Corporate from "./pages/Corporate";
import Applications from "./pages/Applications";
import Login from "./pages/Login";
import LearnerDashboard from "./pages/LearnerDashboard";
import FacilitatorDashboard from "./pages/FacilitatorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import Verify from "./pages/Verify";

import CheckoutModal from "./components/CheckoutModal";
import CoursePlayer from "./components/CoursePlayer";
import CertificateModal from "./components/CertificateModal";

import { supabase } from "./lib/supabase";
import { courses as defaultCourses } from "./data/catalog";
import {
  mockQuizzes,
  mockQuizAttempts,
  mockAssignments,
  mockSubmissions,
  mockAnnouncements,
  mockCalendarEvents,
  mockNotifications,
  mockFacilitatorAssignments
} from "./data/mockLmsData";
import {
  dbGetCourses,
  dbGetEnrollments,
  dbGetTransactions,
  dbGetCertificates,
  dbGetLeads,
  dbGetApplications,
  dbGetAssets,
  dbSaveEnrollment,
  dbSaveTransaction,
  dbSaveCertificate,
  dbUpdateEnrollmentProgress,
  dbUpdateLeadStage,
  dbUpdateApplicationStatus,
  dbSaveAsset,
  dbSaveLead,
  dbSaveApplication
} from "./lib/db";
import type {
  View,
  Course,
  Enrollment,
  Certificate,
  Transaction,
  CorporateLead,
  ProgrammeApplication,
  CmsAsset,
  Quiz,
  QuizAttempt,
  Assignment,
  AssignmentSubmission,
  Announcement,
  CalendarEvent,
  Notification,
  FacilitatorAssignment
} from "./lib/types";

export default function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [demoRole, setDemoRole] = useState<"visitor" | "learner" | "facilitator" | "admin">("visitor");

  // Data lists loaded from database
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [leads, setLeads] = useState<CorporateLead[]>([]);
  const [applications, setApplications] = useState<ProgrammeApplication[]>([]);
  const [assets, setAssets] = useState<CmsAsset[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Mock data states for LMS features not yet in Supabase
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [facilitatorAssignments, setFacilitatorAssignments] = useState<FacilitatorAssignment[]>([]);

  // Detailed view states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeVerifyId, setActiveVerifyId] = useState<string>("");

  // Modals state
  const [showCheckout, setShowCheckout] = useState(false);
  const [activePlayer, setActivePlayer] = useState<{ course: Course; enrollment: Enrollment } | null>(null);
  const [activeCertificate, setActiveCertificate] = useState<Certificate | null>(null);

  // Global loading and error states
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);

  // Fetch all databases from Supabase
  const loadDatabase = async () => {
    setLoading(true);
    setConnectionError(null);
    try {
      if (!supabase) {
        throw new Error("Supabase is not configured. Please check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.");
      }

      // Proactively check database connection with a 5-second timeout race
      const testPromise = supabase.from("courses").select("id").limit(1);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timed out. Remote database is unreachable.")), 5000)
      );

      const result = await Promise.race([testPromise, timeoutPromise]) as any;
      if (result.error) {
        throw new Error(`Database connection failed: ${result.error.message}. Verify that you have executed the schema.sql in your Supabase SQL editor.`);
      }

      const dbCourses = await dbGetCourses();
      setCourses(dbCourses);

      const dbEnrollments = await dbGetEnrollments();
      setEnrollments(dbEnrollments);

      const dbTransactions = await dbGetTransactions();
      setTransactions(dbTransactions);

      const dbCertificates = await dbGetCertificates();
      setCertificates(dbCertificates);

      const dbLeads = await dbGetLeads();
      setLeads(dbLeads);

      const dbApplications = await dbGetApplications();
      setApplications(dbApplications);

      const dbAssets = await dbGetAssets();
      setAssets(dbAssets);

      // Load mock data for extended LMS features
      setQuizzes(mockQuizzes);
      setQuizAttempts(mockQuizAttempts);
      setCourseAssignments(mockAssignments);
      setSubmissions(mockSubmissions);
      setAnnouncements(mockAnnouncements);
      setCalendarEvents(mockCalendarEvents);
      setNotifications(mockNotifications);
      setFacilitatorAssignments(mockFacilitatorAssignments);

      setOfflineMode(false);
    } catch (err: any) {
      console.error("Failed to load initial Supabase lists:", err);
      setConnectionError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDatabase();
  }, []);

  // Sync role changes
  const handleDemoRoleChange = (role: "visitor" | "learner" | "facilitator" | "admin") => {
    setDemoRole(role);
    if (role === "visitor") {
      setCurrentView("home");
    } else if (role === "learner") {
      setCurrentView("learner");
    } else if (role === "facilitator") {
      setCurrentView("facilitator");
    } else if (role === "admin") {
      setCurrentView("admin");
    }
  };

  // Wishlist toggle
  const handleToggleWishlist = (courseId: string) => {
    setWishlist((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    );
  };

  // Open course page
  const handleOpenCourse = (course: Course) => {
    setSelectedCourse(course);
    setCurrentView("courses"); // Show detail instead of list
  };

  // Handle Checkout success
  const handlePaymentComplete = async (gateway: "Paystack" | "Flutterwave" | "Bank Transfer") => {
    if (!selectedCourse) return;

    const enrollmentId = "enr-" + Math.random().toString(36).substring(2, 8);
    const transactionId = "txn-" + Math.random().toString(36).substring(2, 8);

    const enrollment: Enrollment = {
      id: enrollmentId,
      courseId: selectedCourse.id,
      learnerEmail: "learner@lani.academy",
      learnerName: "Learner (Demo)",
      enrolledAt: new Date().toISOString().split("T")[0],
      progress: 0,
      completedLessons: [],
      paymentStatus: gateway === "Bank Transfer" ? "Pending" : "Successful",
    };

    const transaction: Transaction = {
      id: transactionId,
      courseId: selectedCourse.id,
      learnerEmail: "learner@lani.academy",
      receiptNumber: "LANI-REC-" + Math.floor(100000 + Math.random() * 900000),
      gateway,
      amount: selectedCourse.price,
      status: gateway === "Bank Transfer" ? "Pending" : "Successful",
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      // 1. Save to Supabase
      await dbSaveEnrollment(enrollment);
      await dbSaveTransaction(transaction);

      // 2. Refresh lists
      await loadDatabase();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  // Handle LMS progress completion and check for certificate awards
  const handleUpdateProgress = async (completedLessons: string[], progress: number) => {
    if (!activePlayer) return;
    const { enrollment, course } = activePlayer;

    try {
      // 1. Update progress on Supabase
      await dbUpdateEnrollmentProgress(enrollment.id, completedLessons, progress);

      // 2. Check if finished (100% progress) and doesn't already have certificate
      const alreadyHasCert = certificates.some((c) => c.courseId === course.id);
      if (progress === 100 && !alreadyHasCert) {
        const certId = "LANI-CERT-" + Math.floor(1000 + Math.random() * 9000);
        const cert: Certificate = {
          id: certId,
          courseId: course.id,
          courseTitle: course.title,
          learnerEmail: "learner@lani.academy",
          learnerName: "Learner (Demo)",
          issueDate: new Date().toISOString().split("T")[0],
          status: "Issued",
        };
        await dbSaveCertificate(cert);
      }

      // 3. Refresh lists
      await loadDatabase();

      // Keep player state in sync
      const updatedEnrollment = { ...enrollment, completedLessons, progress };
      setActivePlayer({ course, enrollment: updatedEnrollment });
    } catch (err) {
      console.error("Failed to sync progress:", err);
    }
  };

  // Lead stages updates
  const handleUpdateLeadStage = async (id: string, stage: CorporateLead["stage"]) => {
    try {
      await dbUpdateLeadStage(id, stage);
      await loadDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  // Scholarship applications status updates
  const handleUpdateAppStatus = async (id: string, status: ProgrammeApplication["status"]) => {
    try {
      await dbUpdateApplicationStatus(id, status);
      await loadDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  // Asset creation
  const handleAddAsset = async (assetData: any) => {
    const asset: CmsAsset = {
      id: "asset-" + Math.random().toString(36).substring(2, 8),
      ...assetData,
      createdAt: new Date().toISOString().split("T")[0],
    };
    try {
      await dbSaveAsset(asset);
      await loadDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  // Consultation / B2B additions
  const handleAddLead = async (leadData: any) => {
    try {
      await dbSaveLead(leadData);
      await loadDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  // Action stubs for new components
  const handlePostAnnouncement = (a: Omit<Announcement, "id"|"createdAt">) => {
    const newAnn: Announcement = { ...a, id: "ann-" + Date.now(), createdAt: new Date().toISOString() };
    setAnnouncements([newAnn, ...announcements]);
  };

  const handleGradeSubmission = (subId: string, score: number, feedback: string) => {
    setSubmissions(subs => subs.map(s => s.id === subId ? { ...s, score, feedback, status: "Graded" } : s));
  };

  const handleTakeQuiz = (q: Quiz) => {
    alert(`Mock Quiz Launched: ${q.title}`);
  };

  const handleUpdatePaymentStatus = async (id: string, status: Transaction["status"]) => {
    // In a real implementation this would update Supabase. For demo, we update state locally if it's not implemented in db.ts
    setTransactions(txns => txns.map(t => t.id === id ? { ...t, status } : t));
  };

  // Verification redirects
  const handleVerifyLink = (certId: string) => {
    setActiveVerifyId(certId);
    setCurrentView("verify");
  };

  // Render view router helper
  const renderViewContent = () => {
    if (loading) {
      return (
        <div className="section min-h-[45rem] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="h-12 w-12 border-4 border-lani-green border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-slate-500">Connecting...</p>
          </div>
        </div>
      );
    }

    if (connectionError && !offlineMode) {
      return (
        <div className="section min-h-[45rem] flex items-center justify-center bg-slate-50">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-8 shadow-xl text-center space-y-6">
            <div className="h-14 w-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-lani-navy">Supabase Connection Error</h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                We are unable to connect to the database right now. Please execute the schema setup or run in demo mode.
              </p>
            </div>

            <div className="rounded-lg bg-red-50/50 border border-red-100 p-4 text-left">
              <span className="text-[9px] uppercase font-bold text-red-500 block tracking-wider mb-1">Details</span>
              <p className="text-[11px] font-mono text-slate-600 break-words max-h-24 overflow-y-auto leading-normal">
                {connectionError}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={loadDatabase}
                className="btn-primary flex-1 justify-center min-h-10 text-xs font-bold"
              >
                Retry Connection
              </button>

              <button
                onClick={() => {
                  setOfflineMode(true);
                  setCourses(defaultCourses);
                  setConnectionError(null);
                }}
                className="btn-secondary border-slate-200 flex-1 justify-center min-h-10 text-xs font-bold"
              >
                Proceed Offline
              </button>
            </div>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case "home":
        return (
          <Home
            courses={courses}
            thematicAreas={courses.reduce((acc: any[], curr) => {
              if (!acc.some((a) => a.name === curr.thematicArea)) {
                acc.push({ id: curr.id, name: curr.thematicArea, summary: curr.shortDescription, audience: curr.audience[0] });
              }
              return acc;
            }, [])}
            onNavigate={setCurrentView}
            onOpenCourse={handleOpenCourse}
            onAddLead={handleAddLead}
          />
        );
      case "courses":
        if (selectedCourse) {
          return (
            <CourseDetail
              course={selectedCourse}
              onBack={() => setSelectedCourse(null)}
              onEnrol={() => {
                if (demoRole === "visitor") {
                  alert("Please sign in as a Learner (via Demo Switcher) to enable payments and progression.");
                  setDemoRole("learner");
                }
                setShowCheckout(true);
              }}
            />
          );
        }
        return (
          <Courses
            courses={courses}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onOpenCourse={handleOpenCourse}
            thematicAreas={Array.from(new Set(courses.map((c) => c.thematicArea)))}
          />
        );
      case "corporate":
        return <Corporate thematicAreas={Array.from(new Set(courses.map((c) => c.thematicArea)))} />;
      case "applications":
        return <Applications />;
      case "learner":
        if (demoRole !== "learner") {
          return (
            <Login
              onNavigate={setCurrentView}
              onForceDemoRole={handleDemoRoleChange}
              onSuccess={() => handleDemoRoleChange("learner")}
            />
          );
        }
        return (
          <LearnerDashboard
            enrollments={enrollments}
            courses={courses}
            certificates={certificates}
            transactions={transactions}
            quizzes={quizzes}
            quizAttempts={quizAttempts}
            assignments={courseAssignments}
            submissions={submissions}
            announcements={announcements}
            calendarEvents={calendarEvents}
            notifications={notifications}
            onOpenPlayer={(c, e) => setActivePlayer({ course: c, enrollment: e })}
            onOpenCertificate={setActiveCertificate}
            onTakeQuiz={handleTakeQuiz}
          />
        );
      case "facilitator":
        if (demoRole !== "facilitator") {
          return (
            <Login
              onNavigate={setCurrentView}
              onForceDemoRole={handleDemoRoleChange as any}
              onSuccess={() => handleDemoRoleChange("facilitator")}
            />
          );
        }
        return (
          <FacilitatorDashboard
            courses={courses}
            enrollments={enrollments}
            assignments={facilitatorAssignments}
            courseAssignments={courseAssignments}
            submissions={submissions}
            announcements={announcements}
            calendarEvents={calendarEvents}
            quizAttempts={quizAttempts}
            onPostAnnouncement={handlePostAnnouncement}
            onGradeSubmission={handleGradeSubmission}
          />
        );
      case "admin":
        if (demoRole !== "admin") {
          return (
            <Login
              onNavigate={setCurrentView}
              onForceDemoRole={handleDemoRoleChange}
              onSuccess={() => handleDemoRoleChange("admin")}
            />
          );
        }
        return (
          <AdminDashboard
            courses={courses}
            enrollments={enrollments}
            transactions={transactions}
            certificates={certificates}
            leads={leads}
            applications={applications}
            assets={assets}
            onUpdateLeadStage={handleUpdateLeadStage}
            onUpdateAppStatus={handleUpdateAppStatus}
            onAddAsset={handleAddAsset}
            onRefreshData={loadDatabase}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
          />
        );
      case "verify":
        return (
          <Verify
            certificates={certificates}
            initialQuery={activeVerifyId}
            onOpenCertificate={setActiveCertificate}
          />
        );
      default:
        return (
          <div className="section text-center py-20">
            <h2 className="text-xl font-bold">404 - Workspace View Not Found</h2>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Sticky header */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setSelectedCourse(null);
          setActiveVerifyId("");
          setCurrentView(view);
        }}
        demoRole={demoRole}
        onDemoRoleChange={handleDemoRoleChange}
      />

      {/* Main viewport */}
      <main className="flex-1 bg-white">
        {offlineMode && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-center text-xs font-bold text-amber-800 flex items-center justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Running LANI Academy in Offline Mode. Actions are simulated and will not save to Supabase.</span>
            <button
              onClick={loadDatabase}
              className="underline text-amber-950 hover:text-black font-extrabold ml-2"
            >
              Reconnect
            </button>
          </div>
        )}
        {renderViewContent()}
      </main>


      {/* Footer */}
      <Footer
        onNavigate={(view) => {
          setSelectedCourse(null);
          setActiveVerifyId("");
          setCurrentView(view);
        }}
      />

      {/* 1. Secure Card / Transfer Checkout Simulation Overlay */}
      {showCheckout && selectedCourse && (
        <CheckoutModal
          course={selectedCourse}
          learnerName={demoRole === "learner" ? "Learner (Demo)" : ""}
          learnerEmail={demoRole === "learner" ? "learner@lani.academy" : ""}
          onClose={() => setShowCheckout(false)}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {/* 2. Interactive LMS Video / Syllabus Player Overlay */}
      {activePlayer && (
        <CoursePlayer
          course={activePlayer.course}
          enrollment={activePlayer.enrollment}
          onClose={() => {
            setActivePlayer(null);
            loadDatabase(); // ensure progress charts update immediately
          }}
          onUpdateProgress={handleUpdateProgress}
        />
      )}

      {/* 3. printable official diploma verification Overlay */}
      {activeCertificate && (
        <CertificateModal
          certificate={activeCertificate}
          onClose={() => setActiveCertificate(null)}
          onVerifyLink={handleVerifyLink}
        />
      )}
    </div>
  );
}
