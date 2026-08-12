// ---------------------------------------------------------------------------
// Seed course materials THROUGH the real upload path — one PDF per lesson.
//
// For every lesson in every course, this generates a small sample PDF
// in-process (no libraries, no network) and uploads it into the Supabase
// `media` storage bucket exactly the way the facilitator/admin course editor
// does (storage.from('media').upload()), then attaches it to that lesson via
// modules[].lessonMaterials. Course- and module-level materials are left alone
// so facilitators/admins can add those on top.
//
// Run it once from your machine:
//
//   1. Ensure .env has VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
//   2. Provide an admin/facilitator login so uploads pass the bucket's
//      "authenticated" policy — the same as a real staff upload:
//
//        $env:SEED_ADMIN_EMAIL="admin@lani.test"; $env:SEED_ADMIN_PASSWORD="Admin123!"; npm run seed:materials
//
//      (Alternatively, set SUPABASE_SERVICE_ROLE_KEY to bypass RLS.)
//
// Safe + idempotent: lessons that already have a material are skipped, and the
// legacy shared course-level sample is cleared so materials become per-lesson.
// ---------------------------------------------------------------------------

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Minimal .env loader (avoids adding a dependency) ----------------------
function loadEnv() {
  const path = join(__dirname, "..", ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

if (!SUPABASE_URL) {
  console.error("Missing VITE_SUPABASE_URL (or SUPABASE_URL).");
  process.exit(1);
}

const MAX_BYTES = 5 * 1024 * 1024; // mirror the app's 5MB ceiling
const STORAGE_MARKER = "/storage/v1/object/public/media/";
// Names/urls used by earlier course-level sample seeding, so we can clear them.
const LEGACY_SAMPLE_NAMES = new Set(["Course Handbook.pdf", "Session Slides.pdf", "Study Guide.pdf"]);
const LEGACY_SAMPLE_HOSTS = ["w3.org", "mozilla.github.io"];

// --- Minimal, dependency-free PDF generator --------------------------------
// Builds a valid single-page PDF with a title + body lines, computing correct
// xref byte offsets. Enough for a real, viewable/downloadable sample file.
function makePdf(title, bodyLines) {
  const esc = (s) => String(s).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  const content = [
    "BT",
    "/F1 20 Tf",
    "72 720 Td",
    `(${esc(title)}) Tj`,
    "/F1 12 Tf",
    "0 -40 Td",
    ...bodyLines.flatMap((line, i) => (i === 0 ? [`(${esc(line)}) Tj`] : ["0 -20 Td", `(${esc(line)}) Tj`])),
    "ET",
  ].join("\n");

  const objects = [
    "<</Type/Catalog/Pages 2 0 R>>",
    "<</Type/Pages/Kids[3 0 R]/Count 1>>",
    "<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>",
    `<</Length ${Buffer.byteLength(content, "latin1")}>>\nstream\n${content}\nendstream`,
    "<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(pdf, "latin1"));
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = Buffer.byteLength(pdf, "latin1");
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((off) => { pdf += `${String(off).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(pdf, "latin1");
}

// Is this course-level material_files just the old shared sample (safe to clear)?
function isLegacyCourseSample(files) {
  if (!Array.isArray(files) || files.length === 0) return false;
  return files.every(
    (f) =>
      LEGACY_SAMPLE_NAMES.has(f?.name) ||
      LEGACY_SAMPLE_HOSTS.some((h) => typeof f?.url === "string" && f.url.includes(h))
  );
}

async function main() {
  let supabase;
  if (SERVICE_KEY) {
    supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    console.log("• Authenticated with service-role key.");
  } else {
    if (!ANON_KEY) { console.error("Missing VITE_SUPABASE_ANON_KEY."); process.exit(1); }
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error("Provide SEED_ADMIN_EMAIL + SEED_ADMIN_PASSWORD (an admin/facilitator account),\nor set SUPABASE_SERVICE_ROLE_KEY.");
      process.exit(1);
    }
    supabase = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    if (error) { console.error("Sign-in failed:", error.message); process.exit(1); }
    console.log(`• Signed in as ${ADMIN_EMAIL} (uploads go through the authenticated path).`);
  }

  // Upload one generated PDF to the media bucket, mirroring dbUploadFile().
  async function uploadPdf(displayName, buf) {
    if (buf.byteLength > MAX_BYTES) {
      console.warn(`  ! skipping ${displayName}: exceeds 5MB limit`);
      return null;
    }
    const safe = displayName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
    const path = `course-materials/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
    const { error } = await supabase.storage.from("media").upload(path, buf, { cacheControl: "3600", upsert: false, contentType: "application/pdf" });
    if (error) throw new Error(`upload failed for ${displayName}: ${error.message}`);
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return { name: displayName, url: data.publicUrl };
  }

  const { data: courses, error: fetchErr } = await supabase.from("courses").select("id, title, modules, material_files");
  if (fetchErr) { console.error("Failed to read courses:", fetchErr.message); process.exit(1); }

  let coursesTouched = 0, lessonsSeeded = 0, lessonsSkipped = 0, courseSamplesCleared = 0;

  for (const course of courses) {
    const modules = Array.isArray(course.modules) ? course.modules : [];
    let changed = false;

    for (const mod of modules) {
      const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
      const lessonMaterials = mod.lessonMaterials && typeof mod.lessonMaterials === "object" ? mod.lessonMaterials : {};

      for (const lesson of lessons) {
        const existing = lessonMaterials[lesson];
        if (Array.isArray(existing) && existing.length > 0) { lessonsSkipped++; continue; }

        const pdf = makePdf(`${lesson}`, [
          `Lesson notes for "${lesson}".`,
          `Module: ${mod.title || "—"}`,
          `Course: ${course.title || course.id}`,
          "",
          "Sample material — replace with your real file",
          "from the facilitator or admin course editor.",
        ]);
        const up = await uploadPdf(`${lesson} — Notes.pdf`, pdf);
        if (up) {
          lessonMaterials[lesson] = [up];
          lessonsSeeded++;
          changed = true;
        }
      }
      mod.lessonMaterials = lessonMaterials;
    }

    const patch = {};
    if (changed) patch.modules = modules;
    // Clear the legacy shared course-level sample so materials are per-lesson.
    if (isLegacyCourseSample(course.material_files)) { patch.material_files = []; courseSamplesCleared++; }

    if (Object.keys(patch).length === 0) continue;

    const { error: upErr } = await supabase.from("courses").update(patch).eq("id", course.id);
    if (upErr) console.error(`  ✗ ${course.id}: ${upErr.message}`);
    else { coursesTouched++; console.log(`  ✓ ${course.title || course.id}`); }
  }

  console.log(`\nDone. Courses updated: ${coursesTouched}, lessons seeded: ${lessonsSeeded}, lessons already had materials: ${lessonsSkipped}, course-level samples cleared: ${courseSamplesCleared}.`);
  console.log("Each lesson now loads its own PDF from your Supabase storage; course/module PDFs added by staff appear on top.");
}

main().catch((e) => { console.error(e); process.exit(1); });
