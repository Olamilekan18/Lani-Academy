import { supabase, isSupabaseConfigured } from "./supabase";
import { courses as defaultCourses, initialSmes } from "../data/catalog";
import type {
  Course,
  Enrollment,
  Transaction,
  Certificate,
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
  Sme,
  AnalyticsEvent,
  CourseReview,
  LessonNote,
  AuditLog
} from "./types";
import {
  mockQuizzes,
  mockQuizAttempts,
  mockAssignments,
  mockSubmissions,
  mockAnnouncements,
  mockCalendarEvents,
  mockNotifications,
  mockFacilitatorAssignments
} from "../data/mockLmsData";

// Helper to convert camelCase string to snake_case
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

// Helper to convert snake_case string to camelCase
function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

// Recursively convert object keys to snake_case
export function toSnakeCaseKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCaseKeys);
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc: any, key) => {
      const snakeKey = camelToSnake(key);
      acc[snakeKey] = toSnakeCaseKeys(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

// Recursively convert object keys to camelCase
export function toCamelCaseKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCaseKeys);
  }
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.keys(obj).reduce((acc: any, key) => {
      const camelKey = snakeToCamel(key);
      acc[camelKey] = toCamelCaseKeys(obj[key]);
      return acc;
    }, {});
  }
  return obj;
}

// Helper to check if tables exist by querying them
async function checkTableExists(table: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from(table).select("count", { count: "exact", head: true });
  if (error && error.code === "PGRST205") {
    return false; // Table does not exist
  }
  return true;
}

// Seeding function to populate tables if they are empty
export async function seedDatabase(): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn("Supabase not configured, skipping seed");
    return false;
  }

  try {
    // Check if courses table is accessible and has data
    const { data: existingCourses, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .limit(1);

    if (courseError) {
      console.warn("Error checking courses for seed. Schema might not be loaded yet:", courseError.message);
      return false;
    }

    if (!existingCourses || existingCourses.length === 0) {
      console.log("Seeding default courses to Supabase...");
      const snakeCourses = toSnakeCaseKeys(defaultCourses);
      const { error: seedError } = await supabase.from("courses").insert(snakeCourses);
      if (seedError) {
        console.error("Failed to seed courses:", seedError.message);
        return false;
      }
      console.log("Default courses seeded successfully!");
    } else {
      console.log("Courses already populated, skipping seed.");
    }

    // Seed LMS Extended Features
    const { data: exQuizzes } = await supabase.from("quizzes").select("id").limit(1);
    if (!exQuizzes || exQuizzes.length === 0) {
      console.log("Seeding LMS features (Quizzes, Assignments, etc.)...");
      await supabase.from("quizzes").insert(toSnakeCaseKeys(mockQuizzes));
      await supabase.from("quiz_attempts").insert(toSnakeCaseKeys(mockQuizAttempts));
      await supabase.from("assignments").insert(toSnakeCaseKeys(mockAssignments));
      await supabase.from("assignment_submissions").insert(toSnakeCaseKeys(mockSubmissions));
      await supabase.from("announcements").insert(toSnakeCaseKeys(mockAnnouncements));
      await supabase.from("calendar_events").insert(toSnakeCaseKeys(mockCalendarEvents));
      await supabase.from("notifications").insert(toSnakeCaseKeys(mockNotifications));
      await supabase.from("facilitator_assignments").insert(toSnakeCaseKeys(mockFacilitatorAssignments));
    }

    // Seed default Subject Matter Experts if none exist yet.
    const { data: exSmes, error: smeErr } = await supabase.from("smes").select("id").limit(1);
    if (!smeErr && (!exSmes || exSmes.length === 0)) {
      console.log("Seeding default Subject Matter Experts...");
      await supabase.from("smes").insert(toSnakeCaseKeys(initialSmes));
    }

    return true;
  } catch (err) {
    console.error("Database seeding exception:", err);
    return false;
  }
}

// Courses Queries
export async function dbGetCourses(): Promise<Course[]> {
  if (!supabase) return defaultCourses;
  const { data, error } = await supabase.from("courses").select("*");
  if (error) {
    console.error("Error fetching courses:", error.message);
    return defaultCourses;
  }
  return toCamelCaseKeys(data) as Course[];
}

