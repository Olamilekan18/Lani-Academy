# LANI Academy — Platform Documentation

**Version:** 1.0  
**Date:** September 2026  
**Organisation:** LANI Group  
**Contact:** info@lani.ng | +234 705 333 9191  
**Address:** 53B, Adekunle Fajuyi Way, Ikeja GRA, Lagos, Nigeria

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Overview](#2-platform-overview)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [User Roles & Access Control](#5-user-roles--access-control)
6. [Feature Catalogue](#6-feature-catalogue)
7. [Page & Route Map](#7-page--route-map)
8. [Database Schema](#8-database-schema)
9. [Third-Party Integrations](#9-third-party-integrations)
10. [Environment & Configuration](#10-environment--configuration)
11. [Deployment Guide](#11-deployment-guide)
12. [Administration Guide](#12-administration-guide)
13. [Security Model](#13-security-model)
14. [SEO & Discoverability](#14-seo--discoverability)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Executive Summary

LANI Academy is a full-service, integrated learning and training marketplace built by LANI Group. It is a web-based platform that enables individuals, corporate organisations, and sponsored learners to discover, enrol in, and complete professional development programmes across high-impact sectors including finance, ESG & sustainability, digital transformation, agribusiness, human capital, and more.

The platform provides:

- A **public-facing course marketplace** with rich course detail pages, certification information, and corporate training enquiry forms
- A **Learner Management System (LMS)** with video-based learning, quizzes, assignments, surveys, discussion forums, streak tracking, and verifiable digital certificates
- A **Facilitator portal** for course delivery, assessment creation, grading, and learner engagement
- A **Corporate portal** for organisations to sponsor, bulk-enrol, and track their teams
- A comprehensive **Admin dashboard** with analytics, content management, payment reconciliation, lead management, promo codes, broadcast email, and audit logging

---

## 2. Platform Overview

### 2.1 Design Principles

- **Commercial-first:** built as a revenue-generating training marketplace, not a free MOOC
- **Learner-friendly:** intuitive UI, progress tracking, gamification (streaks/badges), mobile-responsive
- **Corporate-ready:** B2B enquiry pipeline, bulk enrolment, sponsorship tracking, custom training proposals
- **Content-scalable:** admin-managed course catalogue, CMS for articles and resources, learning pathways
- **Impact-measurable:** analytics events, enrolment funnels, revenue dashboards, completion rates, audit logging

### 2.2 Audiences Served

| Audience | Description |
|---|---|
| **Public visitors** | Browse courses, read about LANI, view resources, apply for sponsored programmes |
| **Learners** | Enrol, pay, study, take assessments, earn certificates, manage profiles |
| **Facilitators** | Deliver courses, build assessments, grade submissions, post announcements |
| **Corporate clients** | Sponsor teams, bulk-enrol staff, track cohort progress, request bespoke training |
| **Administrators** | Full platform control: courses, payments, leads, certificates, content, promos, broadcasts |

---

## 3. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend framework** | React 18 + TypeScript | Component-based UI with type safety |
| **Build tool** | Vite 5 | Fast development server and production builds |
| **Styling** | Tailwind CSS 3 | Utility-first CSS with custom `lani-*` design tokens |
| **Routing** | react-router-dom 7 | Client-side SPA routing |
| **Charts** | Recharts | Admin dashboard visualisations |
| **Icons** | lucide-react | Consistent icon set |
| **Notifications** | react-hot-toast | User-facing toast messages |
| **Backend** | Supabase (Postgres 15, Auth, Storage, Edge Functions) | Database, authentication, file storage, serverless functions |
| **Payments** | Paystack + Flutterwave | Inline checkout, supports bank transfer |
| **Email** | Resend (via Edge Function) | Transactional and broadcast emails |
| **Scheduling** | pg_cron + pg_net | Automated class reminders |
| **Analytics** | Google Analytics 4 + Microsoft Clarity | Traffic and behaviour analytics |
| **Hosting** | Vercel | Static SPA deployment with SPA rewrites |

### 3.1 Key Dependencies

```
@supabase/supabase-js  ^2.45.4
react                  ^18.3.1
react-dom              ^18.3.1
react-router-dom       ^7.18.0
recharts               ^3.8.1
lucide-react           ^0.468.0
react-hot-toast        ^2.6.0
```

---

## 4. System Architecture

### 4.1 High-Level Architecture

The platform follows a **serverless architecture** pattern:

- **Client:** A single-page React application (SPA) that runs entirely in the browser
- **Backend:** Supabase provides the entire backend — database (Postgres), authentication (GoTrue), file storage, and serverless edge functions (Deno)
- **No custom application server** — the SPA communicates directly with Supabase, which enforces all authorisation at the database layer via Row-Level Security (RLS)

### 4.2 Data Flow

```
Browser (React SPA)
    ↕ REST + Realtime (RLS enforced)
Supabase Postgres (22 tables, all with RLS)
    ↕ JWT session
Supabase Auth (GoTrue — email/password)
    ↕ upload / signed URLs
Supabase Storage ('media' bucket)
    ↕ functions.invoke()
Edge Functions (Deno)
    → Resend (email delivery)
    → pg_cron (scheduled tasks)
```

### 4.3 Frontend Structure

```
src/
├── main.tsx                 App bootstrap: Router + AuthProvider + analytics
├── App.tsx                  Central state, routing, RBAC guards, global modals
├── index.css                Tailwind layers + design-system component classes
├── contexts/
│   └── AuthContext.tsx       Session + profile; signIn/up/out, reset, updateProfile
├── lib/
│   ├── supabase.ts          Supabase client initialisation
│   ├── db.ts                Data-access layer (all DB reads/writes/uploads/email)
│   ├── types.ts             All domain TypeScript types
│   ├── emailTemplates.ts    Branded HTML email builders
│   ├── twoFactor.ts         Email OTP helpers
│   ├── analytics.ts         GA4 + Clarity init and page tracking
│   ├── seo.ts               Per-route <title> + meta description
│   └── utils.ts             formatMoney, formatDate helpers
├── components/              Reusable UI components (15 components)
├── pages/                   Route views (20 pages)
└── data/                    Seed/catalogue + mock LMS data (fallbacks)
```

### 4.4 State Management

There is **no external state library** (no Redux, Zustand, etc.). State is centralised in `App.tsx`:

- `AuthContext` owns the user session, profile, and auth actions
- `App.tsx` loads all collections from Supabase on mount and passes them as props to pages
- Mutations flow through handler functions in `App.tsx` → data-access functions in `db.ts` → database refresh

---

## 5. User Roles & Access Control

### 5.1 Role Definitions

| Role | Route | Description |
|---|---|---|
| **Learner** | `/learn` | Default role on signup. Can enrol, pay, study, take assessments, earn certificates |
| **Facilitator** | `/facilitator` | Manages assigned courses, creates assessments, grades, posts announcements |
| **Organisation** | `/organization` | Corporate portal: sponsors learners, bulk-enrols staff, tracks cohort progress |
| **Admin** | `/admin` | Full platform management: courses, payments, leads, certificates, content, promos |
| **Super Admin** | `/admin` | Same as Admin, plus ability to promote other users to admin |

### 5.2 Role Assignment Rules

- **Self-registration:** Users can sign up as Learner, Facilitator, or Organisation
- **Admin roles cannot be self-assigned** — a database trigger (`prevent_role_escalation`) blocks any user from setting their own role to `admin` or `super_admin`
- **First admin:** Must be created via SQL: `UPDATE public.profiles SET role = 'super_admin' WHERE email = 'you@lani.ng';`
- **Facilitator access can be revoked** by admins, demoting back to Learner

### 5.3 Access Control Enforcement

- **Database layer (primary):** Row-Level Security (RLS) policies on all 22 tables enforce what each role can read/write
- **UI layer (convenience):** Route guards in `App.tsx` redirect users to their correct dashboard
- The UI guards are not the security boundary — even if bypassed, Supabase will reject unauthorised operations

---

## 6. Feature Catalogue

### 6.1 Public-Facing Features

| Feature | Description |
|---|---|
| **Course Marketplace** | Browsable catalogue with filtering by thematic area, level, type, and delivery mode |
| **Course Detail Pages** | Rich pages with modules, outcomes, audience, facilitator info, pricing, and enrolment |
| **Learning Pathways** | Curated bundles of courses at discounted bundle prices |
| **Certificate Verification** | Public page where anyone can verify a certificate by ID or QR code scan |
| **Corporate Portal** | B2B enquiry form for custom training proposals |
| **Sponsored Applications** | Application forms for scholarship/grant-funded programmes |
| **Resources** | Admin-published articles, guides, brochures, and downloadable flyers |
| **Learning Calendar** | Public view of upcoming sessions, workshops, and deadlines |
| **About & Contact** | Organisation info, leadership team, and contact form |

### 6.2 Learner Features

| Feature | Description |
|---|---|
| **Course Player** | Video-based learning with module/lesson navigation, progress tracking |
| **Timed Quizzes** | Multiple-choice quizzes with configurable time limits and passing scores |
| **Assignments** | Text + file upload submissions with facilitator grading and feedback |
| **Surveys** | Pre/post/feedback surveys with 1–5 rating scales |
| **Discussion Forum** | Per-course threaded discussions with replies |
| **Streak & Badges** | Gamification: login streaks with Bronze/Silver/Gold/Platinum milestones |
| **Lesson Notes** | Personal notes with bookmark functionality per lesson |
| **AI Learning Assistant** | Ask AI feature for learning support |
| **Digital Certificates** | Auto-issued on 100% completion; printable with QR code for verification |
| **Wishlist** | Save courses for later |
| **Profile Management** | Edit personal details, change password, view payment history |
| **Notifications** | Real-time alerts for enrolments, payments, certificates, assessments |

### 6.3 Facilitator Features

| Feature | Description |
|---|---|
| **Course Management** | View and manage assigned courses |
| **Quiz Builder** | Create/edit multiple-choice quizzes with questions, options, passing scores, time limits, and deadlines |
| **Assignment Creator** | Create assignments with descriptions, due dates, and max scores |
| **Survey Builder** | Create rating-based surveys (Pre/Post/Feedback) |
| **Grading** | Score submissions, provide feedback, return assignments |
| **Announcements** | Post announcements to course learners |
| **Session Scheduling** | Schedule live classes, workshops, webinars with meeting links |
| **Attendance Tracking** | Mark attendance for scheduled sessions |
| **Learner Progress View** | Monitor individual learner progress across assigned courses |
| **Export** | CSV export of learner data, grades, and attendance |

### 6.4 Corporate (Organisation) Features

| Feature | Description |
|---|---|
| **Team Dashboard** | Overview of sponsored learners, active enrolments, and completion rates |
| **Bulk Enrolment** | Paste name/email lists to batch-enrol staff in courses |
| **Individual Enrolment** | Enrol individual team members |
| **Cohort Tracking** | Monitor progress of all sponsored learners |
| **Training Proposals** | Submit custom training requests directly to LANI |

### 6.5 Admin Features

| Feature | Description |
|---|---|
| **Executive Dashboard** | Revenue trends, enrolment charts, lead pipeline, course analytics, enrolment funnels |
| **Course Management** | Full CRUD for courses with the rich curriculum editor |
| **Curriculum Editor** | Drag-and-drop module/lesson builder with material uploads and video support |
| **Learner Management** | Search, view, and export all enrolments |
| **Payment Management** | View transactions, manually confirm bank transfers, export CSV |
| **Corporate Lead Pipeline** | Track B2B leads through stages (New → Contacted → Proposal → Negotiation → Won/Lost) |
| **Application Processing** | Review, score, and convert applications into enrolments |
| **Certificate Management** | Issue/revoke certificates |
| **CMS Assets** | Upload and manage banners, flyers, brochures, videos, testimonials |
| **Articles & Resources** | Publish articles, guides, brochures for the public Resources page |
| **Learning Pathways** | Create/manage course bundles with covers and pricing |
| **Expert Profiles (SMEs)** | Manage subject matter expert profiles shown on the landing page |
| **Session Management** | Schedule sessions with attendance tracking |
| **Promo Codes** | Create discount codes with expiry dates and usage limits |
| **Broadcast Email** | Send emails to all learners, course-specific groups, leads, subscribers, or custom lists |
| **Audit Log** | Track all administrative actions (role changes, archives, revocations, broadcasts) |
| **Facilitator Assignment** | Assign/revoke facilitators to courses |
| **Data Export** | CSV export for leads, learners, transactions, audit logs, and applications |

---

## 7. Page & Route Map

| Path | Page | Access |
|---|---|---|
| `/` | Home (landing page) | Public |
| `/courses` | Course Marketplace | Public |
| `/courses/:slug` | Course Detail | Public |
| `/certification` | Certification Information | Public |
| `/calendar` | Learning Calendar | Public |
| `/corporate` | Corporate Training Portal | Public |
| `/apply` | Sponsored Programme Applications | Public |
| `/resources` | Articles & Resources | Public |
| `/pathways` | Learning Pathways | Public |
| `/about` | About LANI | Public |
| `/contact` | Contact Us | Public |
| `/verify` | Certificate Verification | Public |
| `/privacy` | Privacy Policy | Public |
| `/terms` | Terms of Service | Public |
| `/signup` | Sign Up (role selection) | Public |
| `/login` | Login | Public |
| `/learn` | Learner Dashboard | Learner |
| `/facilitator` | Facilitator Dashboard | Facilitator |
| `/organization` | Corporate Dashboard | Organisation |
| `/admin` | Admin Dashboard | Admin / Super Admin |

---

## 8. Database Schema

The database comprises **22 tables**, all with Row-Level Security enabled. The full DDL is in `supabase_schema.sql`.

### 8.1 Table Overview

| Domain | Tables |
|---|---|
| **Identity** | `profiles` |
| **Catalogue & Commerce** | `courses`, `enrollments`, `transactions`, `promo_codes`, `wishlists` |
| **LMS** | `quizzes`, `quiz_attempts`, `assignments`, `assignment_submissions`, `surveys`, `survey_responses`, `announcements`, `calendar_events`, `facilitator_assignments` |
| **Certification** | `certificates` |
| **CRM / B2B** | `corporate_leads`, `programme_applications` |
| **Content & CMS** | `content`, `cms_assets` |
| **Engagement** | `notifications`, `newsletter_subscribers` |

### 8.2 Key Tables

**`profiles`** — User accounts and roles
- Linked to Supabase Auth via `id` (UUID)
- Fields: `full_name`, `email`, `role`, `phone`, `organisation`, `job_title`, `avatar_url`

**`courses`** — Course catalogue
- Types: Open Programme, Certification Preparatory Class, Bootcamp, Corporate, Sponsored
- Levels: Foundation, Intermediate, Advanced, Executive, PT1, PT2, Others
- Contains: modules (JSONB with lessons, materials, videos), pricing, delivery modes, dates
- CHECK constraints on `type` and `level` columns

**`enrollments`** — Learner–course relationships
- Tracks: `progress` (0–100%), `completed_lessons` (text array), `payment_status`, `sponsor_organisation`

**`transactions`** — Payment records
- Gateways: Paystack, Flutterwave, Bank Transfer
- Statuses: Pending, Successful, Failed, Refunded, Manually Confirmed

**`certificates`** — Issued certificates
- Statuses: Issued, Revoked
- Types: Completion, Participation, Professional Preparation, Executive Programme, Corporate Training

### 8.3 Database Conventions

- **Naming:** All database columns use `snake_case`; the application uses `camelCase`. Conversion is handled automatically by `db.ts`
- **IDs:** Human-readable prefixes (e.g., `enr-`, `txn-`, `LANI-CERT-`, `quiz-`, `cnt-`)
- **Money:** Stored as integer Naira; formatted via `formatMoney()` helper
- **JSONB:** Complex nested data (quiz questions, course modules) stored as JSONB with automatic case conversion

---

## 9. Third-Party Integrations

| Integration | Direction | Mechanism | Notes |
|---|---|---|---|
| **Supabase** | Client ⇄ DB | `@supabase/supabase-js` (REST/Realtime) | RLS enforced; anon key on client |
| **Supabase Auth** | Client ⇄ Auth | Email/password, JWT sessions | Optional email 2FA |
| **Supabase Storage** | Client ⇄ Storage | Public `media` bucket | Course covers, materials, uploads |
| **Paystack** | Client → Gateway | Inline JS popup | Public key only on client |
| **Flutterwave** | Client → Gateway | Inline JS popup | Public key only on client |
| **Resend** | Edge Function → API | `send-email` function | API key in function secrets only |
| **Google Analytics 4** | Client → GA4 | Script injection | Optional; measurement ID in env |
| **Microsoft Clarity** | Client → Clarity | Script injection | Optional; project ID in env |

All integrations **degrade gracefully**: missing payment keys → demo checkout; missing Resend key → emails skipped; missing analytics IDs → no scripts loaded; missing Supabase → connection error screen with offline demo mode.

---

## 10. Environment & Configuration

### 10.1 Client Environment Variables (`.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Supabase anon (public) key |
| `VITE_PAYSTACK_PUBLIC_KEY` | Optional | Paystack public key for live payments |
| `VITE_FLUTTERWAVE_PUBLIC_KEY` | Optional | Flutterwave public key for live payments |
| `VITE_ENABLE_2FA` | Optional | Set to `true` to enable email-based 2FA |
| `VITE_GA_ID` | Optional | Google Analytics 4 measurement ID |
| `VITE_CLARITY_ID` | Optional | Microsoft Clarity project ID |

### 10.2 Server-Side Secrets (Supabase Edge Functions)

| Secret | Description |
|---|---|
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | Sender address (e.g., `LANI Academy <noreply@lani.ng>`) |

These secrets are **never** stored in `.env` — they exist only in Supabase Edge Function secrets.

---

## 11. Deployment Guide

### 11.1 Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier is sufficient)
- Optional: Supabase CLI for migrations & functions
- Optional: Paystack/Flutterwave accounts (payments), Resend account (email)

### 11.2 Initial Setup

```bash
# 1. Clone the repository
git clone https://github.com/Olamilekan18/Lani-Academy.git
cd Lani-Academy

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY at minimum

# 4. Set up the database
# Option A: Paste supabase_schema.sql into Supabase SQL Editor → Run
# Option B: supabase link --project-ref <ref> && supabase db push

# 5. Start development server
npm run dev
# Opens at http://localhost:5173
```

### 11.3 Database Setup

The full schema (`supabase_schema.sql`) is **idempotent** — safe to run multiple times. It creates:
- All 22 tables with columns and constraints
- Row-Level Security policies for every table
- The `media` storage bucket with public read access
- Security triggers (new user profile creation, role escalation prevention)

### 11.4 Email Setup

```bash
supabase functions deploy send-email
supabase functions deploy send-class-reminders
supabase secrets set RESEND_API_KEY=re_xxx EMAIL_FROM="LANI Academy <noreply@lani.ng>"
```

For daily class reminders, run `supabase/functions/send-class-reminders/schedule.sql` in the SQL editor.

### 11.5 Production Deployment

```bash
# Build for production
npm run build

# Output: dist/ directory (static files)
```

Deploy the `dist/` directory to any static hosting provider. The platform currently uses **Vercel** with a `vercel.json` catch-all rewrite:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

### 11.6 Creating the First Admin

Sign up through the app, then run in the Supabase SQL Editor:

```sql
UPDATE public.profiles SET role = 'super_admin' WHERE email = 'you@lani.ng';
```

---

## 12. Administration Guide

### 12.1 Course Management

1. Navigate to **Admin Dashboard → Courses**
2. Click **Add New Course** to open the Course Editor
3. Fill in course details: title, code, category, thematic area, type, level, delivery modes, duration, pricing
4. Use the **Curriculum Editor** to build modules with lessons, materials, and videos
5. Module drip release: set modules as `draft` or schedule release dates
6. Set the course status to `Open` to make it visible in the marketplace

**Course Types:** Open Programme, Certification Preparatory Class, Bootcamp, Corporate, Sponsored

**Course Levels:** Foundation, Intermediate, Advanced, Executive, PT1, PT2, Others

### 12.2 Payment Management

- **Paystack/Flutterwave:** Payments are automatically confirmed via the inline checkout
- **Bank Transfer:** Learners submit transfer details; admin manually confirms in the Payments tab
- **Promo Codes:** Create discount codes with percentage discounts, expiry dates, and usage limits

### 12.3 Content Management

- **Articles & Resources:** Create articles, guides, brochures, and flyers published to the Resources page
- **CMS Assets:** Upload banners, videos, and testimonials for marketing purposes
- **Expert Profiles:** Manage SME profiles displayed on the landing page

### 12.4 Communication

- **Announcements:** Facilitators and admins post course-specific announcements
- **Broadcast Email:** Send bulk emails to learners, leads, subscribers, or custom recipient lists
- **Automated Reminders:** Daily class reminder emails sent via pg_cron

### 12.5 Analytics & Reporting

The admin dashboard provides:
- Revenue trends (year-to-date area chart)
- Enrolments by thematic area (bar chart)
- Lead pipeline stages (progress bars)
- Course distribution (pie chart)
- Revenue by thematic area (ranked bars)
- Most viewed courses (ranked bars)
- Enrolment funnel (views → checkout starts → completions)
- Lead conversion rate
- Key metrics: total revenue, total enrolments, average completion, certificates issued, pending payments

All data views support **CSV export**.

---

## 13. Security Model

### 13.1 Authentication

- Supabase GoTrue email/password authentication
- JWT-based sessions
- Optional email-based 2FA (via `VITE_ENABLE_2FA`)
- Email verification required for paid enrolments

### 13.2 Authorisation

- **Row-Level Security (RLS)** on all 22 database tables
- Learners can only access their own enrolments, transactions, quiz attempts, submissions, and wishlist
- Facilitators have scoped elevated access to their assigned courses
- Admins have full read/write access

### 13.3 Privilege Escalation Prevention

- The `prevent_role_escalation()` database trigger blocks any user from self-assigning `admin` or `super_admin` roles via the API
- Only an existing admin (via SQL editor or service-role session) can grant admin privileges

### 13.4 Secret Management

- **Client-side (safe):** Supabase anon key, Paystack/Flutterwave public keys
- **Server-side only:** Supabase service role key, Resend API key — these never appear in client code or `.env`

### 13.5 Storage Security

- `media` bucket: public read access, authenticated insert/update, admin-only delete
- All uploads go through `dbUploadFile()` which returns a public URL

---

## 14. SEO & Discoverability

### 14.1 Meta Tags

The platform includes comprehensive meta tags in `index.html`:
- **Title:** "LANI Academy — Integrated Learning & Professional Development Platform"
- **Description:** Keyword-rich description targeting "LANI Academy", "corporate training Lagos", "certification courses Nigeria"
- **Keywords:** Targeted search terms for Nigerian professional development
- **Open Graph:** Facebook/LinkedIn/WhatsApp social preview cards
- **Twitter Card:** Twitter/X social preview
- **Canonical URL:** `https://academy.lani.ng/`

### 14.2 Structured Data

JSON-LD `EducationalOrganization` schema markup provides Google with:
- Organisation name, address, and contact details
- Parent organisation (LANI Group)
- Social profiles

### 14.3 Technical SEO

- **`robots.txt`:** Allows all crawlers, points to sitemap
- **`sitemap.xml`:** Lists all 13 public-facing pages with priority and change frequency
- **Per-page SEO:** Dynamic `<title>` and meta descriptions set via `lib/seo.ts` on route changes
- **SPA routing:** Vercel catch-all rewrite ensures all routes serve `index.html`

---

## 15. Troubleshooting

| Issue | Solution |
|---|---|
| "Supabase Connection Error" screen | Check `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in `.env`. Ensure the schema has been run. Click **Proceed Offline** to preview with demo data. |
| `db push` fails with "policy already exists" | You likely ran `supabase_schema.sql` first. Re-run `db push` or use `supabase migration repair`. |
| Payments open a demo popup | No payment public key is set. Add `VITE_PAYSTACK_PUBLIC_KEY` to `.env`. |
| No emails arriving | Deploy the `send-email` Edge Function and set `RESEND_API_KEY` / `EMAIL_FROM` secrets. |
| Cannot create an admin from the app | By design. Admins must be provisioned via SQL or by an existing admin. |
| 404 errors on direct page visits | Ensure the hosting provider has SPA rewrite rules (e.g., `vercel.json` catch-all). |
| CHECK constraint violation on courses | Run the migration in `migrations/20260902_update_course_type_and_level.sql` to update database constraints. |

---

## Appendix A: Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run test suite (Vitest) |
| `npm run test:watch` | Run tests in watch mode |

---

## Appendix B: File Structure Summary

```
Lani-Academy/
├── index.html                  Entry HTML (SEO meta, structured data, fonts)
├── vercel.json                 Vercel SPA rewrite configuration
├── package.json                Dependencies and scripts
├── tailwind.config.ts          Tailwind CSS configuration with lani-* tokens
├── vite.config.ts              Vite build configuration
├── tsconfig.json               TypeScript configuration
├── supabase_schema.sql         Full idempotent database schema
├── ARCHITECTURE.md             Detailed system architecture documentation
├── public/
│   ├── favicon.svg             Site favicon
│   ├── robots.txt              Search engine crawler directives
│   └── sitemap.xml             XML sitemap for search engines
├── migrations/
│   └── *.sql                   Incremental database migrations
├── supabase/
│   ├── migrations/             Supabase CLI migrations
│   └── functions/              Edge functions (send-email, send-class-reminders)
└── src/
    ├── App.tsx                 Central application state and routing
    ├── main.tsx                Bootstrap entry point
    ├── index.css               Design system and global styles
    ├── contexts/               React context providers
    ├── lib/                    Utilities, types, database layer, email templates
    ├── components/             Reusable UI components (15 files)
    ├── pages/                  Route page components (20 files)
    ├── data/                   Seed catalogue and mock data
    └── test/                   Test suite
```

---

**Document prepared by:** LANI Group Technical Team  
**Platform:** LANI Academy v1.0  
**© 2026 LANI Group. All rights reserved.**
