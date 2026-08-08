# Contributing

## Database schema changes

The schema is stored in code in two equivalent places, and they must stay in sync:

1. **`supabase/migrations/*.sql`** — the ordered migration chain applied by
   `supabase db push`. This is what builds a fresh (or production) database.
2. **`supabase_schema.sql`** — the consolidated single-file schema for one-shot setup.

**When you change the schema, update both:**

- Add a **new dated migration** in `supabase/migrations/` (e.g.
  `20260630000000_my_change.sql`). Never edit an already-applied migration —
  add a new one. Keep statements idempotent (`IF NOT EXISTS`,
  `CREATE OR REPLACE`, `DROP ... IF EXISTS`).
- Fold the **same statements** into `supabase_schema.sql`.

Then verify they haven't drifted apart:

```bash
npm run check:schema
```

The check (`scripts/check-schema-sync.mjs`) extracts every named object
(tables, policies, functions, triggers, indexes) from the migrations and fails
if any is missing from `supabase_schema.sql`. Run it before committing schema
changes; it exits non-zero on drift so it can also gate CI or a pre-commit hook.

See `supabase/README.md` for how to apply the schema and for the Supabase-specific
dependencies to adapt when moving to a non-Supabase Postgres host.
