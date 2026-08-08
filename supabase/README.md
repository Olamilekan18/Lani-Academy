# LANI Academy — Database Schema (in code)

The entire database schema lives in this repo, so any environment — dev, staging,
or a future production DB — can be rebuilt from source with no manual SQL-editor steps.

## What's here

- **`../supabase_schema.sql`** — the complete schema in one idempotent file
  (sections 1–28). Best for a one-shot setup: paste it into the Supabase SQL editor
  and run. Safe to re-run (`IF NOT EXISTS` / `CREATE OR REPLACE` / `DROP ... IF EXISTS`).
- **`migrations/`** — the same schema split into ordered, incremental migrations for
  `supabase db push`. The chain is self-contained and bootstraps a brand-new database:

  ```
  20260616000000_base_schema.sql          core tables, RLS, new-user trigger  ← runs first
  20260617000000_lms_features.sql         quizzes, assignments, notifications, …
  20260617000001_facilitator_profiles.sql
  20260617000002_add_organization_role.sql
  20260618000000_secure_roles.sql
  20260619000000_storage_media.sql        media bucket + storage policies
  20260620000000_course_media.sql
  20260621000000_engagement.sql           promo codes, wishlist, newsletter, surveys
  20260622000000_content.sql
  20260623000000_facilitator_course_edit.sql
  20260624000000_attendance.sql
  20260625000000_applications_certs.sql
  20260626000000_discussions.sql
  20260627000000_pathways.sql
  20260628000000_analytics.sql
  20260629000000_organization_access.sql  corporate sponsor visibility  ← runs last
  ```

- **`seed_test_users.sql`** — optional: creates one confirmed login per role
  (learner / facilitator / admin / organization) for testing.
- **`functions/`** — Edge Functions (`send-email`, `send-class-reminders`).

The consolidated file and the migrations are kept equivalent. When you change the
schema, update **both**: add a new dated migration *and* fold the same statements
into `supabase_schema.sql`.

## Applying to a fresh database

**Option A — one file:** open the SQL editor and run `supabase_schema.sql`.

**Option B — CLI migrations:**

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Either produces the same result. After that, optionally run `seed_test_users.sql`.

## Moving to a production database later

If the target is **another Supabase project**, the above is fully portable — nothing
extra to do.

If you move to a **non-Supabase Postgres**, note the Supabase-specific dependencies
the schema relies on. These must be provided or adapted on the new host:

- **Auth schema** — `auth.users`, `auth.uid()`, `auth.email()` (used throughout RLS)
  and the `on_auth_user_created` trigger on `auth.users`. On plain Postgres you'll
  supply your own users table / session claims and rewrite these references.
- **Storage schema** — `storage.buckets` and `storage.objects` policies
  (`19_storage_media`). Replace with your file-storage provider's equivalent.
- **Scheduled jobs** — the class-reminder function uses `pg_cron` + `pg_net`. Swap
  for your host's scheduler if those extensions aren't available.
- **Extensions** — `pgcrypto` and `uuid-ossp` (both standard, widely available).

Everything else (tables, columns, JSONB shapes, constraints, indexes) is standard
Postgres and moves unchanged.