// Update specific columns on an existing course. Uses UPDATE (not upsert) so
// it works under the facilitator "update assigned courses" RLS policy.
export async function dbUpdateCourse(id: string, patch: Partial<Course>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("courses").update(toSnakeCaseKeys(patch)).eq("id", id);
  if (error) console.error("Error updating course:", error.message);
  return !error;
}

export async function dbSaveCourse(course: Partial<Course>): Promise<boolean> {
  if (!supabase) return false;
  const snakeCourse = toSnakeCaseKeys(course);
  const { error } = await supabase.from("courses").upsert(snakeCourse);
  if (error) {
    console.error("Error saving course:", error.message);
    return false;
  }
  return true;
}

// Enrollments Queries
export async function dbGetEnrollments(): Promise<Enrollment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("enrollments").select("*");
  if (error) {
    console.error("Error fetching enrollments:", error.message);
    return [];
  }
  return toCamelCaseKeys(data) as Enrollment[];
}

export async function dbSaveEnrollment(enrollment: Enrollment): Promise<boolean> {
  if (!supabase) return false;
  const snakeEnrollment = toSnakeCaseKeys(enrollment);
  const { error } = await supabase.from("enrollments").upsert(snakeEnrollment);
  if (error) {
    console.error("Error saving enrollment:", error.message);
    return false;
  }
  return true;
}

// Transactions Queries
export async function dbGetTransactions(): Promise<Transaction[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("transactions").select("*");
  if (error) {
    console.error("Error fetching transactions:", error.message);
    return [];
  }
  return toCamelCaseKeys(data) as Transaction[];
}

export async function dbSaveTransaction(transaction: Transaction): Promise<boolean> {
  if (!supabase) return false;
  const snakeTransaction = toSnakeCaseKeys(transaction);
  const { error } = await supabase.from("transactions").insert(snakeTransaction);
  if (error) {
    console.error("Error saving transaction:", error.message);
    return false;
  }
  return true;
}

// Admin-only: persist a payment/transaction status change (e.g. Manually
// Confirmed, Refunded). Relies on the "Admins can do everything" RLS policy.
export async function dbUpdateTransactionStatus(id: string, status: Transaction["status"]): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("transactions").update({ status }).eq("id", id);
  if (error) {
    console.error("Error updating transaction status:", error.message);
    return false;
  }
  return true;
}

// Admin-only: update an enrollment's paymentStatus (e.g. when confirming or
// denying a bank transfer). Relies on admin RLS policy.
export async function dbUpdateEnrollmentPaymentStatus(
  courseId: string,
  learnerEmail: string,
  paymentStatus: "Successful" | "Pending" | "Manual Review"
): Promise<boolean> {
  if (!supabase || !courseId || !learnerEmail) return false;
  const { error } = await supabase
    .from("enrollments")
    .update({ payment_status: paymentStatus })
    .eq("course_id", courseId)
    .ilike("learner_email", learnerEmail.trim());
  if (error) {
    console.error("Error updating enrollment payment status:", error.message);
    return false;
  }
  return true;
}

// Certificates Queries
export async function dbGetCertificates(): Promise<Certificate[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("certificates").select("*");
  if (error) {
    console.error("Error fetching certificates:", error.message);
    return [];
  }
  return toCamelCaseKeys(data) as Certificate[];
}

export async function dbSaveCertificate(certificate: Certificate): Promise<boolean> {
  if (!supabase) return false;
  const snakeCertificate = toSnakeCaseKeys(certificate);
  const { error } = await supabase.from("certificates").upsert(snakeCertificate);
  if (error) {
    console.error("Error saving certificate:", error.message);
    return false;
  }
  return true;
}

// Corporate Leads Queries
export async function dbGetLeads(): Promise<CorporateLead[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("corporate_leads").select("*");
  if (error) {
    console.error("Error fetching corporate leads:", error.message);
    return [];
  }
  return toCamelCaseKeys(data) as CorporateLead[];
}

export async function dbSaveLead(lead: CorporateLead): Promise<boolean> {
  if (!supabase) return false;
  const snakeLead = toSnakeCaseKeys(lead);
  const { error } = await supabase.from("corporate_leads").insert(snakeLead);
  if (error) {
    console.error("Error saving corporate lead:", error.message);
    return false;
  }
  return true;
}

