import { supabase, isSupabaseConfigured } from "./supabase";
import { courses as defaultCourses } from "../data/catalog";
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
  FacilitatorAssignment
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

// Upload a file to the public "media" storage bucket and return its public URL.
export async function dbUploadFile(file: File, folder = "assets"): Promise<string | null> {
  if (!supabase) return null;
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
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
  const { error } = await supabase.from("assignment_submissions").upsert(toSnakeCaseKeys(submission));
  if (error) console.error("Error saving assignment submission:", error.message);
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

