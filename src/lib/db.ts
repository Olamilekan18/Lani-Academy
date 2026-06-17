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
} from "./types";

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