export async function dbUpdateLeadStage(id: string, stage: CorporateLead["stage"]): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("corporate_leads").update({ stage }).eq("id", id);
  if (error) {
    console.error("Error updating lead stage:", error.message);
    return false;
  }
  return true;
}

// Programme Applications Queries
export async function dbGetApplications(): Promise<ProgrammeApplication[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("programme_applications").select("*");
  if (error) {
    console.error("Error fetching applications:", error.message);
    return [];
  }
  return toCamelCaseKeys(data) as ProgrammeApplication[];
}

export async function dbSaveApplication(application: ProgrammeApplication): Promise<boolean> {
  if (!supabase) return false;
  const snakeApp = toSnakeCaseKeys(application);
  const { error } = await supabase.from("programme_applications").insert(snakeApp);
  if (error) {
    console.error("Error saving application:", error.message);
    return false;
  }
  return true;
}

export async function dbUpdateApplicationStatus(id: string, status: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("programme_applications").update({ status }).eq("id", id);
  if (error) {
    console.error("Error updating application status:", error.message);
    return false;
  }
  return true;
}

// CMS Assets Queries
export async function dbGetAssets(): Promise<CmsAsset[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("cms_assets").select("*");
  if (error) {
    console.error("Error fetching assets:", error.message);
    return [];
  }
  return toCamelCaseKeys(data) as CmsAsset[];
}

// Send a transactional email via the send-email Edge Function.
// Fails silently (returns false) so email problems never block the app flow.
export async function dbSendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!supabase || !to) return false;
  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html },
    });
    if (error) {
      console.warn("Email not sent:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Email function unavailable:", e);
    return false;
  }
}

// Verifies a payment server-side against the gateway (via the verify-payment
// Edge Function, which holds the secret key). Never trust the client callback
// alone. Returns { verified, configured, amount?, reason? }.
export interface PaymentVerification {
  verified: boolean;
  configured: boolean;
  amount?: number;
  currency?: string;
  status?: string;
  reason?: string;
}

export async function dbVerifyPayment(
  gateway: "Paystack" | "Flutterwave" | "Bank Transfer",
  reference: string,
  expectedAmount?: number
): Promise<PaymentVerification> {
  // Bank transfers are confirmed manually by an admin, not via gateway API.
  if (gateway === "Bank Transfer") return { verified: false, configured: false, reason: "Manual confirmation" };
  if (!supabase) return { verified: false, configured: false, reason: "Supabase not configured" };
  try {
    const { data, error } = await supabase.functions.invoke("verify-payment", {
      body: { gateway, reference, expectedAmount },
    });
    if (error) {
      console.warn("Payment verification unavailable:", error.message);
      return { verified: false, configured: false, reason: error.message };
    }
    return data as PaymentVerification;
  } catch (e) {
    console.warn("Payment verification failed:", e);
    return { verified: false, configured: false, reason: String(e) };
  }
}

// Issues a completion certificate SERVER-SIDE (via the issue-certificate Edge
// Function, service role). Certificates are admin-only at the RLS level, so
// learners cannot self-insert; the function checks progress = 100% first.
export interface IssueCertResult {
  ok: boolean;
  certificate?: Certificate;
  alreadyIssued?: boolean;
  reason?: string;
}

