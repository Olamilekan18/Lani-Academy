#!/usr/bin/env node
/**
 * check-schema-sync.mjs
 *
 * Guards against drift between the two representations of the database schema:
 *   - supabase_schema.sql          (the consolidated single-file schema)
 *   - supabase/migrations/*.sql    (the ordered migration chain)
 *
 * It extracts named schema objects (tables, policies, functions, triggers,
 * indexes) from every migration and checks each one also exists in the
 * consolidated file. Anything present in a migration but missing from
 * supabase_schema.sql is reported as drift and fails the check.
 *
 * No dependencies — run with:  node scripts/check-schema-sync.mjs
 * or:  npm run check:schema
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const consolidatedPath = join(root, "supabase_schema.sql");
const migrationsDir = join(root, "supabase", "migrations");

if (!existsSync(consolidatedPath)) {
  console.error(`✖ Missing consolidated schema: ${consolidatedPath}`);
  process.exit(1);
}
if (!existsSync(migrationsDir)) {
  console.error(`✖ Missing migrations directory: ${migrationsDir}`);
  process.exit(1);
}

// Strip SQL line comments so commented-out DDL isn't matched.
const stripComments = (sql) =>
  sql
    .split("\n")
    .map((line) => {
      const i = line.indexOf("--");
      return i === -1 ? line : line.slice(0, i);
    })
    .join("\n");

// Extract named objects from a SQL string. Returns a Set of "kind:name".
const extractObjects = (sql) => {
  const found = new Set();
  const patterns = [
    // CREATE TABLE [IF NOT EXISTS] public.name
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-z0-9_."]+)/gi, "table"],
    // CREATE POLICY "name" ON ...   (policy names scoped by the table too)
    [/create\s+policy\s+("[^"]+"|[a-z0-9_]+)\s+on\s+([a-z0-9_."]+)/gi, "policy"],
    // CREATE [OR REPLACE] FUNCTION public.name(
    [/create\s+(?:or\s+replace\s+)?function\s+([a-z0-9_."]+)\s*\(/gi, "function"],
    // CREATE TRIGGER name
    [/create\s+trigger\s+([a-z0-9_]+)/gi, "trigger"],
    // CREATE [UNIQUE] INDEX [IF NOT EXISTS] name
    [/create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?([a-z0-9_]+)/gi, "index"],
  ];
  const norm = (s) => s.replace(/"/g, "").replace(/^public\./, "").toLowerCase();
  for (const [re, kind] of patterns) {
    let m;
    while ((m = re.exec(sql)) !== null) {
      if (kind === "policy") {
        found.add(`policy:${norm(m[2])}.${norm(m[1])}`);
      } else {
        found.add(`${kind}:${norm(m[1])}`);
      }
    }
  }
  return found;
};

// Extract objects that the consolidated file explicitly DROPs (and does not
// re-create). These are intentionally removed/renamed, so a migration that
// created them is still reconciled — the current schema simply no longer has them.
const extractDropped = (sql) => {
  const dropped = new Set();
  const norm = (s) => s.replace(/"/g, "").replace(/^public\./, "").toLowerCase();
  const reDropPolicy = /drop\s+policy\s+(?:if\s+exists\s+)?("[^"]+"|[a-z0-9_]+)\s+on\s+([a-z0-9_."]+)/gi;
  let m;
  while ((m = reDropPolicy.exec(sql)) !== null) {
    dropped.add(`policy:${norm(m[2])}.${norm(m[1])}`);
  }
  return dropped;
};

const consolidatedSql = stripComments(readFileSync(consolidatedPath, "utf8"));
const consolidated = extractObjects(consolidatedSql);
const consolidatedDropped = extractDropped(consolidatedSql);
// An object that is dropped and NOT re-created is intentionally gone.
for (const o of consolidatedDropped) {
  if (!consolidated.has(o)) consolidated.add(o);
}

const migrationFiles = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

let drift = 0;
const missingByFile = {};

for (const file of migrationFiles) {
  const sql = stripComments(readFileSync(join(migrationsDir, file), "utf8"));
  const objects = extractObjects(sql);
  const missing = [...objects].filter((o) => !consolidated.has(o));
  if (missing.length) {
    missingByFile[file] = missing;
    drift += missing.length;
  }
}

const totalMigrationObjects = migrationFiles.reduce(
  (n, f) => n + extractObjects(stripComments(readFileSync(join(migrationsDir, f), "utf8"))).size,
  0
);

if (drift === 0) {
  console.log(
    `✓ Schema in sync — all ${totalMigrationObjects} objects across ${migrationFiles.length} migrations are present in supabase_schema.sql`
  );
  process.exit(0);
}

console.error("✖ Schema drift detected — these objects exist in migrations but NOT in supabase_schema.sql:\n");
for (const [file, missing] of Object.entries(missingByFile)) {
  console.error(`  ${file}`);
  for (const o of missing) console.error(`    - ${o}`);
}
console.error(
  "\nFix: fold the same statements into supabase_schema.sql so the consolidated file and the migration chain stay equivalent."
);
process.exit(1);
