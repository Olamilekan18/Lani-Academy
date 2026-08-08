# LANI Academy

Integrated learning, training marketplace and human‑capital development platform — a React + Supabase web app serving learners, facilitators, corporate clients and admins from one codebase.

> For system design, data model and integration details, see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

---

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · react-router-dom · Supabase (Postgres, Auth, Storage, Edge Functions) · Paystack/Flutterwave · Resend.

---

## Prerequisites

- **Node.js 18+** and npm
- A **Supabase** project (free tier is fine)
- Optional: **Supabase CLI** (`npm i -g supabase`) for migrations & functions
- Optional accounts: **Paystack**/**Flutterwave** (payments), **Resend** (email)

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env        # then fill in the values (see below)

# 3. Set up the database (see "Database" section)

# 4. Run the dev server
npm run dev                 # http://localhost:5173
```

---

## Environment variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase → Project Settings → API |
| `VITE_SUPABASE_ANON_KEY` | ✅ | anon public key (safe on client) |
| `VITE_PAYSTACK_PUBLIC_KEY` | ➖ | omit to run checkout in demo mode |
| `VITE_FLUTTERWAVE_PUBLIC_KEY` | ➖ | omit to run checkout in demo mode |
| `VITE_ENABLE_2FA` | ➖ | `true` enables email 2FA (needs Resend live) |
| `VITE_GA_ID` | ➖ | Google Analytics 4 measurement id |
| `VITE_CLARITY_ID` | ➖ | Microsoft Clarity id |

Email secrets are **not** in `.env` — they're set on Supabase (see Edge Functions).

---

## Database

The full schema is idempotent — safe to run more than once. Choose one:

**Option A — SQL editor (simplest)**
Open Supabase → SQL Editor → paste all of `supabase_schema.sql` → Run. This creates all tables, RLS policies, the `media` storage bucket, and the security triggers.

**Option B — CLI migrations**
```bash
supabase link --project-ref <your-ref>
supabase db push
```

### Seed test accounts (optional)

Run `supabase/seed_test_users.sql` in the SQL editor to create ready logins:

| Role | Email | Password |
|---|---|---|
| Learner | `learner@lani.test` | `Learner123!` |
| Facilitator | `facilitator@lani.test` | `Facilitator123!` |
| Admin | `admin@lani.test` | `Admin123!` |

### Make yourself an admin (if not seeding)

Sign up in the app, then in the SQL editor:
```sql
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'you@lani.ng';
```

### Seed sample courses

Log in as an admin → Admin console → **Seed Courses** button (top right).

---

## Email (optional but recommended)

Transactional email (welcome, payment, certificate, application, broadcast, 2FA) and class reminders run through Supabase Edge Functions using Resend.

```bash
supabase functions deploy send-email
supabase functions deploy send-class-reminders
supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="LANI Academy <noreply@yourdomain.com>"
```

To schedule daily class reminders, run `supabase/functions/send-class-reminders/schedule.sql` in the SQL editor (fill in your project ref + a key).

Without these, the app still works — emails are simply skipped.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check (`tsc -b`) and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Project structure

```
src/
├── App.tsx              Central state, routing, RBAC guard, global modals
├── main.tsx            Bootstrap (Router + AuthProvider + analytics)
├── contexts/           AuthContext (session + profile)
├── lib/                supabase client, db access layer, types, email, seo, analytics
├── components/         Navbar, Footer, modals (Checkout, CoursePlayer, Quiz, Certificate, 2FA)
├── pages/              Public pages + Learner/Facilitator/Organization/Admin dashboards
└── data/               Seed catalogue + fallback data
supabase/
├── migrations/         Incremental SQL migrations
└── functions/          send-email, send-class-reminders (Deno edge functions)
supabase_schema.sql     Full idempotent schema (single source for the SQL editor)
```

---

## Roles & portals

| Role | Route | Capabilities |
|---|---|---|
| Learner | `/learn` | Enrol, pay, learn, quizzes, assignments, surveys, certificates, profile |
| Facilitator | `/facilitator` | Assigned courses, build quizzes/assignments/surveys, grade, announce |
| Organization | `/organization` | Sponsor & bulk‑enrol staff, cohort tracking, custom training requests |
| Admin / Super admin | `/admin` | Courses, content, payments, leads, applications, certificates, promos, broadcast, analytics |

The navbar is role‑aware: signed‑in users see their dashboard as the first nav item.

---

## Deployment

1. `npm run build` → static output in `dist/`.
2. Deploy `dist/` to any static host (Vercel, Netlify, Cloudflare Pages, S3+CloudFront).
3. Add a **SPA rewrite** so all routes fall back to `index.html`.
4. Set the production `VITE_*` environment variables on the host.
5. Ensure the Supabase project's URL is allowed in Auth → URL configuration.

---

## Troubleshooting

- **"Supabase Connection Error" screen** — check `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, and that the schema has been run. You can also click **Proceed Offline** to preview with demo data.
- **`db push` fails with "policy already exists"** — you likely ran `supabase_schema.sql` first; the migrations are idempotent, re‑run `db push` (or use `supabase migration repair`).
- **Payments open a demo popup** — no payment public key is set; add one to `.env`.
- **No emails arriving** — deploy the `send-email` function and set `RESEND_API_KEY` / `EMAIL_FROM`.
- **Can't create an admin from the app** — by design; admins are provisioned via SQL or by an existing admin.

---

## License

Proprietary © LANI Group. All rights reserved.