export async function dbIssueCertificate(courseId: string): Promise<IssueCertResult> {
  if (!supabase) return { ok: false, reason: "Supabase not configured" };
  try {
    const { data, error } = await supabase.functions.invoke("issue-certificate", {
      body: { courseId },
    });
    if (error) return { ok: false, reason: error.message };
    const res = data as { ok: boolean; certificate?: unknown; alreadyIssued?: boolean; reason?: string };
    return {
      ok: res.ok,
      certificate: res.certificate ? (toCamelCaseKeys(res.certificate) as Certificate) : undefined,
      alreadyIssued: res.alreadyIssued,
      reason: res.reason,
    };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

// Creates the enrolment + transaction SERVER-SIDE (via the enroll Edge
// Function, service role) after verifying payment. This is the only path for a
// learner to enrol — the client can no longer insert enrolment rows directly.
export interface EnrollResult {
  ok: boolean;
  enrollment?: Enrollment;
  transaction?: Transaction;
  alreadyEnrolled?: boolean;
  reason?: string;
}

export interface BankTransferMeta {
  depositorName: string;
  sourceBank: string;
  transferReference?: string;
  receiptUrl?: string;
}

export async function dbEnroll(
  courseId: string,
  gateway: "Paystack" | "Flutterwave" | "Bank Transfer",
  reference?: string,
  bankMeta?: BankTransferMeta
): Promise<EnrollResult> {
  if (!supabase) return { ok: false, reason: "Supabase not configured" };
  try {
    const { data, error } = await supabase.functions.invoke("enroll", {
      body: { courseId, gateway, reference, bankMeta },
    });
    if (error) {
      // Try to surface the function's JSON error message when present.
      let reason = error.message;
      try {
        const ctx = (error as { context?: { json?: () => Promise<{ reason?: string }> } }).context;
        const body = ctx?.json ? await ctx.json() : undefined;
        if (body?.reason) reason = body.reason;
      } catch { /* ignore */ }
      return { ok: false, reason };
    }
    const res = data as { ok: boolean; enrollment?: unknown; transaction?: unknown; alreadyEnrolled?: boolean; reason?: string };
    return {
      ok: res.ok,
      enrollment: res.enrollment ? (toCamelCaseKeys(res.enrollment) as Enrollment) : undefined,
      transaction: res.transaction ? (toCamelCaseKeys(res.transaction) as Transaction) : undefined,
      alreadyEnrolled: res.alreadyEnrolled,
      reason: res.reason,
    };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

// Sends a fixed, server-rendered template. Safe for unauthenticated flows
// (public contact/lead forms) because the content can't be attacker-controlled.
// Allowed templates: "welcome", "lead_ack", "otp".
export async function dbSendTemplateEmail(
  to: string,
  template: "welcome" | "lead_ack" | "otp",
  data: Record<string, unknown>
): Promise<boolean> {
  if (!supabase || !to) return false;
  try {
    const { error } = await supabase.functions.invoke("send-email", {
      body: { to, template, data },
    });
    if (error) {
      console.warn("Template email not sent:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("Email function unavailable:", e);
    return false;
  }
}

// Upload a file to the public "media" storage bucket and return its public URL.
// Maximum allowed upload size across the whole app.
export const MAX_UPLOAD_MB = 5;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
// Videos get a larger ceiling.
export const MAX_VIDEO_MB = 20;
export const MAX_VIDEO_BYTES = MAX_VIDEO_MB * 1024 * 1024;

/**
 * Client-side upload validation. Returns a human-readable error string if the
 * file is invalid (too large / dangerous type), or null if it's acceptable.
 * Use this in the UI to give friendly feedback before calling dbUploadFile.
 * Pass `maxBytes` to override the default 5MB ceiling (e.g. for videos).
 */
export function validateUpload(file: File, allowedTypes?: string[], maxBytes: number = MAX_UPLOAD_BYTES): string | null {
  if (file.size > maxBytes) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    const limitMb = Math.round(maxBytes / (1024 * 1024));
    return `File is too large (${mb}MB). Maximum upload size is ${limitMb}MB.`;
  }
  const ext = (file.name.includes(".") ? file.name.split(".").pop() || "" : "").toLowerCase();
  const dangerousExts = ["html", "htm", "svg", "js", "mjs", "php", "sh", "exe", "cmd", "bat", "vbs", "jar", "py"];
  if (dangerousExts.includes(ext)) return "This file type is not allowed.";
  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some((type) =>
      type.endsWith("/*") ? file.type.startsWith(type.slice(0, -1)) : file.type === type
    );
    if (!isAllowed) return "This file type is not accepted for this field.";
  }
  return null;
}

export async function dbUploadFile(file: File, folder = "assets", allowedTypes?: string[], maxBytes: number = MAX_UPLOAD_BYTES): Promise<string | null> {
  if (!supabase) return null;

  // Enforce the upload ceiling (5MB by default, larger for videos).
  if (file.size > maxBytes) {
    console.error(`Upload blocked: file exceeds ${Math.round(maxBytes / (1024 * 1024))}MB limit`, file.size);
    return null;
  }

  // Block dangerous executable/script extensions
  const ext = (file.name.includes(".") ? file.name.split(".").pop() || "" : "").toLowerCase();
  const dangerousExts = ["html", "htm", "svg", "js", "mjs", "php", "sh", "exe", "cmd", "bat", "vbs", "jar", "py"];
  if (dangerousExts.includes(ext)) {
    console.error("Upload blocked: dangerous file extension", ext);
    return null;
  }

  if (allowedTypes && allowedTypes.length > 0) {
    const isAllowed = allowedTypes.some(type => {
      if (type.endsWith("/*")) return file.type.startsWith(type.slice(0, -1));
      return file.type === type;
    });
    if (!isAllowed) {
      console.error("Upload blocked: unallowed file type", file.type);
      return null;
    }
  }

  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) {
    console.error("Error uploading file:", error.message);
    return null;
  }
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

export async function dbSaveAsset(asset: CmsAsset): Promise<boolean> {
  if (!supabase) return false;
  const snakeAsset = toSnakeCaseKeys(asset);
  const { error } = await supabase.from("cms_assets").insert(snakeAsset);
  if (error) {
    console.error("Error saving asset:", error.message);
    return false;
  }
  return true;
}

export async function dbUpdateEnrollmentProgress(
  id: string,
  completedLessons: string[],
  progress: number
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from("enrollments")
    .update({
      completed_lessons: completedLessons,
      progress: progress,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating enrollment progress:", error.message);
    return false;
  }
  return true;
}

// ─── NEW LMS ENTITIES ───────────────────────────────────────────────────────

export async function dbGetQuizzes(): Promise<Quiz[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("quizzes").select("*");
  return toCamelCaseKeys(data || []) as Quiz[];
}

export async function dbGetQuizAttempts(): Promise<QuizAttempt[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("quiz_attempts").select("*");
  return toCamelCaseKeys(data || []) as QuizAttempt[];
}

export async function dbSaveQuizAttempt(attempt: QuizAttempt): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("quiz_attempts").upsert(toSnakeCaseKeys(attempt));
  if (error) console.error("Error saving quiz attempt:", error.message);
  return !error;
}

// Create or update a quiz (facilitators/admins). questions is stored as JSONB.
export async function dbSaveQuiz(quiz: Quiz): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("quizzes").upsert(toSnakeCaseKeys(quiz));
  if (error) console.error("Error saving quiz:", error.message);
  return !error;
}

// Create or update an assignment (facilitators/admins).
export async function dbSaveAssignment(assignment: Assignment): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("assignments").upsert(toSnakeCaseKeys(assignment));
  if (error) console.error("Error saving assignment:", error.message);
  return !error;
}

// Insert an in-app notification. Pass learnerEmail to target a specific
// learner, or leave undefined for a broadcast.
export async function dbSaveNotification(notification: Notification): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("notifications").insert(toSnakeCaseKeys(notification));
  if (error) console.error("Error saving notification:", error.message);
  return !error;
}

export async function dbMarkNotificationRead(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  return !error;
}

export async function dbMarkAllNotificationsRead(email: string): Promise<boolean> {
  if (!supabase || !email) return false;
  const { error } = await supabase.from("notifications").update({ read: true }).eq("learner_email", email).eq("read", false);
  return !error;
}

// ── Promo codes ─────────────────────────────────────────────
export async function dbGetPromos(): Promise<PromoCode[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("promo_codes").select("*").order("created_at", { ascending: false });
  return toCamelCaseKeys(data || []) as PromoCode[];
}

export async function dbSavePromo(promo: Partial<PromoCode>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("promo_codes").upsert(toSnakeCaseKeys(promo));
  if (error) console.error("Error saving promo:", error.message);
  return !error;
}

// Validate a promo code; returns the discount percent or null if invalid.
export async function dbValidatePromo(code: string): Promise<{ code: string; discountPercent: number } | null> {
  if (!supabase || !code.trim()) return null;
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error || !data) return null;
  const p = toCamelCaseKeys(data) as PromoCode;
  if (!p.active) return null;
  if (p.expiresAt && new Date(p.expiresAt) < new Date()) return null;
  if (p.maxUses && p.maxUses > 0 && p.uses >= p.maxUses) return null;
  return { code: p.code, discountPercent: p.discountPercent };
}

