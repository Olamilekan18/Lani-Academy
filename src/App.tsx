import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";
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
import SignUp from "./pages/SignUp";
import About from "./pages/About";
import Certification from "./pages/Certification";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import LearningCalendar from "./pages/LearningCalendar";
import OrganizationDashboard from "./pages/OrganizationDashboard";
import Pathways from "./pages/Pathways";

import LoadingScreen from "./components/LoadingScreen";
import TwoFactorModal from "./components/TwoFactorModal";
import { TWO_FACTOR_ENABLED } from "./lib/twoFactor";
import CheckoutModal from "./components/CheckoutModal";
import CoursePlayer from "./components/CoursePlayer";
import CertificateModal from "./components/CertificateModal";

import { supabase } from "./lib/supabase";
import { courses as defaultCourses } from "./data/catalog";

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
  dbSaveApplication,
  dbSaveCourse,
  dbGetQuizzes,
  dbGetQuizAttempts,
  dbGetAssignments,
  dbGetAssignmentSubmissions,
  dbGetAnnouncements,
  dbGetCalendarEvents,
  dbGetNotifications,
  dbGetFacilitatorAssignments,
  dbGetFacilitators,
  dbSaveAnnouncement,
  dbSaveAssignmentSubmission,
  dbSaveQuizAttempt,
  dbSaveQuiz,
  dbSaveAssignment,
  dbSaveNotification,
  dbSaveFacilitatorAssignment,
  dbSendEmail,
  dbGetWishlist,
  dbAddWishlist,
  dbRemoveWishlist,
  dbGetPromos,
  dbSavePromo,
  dbGetSurveys,
  dbSaveSurvey,
  dbGetSurveyResponses,
  dbSaveSurveyResponse,
  dbGetNewsletterSubscribers,
  dbGetContent,
  dbSaveContent,
  dbDeleteContent,
  dbSaveCalendarEvent,
  dbDeleteCalendarEvent,
  dbUpdateCourse,
  dbGetAttendance,
  dbSaveAttendance,
  dbGetDiscussions,
  dbSaveDiscussion,
  dbDeleteDiscussion,
  dbGetPathways,
  dbSavePathway,
  dbDeletePathway,
  dbGetReviews,
  dbSaveReview,
  dbMarkNotificationRead,
  dbMarkAllNotificationsRead,
  dbLogEvent,
  dbLogAudit
} from "./lib/db";
import { formatMoney } from "./lib/utils";
import { applySeo } from "./lib/seo";
import { trackPage } from "./lib/analytics";
import {
  paymentConfirmationEmail,
  certificateReadyEmail,
  applicationStatusEmail,
  broadcastEmail,
  notificationEmail
} from "./lib/emailTemplates";
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
  FacilitatorAssignment,
  PromoCode,
  Survey,
  SurveyResponse,
  ContentItem,
  AttendanceRecord,
  DiscussionPost,
  Pathway,
  CourseReview
} from "./lib/types";

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [twoFactorPassed, setTwoFactorPassed] = useState(false);

  // Data lists loaded from database
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [leads, setLeads] = useState<CorporateLead[]>([]);
  const [applications, setApplications] = useState<ProgrammeApplication[]>([]);
  const [assets, setAssets] = useState<CmsAsset[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [surveyResponses, setSurveyResponses] = useState<SurveyResponse[]>([]);
  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [reviews, setReviews] = useState<CourseReview[]>([]);

  // Mock data states for LMS features not yet in Supabase
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [facilitatorAssignments, setFacilitatorAssignments] = useState<FacilitatorAssignment[]>([]);
  const [facilitators, setFacilitators] = useState<{fullName: string, email: string}[]>([]);

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

      const [dbPromos, dbSurveys, dbSurveyResponses, dbSubscribers, dbContent, dbAttendance, dbDiscussions, dbPathways, dbReviews] = await Promise.all([
        dbGetPromos(),
        dbGetSurveys(),
        dbGetSurveyResponses(),
        dbGetNewsletterSubscribers(),
        dbGetContent(),
        dbGetAttendance(),
        dbGetDiscussions(),
        dbGetPathways(),
        dbGetReviews(),
      ]);
      setPromos(dbPromos);
      setSurveys(dbSurveys);
      setSurveyResponses(dbSurveyResponses);
      setSubscribers(dbSubscribers);
      setContent(dbContent);
      setAttendance(dbAttendance);
      setDiscussions(dbDiscussions);
      setPathways(dbPathways);
      setReviews(dbReviews);

      // Load extended LMS features from Supabase
      const [
        dbQuizzes,
        dbQuizAttempts,
        dbAssignments,
        dbSubmissions,
        dbAnnouncements,
        dbCalendarEvents,
        dbNotifications,
        dbFacilitatorAssignments,
        dbFacilitators
      ] = await Promise.all([
        dbGetQuizzes(),
        dbGetQuizAttempts(),
        dbGetAssignments(),
        dbGetAssignmentSubmissions(),
        dbGetAnnouncements(),
        dbGetCalendarEvents(),
        dbGetNotifications(),
        dbGetFacilitatorAssignments(),
        dbGetFacilitators()
      ]);

      setQuizzes(dbQuizzes);
      setQuizAttempts(dbQuizAttempts);
      setCourseAssignments(dbAssignments);
      setSubmissions(dbSubmissions);
      setAnnouncements(dbAnnouncements);
      setCalendarEvents(dbCalendarEvents);
      setNotifications(dbNotifications);
      setFacilitatorAssignments(dbFacilitatorAssignments);
      setFacilitators(dbFacilitators);

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

  // Reset the 2FA gate whenever the user signs out.
  useEffect(() => {
    if (!user) setTwoFactorPassed(false);
  }, [user]);

  // Per-page SEO + analytics page view on navigation.
  useEffect(() => {
    const title = applySeo(location.pathname);
    trackPage(location.pathname, title);
  }, [location.pathname]);

  // Load the signed-in learner's saved wishlist.
  useEffect(() => {
    const email = profile?.email || user?.email;
    if (email) dbGetWishlist(email).then(setWishlist).catch(() => {});
    else setWishlist([]);
  }, [user, profile]);

  // Helper for components still using onNavigate
  const navigateToView = (view: View) => {
    if (view === "home") navigate("/");
    else if (view === "courses") navigate("/courses");
    else if (view === "corporate") navigate("/corporate");
    else if (view === "applications") navigate("/applications");
    else if (view === "learner") navigate("/learn");
    else if (view === "facilitator") navigate("/facilitator");
    else if (view === "organization") navigate("/organization");
    else if (view === "admin") navigate("/admin");
    else if (view === "verify") navigate("/verify");
    else if (view === "about") navigate("/about");
    else if (view === "certification") navigate("/certification");
    else if (view === "resources") navigate("/resources");
    else if (view === "contact") navigate("/contact");
    else if (view === "calendar") navigate("/calendar");
    else if (view === "pathways") navigate("/pathways");
    else if (view === "profile") navigate("/learn?tab=profile");
  };

  // Wishlist toggle — persists for signed-in learners, in-memory otherwise
  const handleToggleWishlist = async (courseId: string) => {
    const email = profile?.email || user?.email;
    const has = wishlist.includes(courseId);
    setWishlist((prev) => (has ? prev.filter((id) => id !== courseId) : [...prev, courseId]));
    if (email) {
      if (has) await dbRemoveWishlist(email, courseId);
      else await dbAddWishlist(email, courseId);
    }
  };

  // Open course page
  const handleOpenCourse = (course: Course) => {
    setSelectedCourse(course);
    void dbLogEvent("view", course.id);
    navigate("/courses");
  };

  // Handle Checkout success
  const handlePaymentComplete = async (
    gateway: "Paystack" | "Flutterwave" | "Bank Transfer",
    reference?: string,
    amount?: number
  ) => {
    if (!selectedCourse) return;

    const enrollmentId = "enr-" + Math.random().toString(36).substring(2, 8);
    const transactionId = "txn-" + Math.random().toString(36).substring(2, 8);
    const learnerEmail = profile?.email || user?.email || "learner@lani.academy";
    const learnerName = profile?.full_name || "Learner";
    const paidAmount = amount ?? selectedCourse.price;

    const enrollment: Enrollment = {
      id: enrollmentId,
      courseId: selectedCourse.id,
      learnerEmail,
      learnerName,
      enrolledAt: new Date().toISOString().split("T")[0],
      progress: 0,
      completedLessons: [],
      paymentStatus: gateway === "Bank Transfer" ? "Pending" : "Successful",
    };

    const transaction: Transaction = {
      id: transactionId,
      courseId: selectedCourse.id,
      learnerEmail,
      receiptNumber: reference || "LANI-REC-" + Math.floor(100000 + Math.random() * 900000),
      gateway,
      amount: paidAmount,
      status: gateway === "Bank Transfer" ? "Pending" : "Successful",
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      // 1. Save to Supabase
      await dbSaveEnrollment(enrollment);
      await dbSaveTransaction(transaction);
      void dbLogEvent("checkout_complete", selectedCourse.id, learnerEmail);

      // 2. Send confirmation email (no-op if email isn't configured)
      const mail = paymentConfirmationEmail(
        learnerName,
        selectedCourse.title,
        formatMoney(paidAmount),
        transaction.receiptNumber,
        gateway === "Bank Transfer"
      );
      void dbSendEmail(learnerEmail, mail.subject, mail.html);
      notify(
        "payment",
        gateway === "Bank Transfer" ? "Enrolment received" : "Payment successful",
        `${selectedCourse.title} — ${formatMoney(paidAmount)}`,
        learnerEmail
      );

      // 3. Refresh lists
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
        const learnerEmail = profile?.email || user?.email || "learner@lani.academy";
        const learnerName = profile?.full_name || "Learner";
        const cert: Certificate = {
          id: certId,
          courseId: course.id,
          courseTitle: course.title,
          learnerEmail,
          learnerName,
          issueDate: new Date().toISOString().split("T")[0],
          status: "Issued",
        };
        await dbSaveCertificate(cert);

        // Notify the learner their certificate is ready (no-op if email unconfigured)
        const mail = certificateReadyEmail(learnerName, course.title, certId);
        void dbSendEmail(learnerEmail, mail.subject, mail.html);
        notify("certificate", "Certificate issued", `Your certificate for ${course.title} is ready.`, learnerEmail);
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

  // Convert an accepted applicant into an enrolled learner
  const handleConvertApplicant = async (app: ProgrammeApplication, courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    const enrollment: Enrollment = {
      id: "enr-" + Math.random().toString(36).substring(2, 8),
      courseId,
      learnerEmail: app.email,
      learnerName: app.applicantName,
      enrolledAt: new Date().toISOString().split("T")[0],
      progress: 0,
      completedLessons: [],
      paymentStatus: "Successful",
    };
    try {
      await dbSaveEnrollment(enrollment);
      await dbUpdateApplicationStatus(app.id, "Accepted");
      const mail = applicationStatusEmail(app.applicantName, app.programmeType, "Accepted — you're enrolled");
      void dbSendEmail(app.email, mail.subject, mail.html);
      notify("enrollment", "Application accepted", `You've been enrolled in ${course?.title || "your programme"}.`, app.email);
      await loadDatabase();
      toast.success(`${app.applicantName} enrolled in ${course?.title || courseId}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not convert applicant.");
    }
  };

  // Scholarship applications status updates
  const handleUpdateAppStatus = async (id: string, status: ProgrammeApplication["status"]) => {
    try {
      await dbUpdateApplicationStatus(id, status);
      const app = applications.find((a) => a.id === id);
      if (app?.email) {
        const mail = applicationStatusEmail(app.applicantName, app.programmeType, status);
        void dbSendEmail(app.email, mail.subject, mail.html);
        notify("announcement", "Application update", `Your ${app.programmeType} application is now: ${status}`, app.email);
      }
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

  // Course addition
  const handleAddCourse = async (courseData: Partial<Course>) => {
    try {
      await dbSaveCourse(courseData);
      logAudit("course.saved", "course", courseData.id, courseData.title || "");
      await loadDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignFacilitator = async (assignment: FacilitatorAssignment) => {
    try {
      await dbSaveFacilitatorAssignment(assignment);
      logAudit("facilitator.assigned", "course", assignment.courseId, `${assignment.facilitatorName} → ${assignment.courseTitle}`);
      await loadDatabase();
    } catch (err) {
      console.error(err);
    }
  };

  // Action stubs for new components
  const handlePostAnnouncement = async (a: Omit<Announcement, "id"|"createdAt">) => {
    const newAnn: Announcement = { ...a, id: "ann-" + Date.now().toString(), createdAt: new Date().toISOString() };
    await dbSaveAnnouncement(newAnn);
    // Notify every enrolled learner — in-app + email (announcements are important)
    notifyCourse(a.courseId, "announcement", a.title, `New announcement in ${a.courseTitle}:\n\n${a.body}`, true);
    await loadDatabase();
  };

  const handleGradeSubmission = async (subId: string, score: number, feedback: string) => {
    const sub = submissions.find(s => s.id === subId);
    if (sub) {
      await dbSaveAssignmentSubmission({ ...sub, score, feedback, status: "Graded" });
      notifyOne(sub.learnerEmail, "assessment", "Assignment graded", `Your submission scored ${score}.${feedback ? `\n\nFeedback: ${feedback}` : ""}`, true);
      await loadDatabase();
    }
  };

  const handleTakeQuiz = async (q: Quiz, answers: number[], score: number, passed: boolean) => {
    const learnerEmail = profile?.email || user?.email || "learner@lani.academy";
    const learnerName = profile?.full_name || "Learner";
    const attempt: QuizAttempt = {
      id: "qatt-" + Date.now().toString(),
      quizId: q.id,
      learnerEmail,
      learnerName,
      answers,
      score,
      passed,
      submittedAt: new Date().toISOString()
    };
    await dbSaveQuizAttempt(attempt);
    await loadDatabase();
    if (passed) toast.success(`Quiz passed — ${score}%`);
    else toast(`Quiz submitted — ${score}% (pass mark ${q.passingScore}%)`);
  };

  const handleSaveQuiz = async (quiz: Quiz) => {
    const ok = await dbSaveQuiz(quiz);
    if (ok) notifyCourse(quiz.courseId, "assessment", `New quiz: ${quiz.title}`, `A new quiz is available in ${quiz.courseTitle}${quiz.dueDate ? ` — due ${quiz.dueDate}` : ""}.`, true);
    await loadDatabase();
    if (ok) toast.success(`Quiz "${quiz.title}" published`);
    else toast.error("Could not save quiz.");
  };

  const handleSaveAssignment = async (assignment: Assignment) => {
    const ok = await dbSaveAssignment(assignment);
    if (ok) notifyCourse(assignment.courseId, "assessment", `New assignment: ${assignment.title}`, `A new assignment is due in ${assignment.courseTitle}${assignment.dueDate ? ` on ${assignment.dueDate}` : ""}.`, true);
    await loadDatabase();
    if (ok) toast.success(`Assignment "${assignment.title}" published`);
    else toast.error("Could not save assignment.");
  };

  // Record a privileged action to the admin audit log (never blocks the caller)
  const logAudit = (action: string, targetType?: string, targetId?: string, detail?: string) =>
    void dbLogAudit({
      actorEmail: profile?.email || user?.email || null,
      actorRole: profile?.role || null,
      action,
      targetType,
      targetId,
      detail,
    });

  const handleBroadcast = async (emails: string[], subject: string, message: string) => {
    const unique = Array.from(
      new Set(emails.map((e) => (e || "").trim().toLowerCase()).filter((e) => e.includes("@")))
    );
    if (unique.length === 0) {
      toast.error("No valid recipients for that audience.");
      return;
    }
    const mail = broadcastEmail(subject, message);
    let sent = 0;
    for (const to of unique) {
      const ok = await dbSendEmail(to, mail.subject, mail.html);
      if (ok) sent++;
      notify("announcement", subject, message, to); // in-app copy for account holders
    }
    logAudit("broadcast.sent", "broadcast", undefined, `"${subject}" to ${unique.length} recipient(s)`);
    await loadDatabase();
    if (sent > 0) toast.success(`Broadcast sent to ${sent} recipient(s) (email + in-app).`);
    else toast(`In-app sent to ${unique.length}; connect Resend to also deliver email.`);
  };

  const handleUpdateCurriculum = async (courseId: string, patch: Partial<Course>) => {
    const ok = await dbUpdateCourse(courseId, patch);
    if (ok) logAudit("course.updated", "course", courseId, patch.status ? `status → ${patch.status}` : "curriculum/details updated");
    await loadDatabase();
    if (ok) toast.success("Curriculum saved");
    else toast.error("Could not save curriculum.");
  };

  const handleSavePathway = async (pathway: Partial<Pathway>) => {
    const ok = await dbSavePathway(pathway);
    await loadDatabase();
    if (ok) toast.success("Pathway saved");
    else toast.error("Could not save pathway.");
  };

  const handleDeletePathway = async (id: string) => {
    await dbDeletePathway(id);
    await loadDatabase();
  };

  const handleSaveReview = async (review: Partial<CourseReview>) => {
    const learnerEmail = profile?.email || user?.email || "";
    const learnerName = profile?.full_name || "Learner";
    const ok = await dbSaveReview({ ...review, learnerEmail, learnerName });
    await loadDatabase();
    if (ok) toast.success("Thanks for your review!");
    else toast.error("Could not save review. You must be enrolled in this course.");
  };

  const handleSaveDiscussion = async (post: DiscussionPost) => {
    const ok = await dbSaveDiscussion(post);
    await loadDatabase();
    if (!ok) toast.error("Could not post. You must be enrolled in this course.");
  };

  const handleDeleteDiscussion = async (id: string) => {
    await dbDeleteDiscussion(id);
    await loadDatabase();
  };

  const handleSaveAttendance = async (records: AttendanceRecord[]) => {
    const ok = await dbSaveAttendance(records);
    await loadDatabase();
    if (ok) toast.success("Attendance saved");
    else toast.error("Could not save attendance.");
  };

  const handleSaveCalendarEvent = async (event: CalendarEvent) => {
    const ok = await dbSaveCalendarEvent(event);
    if (ok) notifyCourse(event.courseId, "reminder", `New session: ${event.title}`, `${event.type} on ${event.date} at ${event.time}${event.venue ? ` · ${event.venue}` : ""}.`, false);
    await loadDatabase();
    if (ok) toast.success("Session scheduled");
    else toast.error("Could not schedule session.");
  };

  const handleDeleteCalendarEvent = async (id: string) => {
    const ok = await dbDeleteCalendarEvent(id);
    await loadDatabase();
    if (ok) toast.success("Session removed");
    else toast.error("Could not remove session.");
  };

  const handleUpdateCertificateStatus = async (cert: Certificate, status: Certificate["status"]) => {
    const ok = await dbSaveCertificate({ ...cert, status });
    if (ok) logAudit(status === "Revoked" ? "certificate.revoked" : "certificate.reissued", "certificate", cert.id, `${cert.learnerName} · ${cert.courseTitle}`);
    await loadDatabase();
    if (ok) toast.success(status === "Revoked" ? "Certificate revoked" : "Certificate reissued");
    else toast.error("Could not update certificate.");
  };

  const handleSaveContent = async (item: Partial<ContentItem>) => {
    const ok = await dbSaveContent(item);
    await loadDatabase();
    if (ok) toast.success("Content saved");
    else toast.error("Could not save content.");
  };

  const handleDeleteContent = async (id: string) => {
    const ok = await dbDeleteContent(id);
    await loadDatabase();
    if (ok) toast.success("Content deleted");
    else toast.error("Could not delete content.");
  };

  const handleSavePromo = async (promo: Partial<PromoCode>) => {
    const ok = await dbSavePromo(promo);
    await loadDatabase();
    if (ok) toast.success(`Promo code ${promo.code} saved`);
    else toast.error("Could not save promo code.");
  };

  const handleSaveSurvey = async (survey: Survey) => {
    const ok = await dbSaveSurvey(survey);
    if (ok) notifyCourse(survey.courseId, "reminder", `New survey: ${survey.title}`, `Please share your feedback for ${survey.courseTitle}.`, false);
    await loadDatabase();
    if (ok) toast.success(`Survey "${survey.title}" published`);
    else toast.error("Could not save survey.");
  };

  const handleSubmitSurvey = async (survey: Survey, ratings: number[], comment: string) => {
    const learnerEmail = profile?.email || user?.email || "";
    const learnerName = profile?.full_name || "Learner";
    const resp: SurveyResponse = {
      id: "sresp-" + Date.now().toString(36),
      surveyId: survey.id,
      courseId: survey.courseId,
      learnerEmail,
      learnerName,
      ratings,
      comment,
      submittedAt: new Date().toISOString(),
    };
    const ok = await dbSaveSurveyResponse(resp);
    await loadDatabase();
    if (ok) toast.success("Thanks for your feedback!");
    else toast.error("Could not submit feedback.");
  };

  // Fire-and-forget in-app notification (targeted to a learner, or broadcast).
  const notify = (
    type: Notification["type"],
    title: string,
    body: string,
    learnerEmail?: string
  ) => {
    const n: Notification = {
      id: "notif-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      type,
      title,
      body,
      read: false,
      createdAt: new Date().toISOString(),
      learnerEmail,
    };
    void dbSaveNotification(n);
  };

  // Dual-channel: in-app notification + email to one learner.
  const notifyOne = (email: string, type: Notification["type"], title: string, body: string, withEmail = true) => {
    if (!email) return;
    notify(type, title, body, email);
    if (withEmail) {
      const mail = notificationEmail(title, body);
      void dbSendEmail(email, mail.subject, mail.html);
    }
  };

  // Fan out to every learner enrolled in a course.
  const notifyCourse = (courseId: string, type: Notification["type"], title: string, body: string, withEmail = false) => {
    enrollments.filter((e) => e.courseId === courseId).forEach((e) => notifyOne(e.learnerEmail, type, title, body, withEmail));
  };

  const handleMarkNotifRead = async (id: string) => {
    await dbMarkNotificationRead(id);
    await loadDatabase();
  };
  const handleMarkAllNotifsRead = async () => {
    const email = profile?.email || user?.email;
    if (email) { await dbMarkAllNotificationsRead(email); await loadDatabase(); }
  };

  const handleSubmitAssignment = async (
    assignmentId: string,
    courseId: string,
    content: string,
    fileUrl?: string
  ) => {
    const learnerEmail = profile?.email || user?.email || "";
    const learnerName = profile?.full_name || "Learner";
    const submission: AssignmentSubmission = {
      id: "sub-" + Date.now().toString(36),
      assignmentId,
      courseId,
      learnerEmail,
      learnerName,
      submittedAt: new Date().toISOString(),
      content: fileUrl ? `${content}\n\nAttached file: ${fileUrl}` : content,
      score: null,
      feedback: "",
      status: "Submitted",
    };
    const ok = await dbSaveAssignmentSubmission(submission);
    await loadDatabase();
    if (ok) toast.success("Assignment submitted");
    else toast.error("Could not submit assignment.");
  };

  const handleUpdatePaymentStatus = async (id: string, status: Transaction["status"]) => {
    // In a real implementation this would update Supabase. For demo, we update state locally if it's not implemented in db.ts
    setTransactions(txns => txns.map(t => t.id === id ? { ...t, status } : t));
  };

  // Verification redirects
  const handleVerifyLink = (certId: string) => {
    setActiveVerifyId(certId);
    navigate("/verify");
  };

  // Helper to map current location pathname to the old "currentView" string for Navbar active state
  const getCurrentViewString = (): View => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path.startsWith("/courses")) return "courses";
    if (path.startsWith("/corporate")) return "corporate";
    if (path.startsWith("/applications")) return "applications";
    if (path.startsWith("/learn")) return "learner";
    if (path.startsWith("/facilitator")) return "facilitator";
    if (path.startsWith("/organization")) return "organization";
    if (path.startsWith("/admin")) return "admin";
    if (path.startsWith("/verify")) return "verify";
    if (path.startsWith("/about")) return "about";
    if (path.startsWith("/certification")) return "certification";
    if (path.startsWith("/resources")) return "resources";
    if (path.startsWith("/contact")) return "contact";
    if (path.startsWith("/calendar")) return "calendar";
    if (path.startsWith("/pathways")) return "pathways";
    return "home";
  };

  // Map a role to the dashboard it is allowed to see.
  const roleHome = (role?: string): string => {
    if (role === "admin" || role === "super_admin") return "/admin";
    if (role === "facilitator") return "/facilitator";
    if (role === "organization") return "/organization";
    return "/learn";
  };

  // Guard a role-restricted dashboard route:
  //  - signed out  → show that portal's login
  //  - profile still resolving → show the loading screen (prevents mis-routing)
  //  - wrong role  → redirect to the user's OWN dashboard
  //  - correct role → render the dashboard
  const guardDashboard = (
    allowed: string[],
    portalRole: "learner" | "facilitator" | "admin" | "organization",
    dashboard: React.ReactNode
  ): React.ReactNode => {
    if (!user) {
      return <Login portalRole={portalRole} onNavigate={navigateToView} onSuccess={() => {}} />;
    }
    if (!profile) {
      return <LoadingScreen message="Loading your profile…" />;
    }
    if (allowed.includes(profile.role)) {
      return dashboard;
    }
    return <Navigate to={roleHome(profile.role)} replace />;
  };

  const renderRoutes = () => {
    if (loading || authLoading) {
      return <LoadingScreen />;
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

    return (
      <Routes>
        <Route path="/" element={
          <Home
            courses={courses}
            thematicAreas={courses.reduce((acc: any[], curr) => {
              if (!acc.some((a) => a.name === curr.thematicArea)) {
                acc.push({ id: curr.id, name: curr.thematicArea, summary: curr.shortDescription, audience: curr.audience[0] });
              }
              return acc;
            }, [])}
            onNavigate={navigateToView}
            onOpenCourse={handleOpenCourse}
            onAddLead={handleAddLead}
          />
        } />
        
        <Route path="/courses" element={
          selectedCourse ? (
            <CourseDetail
              course={selectedCourse}
              reviews={reviews.filter((r) => r.courseId === selectedCourse.id)}
              currentUserEmail={profile?.email || user?.email || ""}
              canReview={enrollments.some((e) => e.courseId === selectedCourse.id && e.learnerEmail === (profile?.email || user?.email))}
              onSaveReview={handleSaveReview}
              onBack={() => { setSelectedCourse(null); navigate("/courses"); }}
              onEnrol={() => {
                if (!user) {
                  toast.error("Please sign in as a learner to enrol.");
                  navigate("/learn");
                  return;
                }
                if (profile?.role !== "learner") {
                  toast.error("Switch to a learner account to enrol in courses.");
                  return;
                }
                if (!user.email_confirmed_at) {
                  toast.error("Please verify your email before enrolling — check your inbox for the confirmation link.");
                  return;
                }
                if (selectedCourse) void dbLogEvent("checkout_start", selectedCourse.id, profile?.email || user?.email || undefined);
                setShowCheckout(true);
              }}
            />
          ) : (
            <Courses
              courses={courses}
              reviews={reviews}
              wishlist={wishlist}
              onToggleWishlist={handleToggleWishlist}
              onOpenCourse={handleOpenCourse}
              thematicAreas={Array.from(new Set(courses.map((c) => c.thematicArea)))}
            />
          )
        } />

        <Route path="/corporate" element={<Corporate thematicAreas={Array.from(new Set(courses.map((c) => c.thematicArea)))} />} />
        
        <Route path="/applications" element={<Applications />} />

        <Route path="/signup" element={<SignUp />} />

        <Route path="/about" element={<About onNavigate={navigateToView} />} />
        <Route path="/certification" element={<Certification onNavigate={navigateToView} />} />
        <Route path="/resources" element={<Resources onNavigate={navigateToView} content={content} />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/calendar" element={
          <LearningCalendar
            courses={courses}
            events={calendarEvents}
            onOpenCourse={handleOpenCourse}
            onNavigate={navigateToView}
          />
        } />
        <Route path="/pathways" element={
          <Pathways
            pathways={pathways}
            courses={courses}
            onOpenCourse={handleOpenCourse}
            onNavigate={navigateToView}
          />
        } />

        <Route path="/learn" element={guardDashboard(["learner"], "learner",
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
            surveys={surveys}
            surveyResponses={surveyResponses}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onOpenCourse={handleOpenCourse}
            discussions={discussions}
            onPostDiscussion={handleSaveDiscussion}
            onDeleteDiscussion={handleDeleteDiscussion}
            onMarkNotifRead={handleMarkNotifRead}
            onMarkAllNotifsRead={handleMarkAllNotifsRead}
            onOpenPlayer={(c, e) => setActivePlayer({ course: c, enrollment: e })}
            onOpenCertificate={setActiveCertificate}
            onTakeQuiz={handleTakeQuiz}
            onSubmitAssignment={handleSubmitAssignment}
            onSubmitSurvey={handleSubmitSurvey}
          />
        )} />

        <Route path="/facilitator" element={guardDashboard(["facilitator"], "facilitator",
          <FacilitatorDashboard
            courses={courses}
            enrollments={enrollments}
            assignments={facilitatorAssignments}
            courseAssignments={courseAssignments}
            submissions={submissions}
            announcements={announcements}
            calendarEvents={calendarEvents}
            quizzes={quizzes}
            quizAttempts={quizAttempts}
            surveys={surveys}
            surveyResponses={surveyResponses}
            onPostAnnouncement={handlePostAnnouncement}
            onGradeSubmission={handleGradeSubmission}
            onSaveQuiz={handleSaveQuiz}
            onSaveAssignment={handleSaveAssignment}
            onSaveSurvey={handleSaveSurvey}
            onSaveEvent={handleSaveCalendarEvent}
            onDeleteEvent={handleDeleteCalendarEvent}
            onSaveModules={handleUpdateCurriculum}
            attendance={attendance}
            onSaveAttendance={handleSaveAttendance}
            discussions={discussions}
            onPostDiscussion={handleSaveDiscussion}
            onDeleteDiscussion={handleDeleteDiscussion}
          />
        )} />

        <Route path="/organization" element={guardDashboard(["organization"], "organization",
          <OrganizationDashboard courses={courses} />
        )} />

        <Route path="/admin" element={guardDashboard(["admin", "super_admin"], "admin",
          <AdminDashboard
            courses={courses}
            enrollments={enrollments}
            transactions={transactions}
            certificates={certificates}
            leads={leads}
            applications={applications}
            assets={assets}
            facilitators={facilitators}
            facilitatorAssignments={facilitatorAssignments}
            promos={promos}
            subscribers={subscribers}
            content={content}
            calendarEvents={calendarEvents}
            attendance={attendance}
            onSaveAttendance={handleSaveAttendance}
            pathways={pathways}
            onSavePathway={handleSavePathway}
            onDeletePathway={handleDeletePathway}
            onUpdateLeadStage={handleUpdateLeadStage}
            onUpdateAppStatus={handleUpdateAppStatus}
            onConvertApplicant={handleConvertApplicant}
            onUpdateCertificateStatus={handleUpdateCertificateStatus}
            onAddAsset={handleAddAsset}
            onAddCourse={handleAddCourse}
            onAssignFacilitator={handleAssignFacilitator}
            onRefreshData={loadDatabase}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
            onSavePromo={handleSavePromo}
            onBroadcast={handleBroadcast}
            onSaveContent={handleSaveContent}
            onDeleteContent={handleDeleteContent}
            onSaveEvent={handleSaveCalendarEvent}
            onDeleteEvent={handleDeleteCalendarEvent}
          />
        )} />

        <Route path="/verify" element={
          <Verify
            certificates={certificates}
            initialQuery={activeVerifyId}
            onOpenCertificate={setActiveCertificate}
          />
        } />

        <Route path="*" element={
          <div className="section text-center py-20">
            <h2 className="text-xl font-bold">404 - Workspace View Not Found</h2>
          </div>
        } />
      </Routes>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <Toaster position="top-right" />
      {/* Sticky header */}
      <Navbar
        currentView={getCurrentViewString()}
        onNavigate={(view) => {
          setSelectedCourse(null);
          setActiveVerifyId("");
          navigateToView(view);
        }}
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
        {renderRoutes()}
      </main>


      {/* Footer */}
      <Footer
        onNavigate={(view) => {
          setSelectedCourse(null);
          setActiveVerifyId("");
          navigateToView(view);
        }}
      />

      {/* Email 2FA gate (enabled via VITE_ENABLE_2FA; off by default) */}
      {TWO_FACTOR_ENABLED && user && profile && !twoFactorPassed && (
        <TwoFactorModal
          email={profile.email || user.email || ""}
          name={profile.full_name || "there"}
          onVerified={() => setTwoFactorPassed(true)}
          onCancel={async () => { await signOut(); setTwoFactorPassed(false); }}
        />
      )}

      {/* 1. Secure Card / Transfer Checkout Simulation Overlay */}
      {showCheckout && selectedCourse && (
        <CheckoutModal
          course={selectedCourse}
          learnerName={profile?.full_name || ""}
          learnerEmail={profile?.email || user?.email || ""}
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