// ── Wishlist ────────────────────────────────────────────────
export async function dbGetWishlist(email: string): Promise<string[]> {
  if (!supabase || !email) return [];
  const { data } = await supabase.from("wishlists").select("course_id").eq("learner_email", email);
  return (data || []).map((r: any) => r.course_id as string);
}

export async function dbAddWishlist(email: string, courseId: string): Promise<boolean> {
  if (!supabase || !email) return false;
  const { error } = await supabase.from("wishlists").insert({ learner_email: email, course_id: courseId });
  return !error;
}

export async function dbRemoveWishlist(email: string, courseId: string): Promise<boolean> {
  if (!supabase || !email) return false;
  const { error } = await supabase.from("wishlists").delete().eq("learner_email", email).eq("course_id", courseId);
  return !error;
}

// ── Content (articles + downloadable resources) ─────────────
export async function dbGetContent(): Promise<ContentItem[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("content").select("*").order("created_at", { ascending: false });
  return toCamelCaseKeys(data || []) as ContentItem[];
}

export async function dbSaveContent(item: Partial<ContentItem>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("content").upsert(toSnakeCaseKeys(item));
  if (error) console.error("Error saving content:", error.message);
  return !error;
}

export async function dbDeleteContent(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("content").delete().eq("id", id);
  if (error) console.error("Error deleting content:", error.message);
  return !error;
}

// ── Newsletter ──────────────────────────────────────────────
export async function dbGetNewsletterSubscribers(): Promise<string[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("newsletter_subscribers").select("email");
  return (data || []).map((r: any) => r.email as string);
}

export async function dbSubscribeNewsletter(email: string): Promise<boolean> {
  if (!supabase || !email) return false;
  const { error } = await supabase.from("newsletter_subscribers").upsert({ email: email.trim().toLowerCase() });
  if (error) console.error("Error subscribing:", error.message);
  return !error;
}

// ── Surveys ─────────────────────────────────────────────────
export async function dbGetSurveys(): Promise<Survey[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("surveys").select("*");
  return toCamelCaseKeys(data || []) as Survey[];
}

export async function dbSaveSurvey(survey: Survey): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("surveys").upsert(toSnakeCaseKeys(survey));
  if (error) console.error("Error saving survey:", error.message);
  return !error;
}

export async function dbGetSurveyResponses(): Promise<SurveyResponse[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("survey_responses").select("*");
  return toCamelCaseKeys(data || []) as SurveyResponse[];
}

export async function dbSaveSurveyResponse(resp: SurveyResponse): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("survey_responses").insert(toSnakeCaseKeys(resp));
  if (error) console.error("Error saving survey response:", error.message);
  return !error;
}

export async function dbGetAssignments(): Promise<Assignment[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("assignments").select("*");
  return toCamelCaseKeys(data || []) as Assignment[];
}

export async function dbGetAssignmentSubmissions(): Promise<AssignmentSubmission[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("assignment_submissions").select("*");
  return toCamelCaseKeys(data || []) as AssignmentSubmission[];
}

export async function dbSaveAssignmentSubmission(submission: AssignmentSubmission): Promise<boolean> {
  if (!supabase) return false;
  // Learners use this to insert new submissions.
  const { error } = await supabase.from("assignment_submissions").insert(toSnakeCaseKeys(submission));
  if (error) console.error("Error saving assignment submission:", error.message);
  return !error;
}

export async function dbUpdateAssignmentSubmission(id: string, updates: Partial<AssignmentSubmission>): Promise<boolean> {
  if (!supabase) return false;
  // Facilitators use this to grade/update existing submissions (avoids INSERT RLS checks)
  const { error } = await supabase.from("assignment_submissions").update(toSnakeCaseKeys(updates)).eq("id", id);
  if (error) console.error("Error updating assignment submission:", error.message);
  return !error;
}

export async function dbGetAnnouncements(): Promise<Announcement[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
  return toCamelCaseKeys(data || []) as Announcement[];
}

export async function dbSaveAnnouncement(ann: Announcement): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("announcements").upsert(toSnakeCaseKeys(ann));
  if (error) console.error("Error saving announcement:", error.message);
  return !error;
}

export async function dbGetCalendarEvents(): Promise<CalendarEvent[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("calendar_events").select("*");
  return toCamelCaseKeys(data || []) as CalendarEvent[];
}

// Fire-and-forget analytics event (view / checkout_start / checkout_complete)
export async function dbLogEvent(type: AnalyticsEvent["type"], courseId?: string, learnerEmail?: string): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("analytics_events").insert({ type, course_id: courseId ?? null, learner_email: learnerEmail ?? null });
  } catch { /* analytics must never block the app */ }
}

export async function dbGetAnalyticsEvents(): Promise<AnalyticsEvent[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("analytics_events").select("*").order("created_at", { ascending: false }).limit(5000);
  return toCamelCaseKeys(data || []) as AnalyticsEvent[];
}

export async function dbGetPathways(): Promise<Pathway[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("pathways").select("*").order("created_at", { ascending: false });
  return toCamelCaseKeys(data || []) as Pathway[];
}

export async function dbSavePathway(pathway: Partial<Pathway>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("pathways").upsert(toSnakeCaseKeys(pathway));
  if (error) console.error("Error saving pathway:", error.message);
  return !error;
}

export async function dbDeletePathway(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("pathways").delete().eq("id", id);
  if (error) console.error("Error deleting pathway:", error.message);
  return !error;
}

// Subject Matter Experts
export async function dbGetSmes(): Promise<Sme[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("smes").select("*").order("created_at", { ascending: true });
  return toCamelCaseKeys(data || []) as Sme[];
}

export async function dbSaveSme(sme: Partial<Sme>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("smes").upsert(toSnakeCaseKeys(sme));
  if (error) console.error("Error saving SME:", error.message);
  return !error;
}

export async function dbDeleteSme(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("smes").delete().eq("id", id);
  if (error) console.error("Error deleting SME:", error.message);
  return !error;
}

export async function dbGetDiscussions(): Promise<DiscussionPost[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("discussions").select("*").order("created_at", { ascending: true });
  return toCamelCaseKeys(data || []) as DiscussionPost[];
}

export async function dbSaveDiscussion(post: DiscussionPost): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("discussions").insert(toSnakeCaseKeys(post));
  if (error) console.error("Error saving discussion:", error.message);
  return !error;
}

export async function dbDeleteDiscussion(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("discussions").delete().eq("id", id);
  if (error) console.error("Error deleting discussion:", error.message);
  return !error;
}

export async function dbGetAttendance(): Promise<AttendanceRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("attendance").select("*");
  return toCamelCaseKeys(data || []) as AttendanceRecord[];
}

export async function dbSaveAttendance(records: AttendanceRecord[]): Promise<boolean> {
  if (!supabase || records.length === 0) return false;
  const { error } = await supabase.from("attendance").upsert(records.map((r) => toSnakeCaseKeys(r)));
  if (error) console.error("Error saving attendance:", error.message);
  return !error;
}

export async function dbSaveCalendarEvent(event: CalendarEvent): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("calendar_events").upsert(toSnakeCaseKeys(event));
  if (error) console.error("Error saving calendar event:", error.message);
  return !error;
}

export async function dbDeleteCalendarEvent(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) console.error("Error deleting calendar event:", error.message);
  return !error;
}

export async function dbGetNotifications(): Promise<Notification[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false });
  return toCamelCaseKeys(data || []) as Notification[];
}

export async function dbGetFacilitatorAssignments(): Promise<FacilitatorAssignment[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("facilitator_assignments").select("*");
  return toCamelCaseKeys(data || []) as FacilitatorAssignment[];
}

export async function dbGetFacilitators(): Promise<{fullName: string, email: string}[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("profiles").select("full_name, email").eq("role", "facilitator");
  return toCamelCaseKeys(data || []) as {fullName: string, email: string}[];
}

export async function dbSaveFacilitatorAssignment(assignment: FacilitatorAssignment): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("facilitator_assignments").upsert(toSnakeCaseKeys(assignment));
  if (error) {
    console.error("Error saving facilitator assignment:", error.message);
    return false;
  }
  // Also update the course facilitator field
  const { error: cErr } = await supabase.from("courses").update({ facilitator: assignment.facilitatorName }).eq("id", assignment.courseId);
  if (cErr) console.warn("Could not update course facilitator field:", cErr.message);

  return true;
}

// ─── Course reviews ──────────────────────────────────────────
export async function dbGetReviews(): Promise<CourseReview[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("course_reviews").select("*").order("created_at", { ascending: false });
  return toCamelCaseKeys(data || []) as CourseReview[];
}

export async function dbSaveReview(review: Partial<CourseReview>): Promise<boolean> {
  if (!supabase) return false;
  // One review per learner per course — upsert on the (course_id, learner_email) unique key.
  const { error } = await supabase
    .from("course_reviews")
    .upsert(toSnakeCaseKeys(review), { onConflict: "course_id,learner_email" });
  if (error) console.error("Error saving review:", error.message);
  return !error;
}

export async function dbDeleteReview(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("course_reviews").delete().eq("id", id);
  if (error) console.error("Error deleting review:", error.message);
  return !error;
}

// ─── Lesson notes & bookmarks ────────────────────────────────
export async function dbGetNotes(learnerEmail: string): Promise<LessonNote[]> {
  if (!supabase || !learnerEmail) return [];
  const { data } = await supabase.from("lesson_notes").select("*").eq("learner_email", learnerEmail);
  return toCamelCaseKeys(data || []) as LessonNote[];
}

export async function dbSaveNote(note: Partial<LessonNote>): Promise<boolean> {
  if (!supabase) return false;
  const payload = { ...toSnakeCaseKeys(note), updated_at: new Date().toISOString() };
  const { error } = await supabase
    .from("lesson_notes")
    .upsert(payload, { onConflict: "learner_email,course_id,lesson_title" });
  if (error) console.error("Error saving note:", error.message);
  return !error;
}

export async function dbDeleteNote(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("lesson_notes").delete().eq("id", id);
  if (error) console.error("Error deleting note:", error.message);
  return !error;
}

// Look up a single certificate by ID (case-insensitive). Certificates are
// publicly readable, so this works for anonymous verification too.
export async function dbFindCertificate(id: string): Promise<Certificate | null> {
  if (!supabase || !id.trim()) return null;
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .ilike("id", id.trim())
    .maybeSingle();
  if (error) { console.error("Error verifying certificate:", error.message); return null; }
  return data ? (toCamelCaseKeys(data) as Certificate) : null;
}

// ─── Learner activity / streak ───────────────────────────────
// Record that the learner was active today (one row per day, idempotent).
export async function dbRecordActivity(learnerEmail: string): Promise<void> {
  if (!supabase || !learnerEmail) return;
  try {
    await supabase
      .from("learner_activity")
      .upsert(
        { learner_email: learnerEmail, activity_date: new Date().toISOString().slice(0, 10) },
        { onConflict: "learner_email,activity_date" }
      );
  } catch {
    /* activity tracking must never block the app */
  }
}

// Return the learner's active dates (YYYY-MM-DD), newest first.
export async function dbGetActivityDates(learnerEmail: string): Promise<string[]> {
  if (!supabase || !learnerEmail) return [];
  const { data } = await supabase
    .from("learner_activity")
    .select("activity_date")
    .eq("learner_email", learnerEmail)
    .order("activity_date", { ascending: false })
    .limit(400);
  return (data || []).map((r: any) => r.activity_date as string);
}

// ─── Audit log ───────────────────────────────────────────────
export async function dbGetAuditLogs(): Promise<AuditLog[]> {
  if (!supabase) return [];
  const { data } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(2000);
  return toCamelCaseKeys(data || []) as AuditLog[];
}

export async function dbLogAudit(entry: {
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
}): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("audit_logs").insert({
      actor_email: entry.actorEmail ?? null,
      actor_role: entry.actorRole ?? null,
      action: entry.action,
      target_type: entry.targetType ?? null,
      target_id: entry.targetId ?? null,
      detail: entry.detail ?? "",
    });
  } catch {
    /* auditing must never block the app */
  }
}

