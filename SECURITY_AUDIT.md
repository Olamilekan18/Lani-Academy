# LANI Academy — Security Audit

**Date:** 9 August 2026
**Scope:** React + Vite front-end, Supabase (Postgres + RLS + Edge Functions), payment integration
**Method:** Static review of source, SQL schema/RLS policies, edge functions, and dependency audit

---

## Scorecard

| # | Area | Score /100 | Rating |
|---|------|:---:|--------|
| 1 | Authentication & session management | **62** | Fair |
| 2 | Authorization & access control (RLS) | **74** | Good |
| 3 | Payment & business-logic integrity | **40** | Poor |
| 4 | Secrets & configuration | **88** | Strong |
| 5 | Input validation, injection & XSS | **85** | Strong |
| 6 | Data exposure & privacy | **58** | Fair |
| 7 | Email abuse & rate limiting | **45** | Poor |
| 8 | Dependencies & supply chain | **70** | Good |
| | **Overall (weighted)** | **64** | **Fair — ship-blocking issues present** |

Overall is a weighted blend (authz 20%, auth/payments/privacy 15% each, secrets/injection/email 10%, deps 5%).

---

## Remediation applied — 2026-08-09

Fixes were implemented in code. Post-fix scores in parentheses.

| # | Area | Before | After |
|---|------|:---:|:---:|
| 1 | Authentication & session (real server-side OTP) | 62 | **85** |
| 2 | Authorization & RLS (escalation + WITH CHECK + search_path) | 74 | **90** |
| 3 | Payment & business-logic integrity (fully server-side enrolment) | 40 | **88** |
| 4 | Secrets & configuration (CORS allow-list) | 88 | **90** |
| 5 | Input validation, injection & XSS | 85 | **88** |
| 6 | Data exposure & privacy (profiles PII locked down) | 58 | **85** |
| 7 | Email abuse & rate limiting (templates, auth, limits) | 45 | **78** |
| 8 | Dependencies & supply chain (react-router patched) | 70 | **82** |
| | **Overall (weighted)** | 64 | **≈86** |

**What changed**

- **C1 — real 2FA.** New `auth-otp` Edge Function generates a crypto-random code, stores it **hashed** in a new `email_otps` table (service-role only, RLS deny-all), enforces 10-min expiry, single use, and a 5-attempt limit. The browser never sees or checks the code. `twoFactor.ts` / `TwoFactorModal.tsx` now call the server; the old `Math.random()` client check is gone.
- **C2 — payment verification + fully server-side enrolment.** New `enroll` Edge Function is now the **only** path for a learner to enrol: it takes the learner identity from the JWT (not the client), reads the price from the database (not the client), verifies the charge against Paystack/Flutterwave with the **secret** key (`verify-payment` + shared `_shared/verify.ts`), then creates the transaction, enrolment, and notification with the service role. The learner self-insert RLS policies on `enrollments`/`transactions` were **removed**, so a user can no longer forge an enrolment through the anon key. `CheckoutModal`/`App` now call `enroll` and surface the failure reason. *Verification enforces once you set `PAYSTACK_SECRET_KEY`/`FLUTTERWAVE_SECRET_KEY`; with no secret (demo/test) it falls through so local checkout still works.*
- **C3 — guest inserts removed.** Migration drops the `OR auth.uid() IS NULL` clause on `enrollments`, `transactions`, `quiz_attempts`, `assignment_submissions`, `survey_responses`. Writers must now be the authenticated owner.
- **H1 — privilege escalation closed.** `prevent_role_escalation` now blocks **any** self-service role change (not just admin), and the profiles UPDATE policy gained `WITH CHECK`.
- **H2 — email relay locked down.** `send-email` now renders fixed server-side templates for public flows (no arbitrary HTML), requires an authenticated user for the raw-HTML path, enforces a CORS allow-list, recipient validation, size caps, and best-effort rate limiting.
- **H3 — PII exposure closed.** Profiles are no longer world-readable; only owners, staff (`is_staff()`), and facilitator profiles are visible.
- **H4 — dependency patched.** `react-router-dom` upgraded to 7.18.2 (CSRF advisory resolved).
- **M1 — search_path pinned** on `handle_new_user`, `prevent_role_escalation`, and new `is_staff`.

**Deployment steps required to activate the fixes**

1. Apply the new migrations: `supabase db push` (adds `email_otps`, `is_staff()`, tightened policies, removes learner self-insert on enrolments/transactions).
2. Deploy functions: `supabase functions deploy send-email verify-payment auth-otp enroll issue-certificate`.
3. Set secrets: `supabase secrets set PAYSTACK_SECRET_KEY=… FLUTTERWAVE_SECRET_KEY=… ALLOWED_ORIGINS="https://lani.ng,https://www.lani.ng" OTP_PEPPER=…` (RESEND_API_KEY/EMAIL_FROM as before).
4. `npm install` to pick up the patched `react-router-dom`.

**Still outstanding (not fixable in code alone / lower priority)**

- One **dev-server-only** advisory remains in `esbuild`/`vite`; the fix is a breaking Vite v8 major bump. It does not affect production builds — upgrade deliberately, not with `--force`.
- Enable Supabase Auth leaked-password protection and a stronger minimum password length (M5); add CAPTCHA/rate limiting to public intake forms (M3).

---

## Critical & high findings (fix before launch)

### C1 — "Two-factor authentication" is entirely client-side and provides no security
`src/lib/twoFactor.ts`, `src/components/TwoFactorModal.tsx`

The OTP is generated in the browser with `Math.random()`, held in a React ref (`codeRef.current`), and verified in the browser (`entry === codeRef.current`). Anyone can read the code from memory/dev-tools, or simply call the `onVerified()` path — the check never reaches a server. It also uses non-cryptographic randomness. This is security theater and gives users a false sense of protection.
**Fix:** Move OTP generation, storage, and verification server-side (Supabase Edge Function + a short-lived hashed code in a table), or use Supabase's built-in MFA/OTP. Never trust a client-verified code.

### C2 — No server-side payment verification (free course access)
`src/components/CheckoutModal.tsx`, RLS on `transactions`/`enrollments`

Payment is finalized entirely in the client callback, which then writes the transaction and enrollment. There is no webhook or server call that verifies the payment reference against Paystack/Flutterwave using the secret key. Combined with C3, a user can create their own paid enrollment without paying.
**Fix:** Verify every transaction server-side (gateway verify API or signed webhook) in an Edge Function using the gateway **secret** key, and only then insert the enrollment/transaction. Do not grant access on the client callback alone.

### C3 — Anonymous / self writes allowed on `transactions`, `enrollments`, `quiz_attempts`, `assignment_submissions`, `survey_responses`
Multiple INSERT policies use `WITH CHECK (auth.email() = learner_email OR auth.uid() IS NULL)`.

The `auth.uid() IS NULL` guest clause lets an unauthenticated caller insert rows with **any** `learner_email`. For `transactions`/`enrollments` this means forging paid enrollments; for the others it allows spoofed attempts/submissions.
**Fix:** Remove the guest clause and require authentication, or route guest checkout through a verified server function. Insert enrollments only after server-side payment verification.

### H1 — Privilege escalation to `facilitator` / `organization`
`profiles` UPDATE policy `USING (auth.uid() = id)` (no `WITH CHECK`) + `prevent_role_escalation` trigger only blocks `admin`/`super_admin`.

A learner can update their own profile and set `role = 'facilitator'` (gaining course/quiz/assignment management) or `role = 'organization'` with a chosen `organisation` name (gaining `current_org()` access to another org's sponsored learners and transactions). The trigger does not cover these roles.
**Fix:** Extend the trigger to block **any** self-initiated role change (allow role changes only when the caller is admin/super_admin), and add a `WITH CHECK` to the UPDATE policy that pins non-privileged columns.

### H2 — `send-email` Edge Function is an open email relay
`supabase/functions/send-email/index.ts`

CORS is `*` and the function accepts arbitrary `to`, `subject`, and `html` from any caller holding the public anon key (i.e. any site visitor). This enables phishing/spam sent from your verified domain, Resend quota exhaustion, and domain-reputation damage. No rate limiting, recipient allowlist, or template restriction.
**Fix:** Require an authenticated JWT and authorize the caller; restrict to server-defined templates (pass a template id + data, not raw HTML); lock CORS to your origin; add per-user/IP rate limiting.

### H3 — All user PII is world-readable
`profiles` policy `FOR SELECT USING (true)`

Every profile row — email, phone, job title, organisation, bio, qualifications — is readable by anonymous users via the anon key. This is a bulk-PII exposure/scraping risk.
**Fix:** Restrict SELECT to the owner and staff; expose only the minimal public fields (e.g. name/avatar for facilitators) through a dedicated view or narrowed policy.

### H4 — Vulnerable dependency: `react-router-dom` 7.18.0
`npm audit`: 2 **high** advisories (React Router RSC-mode CSRF bypass, GHSA-qwww-vcr4-c8h2).
**Fix:** `npm audit fix` / upgrade react-router-dom to a patched release.

---

## Medium findings

- **M1 — SECURITY DEFINER functions without fixed `search_path`.** `prevent_role_escalation()` and `handle_new_user()` omit `SET search_path = public` (unlike `current_org()`). Definer functions without a pinned search_path are vulnerable to search_path hijacking. Add `SET search_path = public` to both.
- **M2 — Client-side-only route guards.** `guardDashboard()` gates dashboards in the browser; this is UX only and bypassable. Acceptable because RLS is the real control, but don't rely on it for authorization.
- **M3 — Open INSERT on public intake tables.** `newsletter_subscribers`, `corporate_leads`, `programme_applications`, `analytics_events` allow `WITH CHECK (true)`. Expected for public forms, but add CAPTCHA/rate limiting to prevent spam/flooding.
- **M4 — Verbose logging.** ~55 `console.*` calls in `db.ts`; ensure none log tokens/PII in production builds.
- **M5 — No password policy shown.** Relies on Supabase defaults (min 6 chars). Enforce stronger minimums and consider leaked-password protection (available in Supabase Auth settings).

## Low / informational

- Certificates are publicly readable by design (verification) — acceptable, but consider a lookup-by-code endpoint rather than open table SELECT to limit enumeration.
- Storage bucket `media`: any authenticated user can upload/update objects; only admins can delete. Consider size/type limits and per-user prefixes.
- `.env` is correctly gitignored; only `VITE_*` public keys reach the client; Resend secret is server-side. Good.
- No `dangerouslySetInnerHTML`, `eval`, or raw SQL string concatenation found — XSS and SQL-injection surface is low. Good.

---

## What's already strong

- RLS enabled on **all 30 tables** with 83 policies; admin/facilitator writes gated by role lookups.
- Server-side default role assignment (`handle_new_user` → `learner`); signup cannot self-assign a role.
- Role-escalation trigger enforcing admin assignment at the DB layer (needs the H1 extension).
- Org data scoping via `SECURITY DEFINER current_org()` with a pinned search_path.
- Secrets hygiene: public vs. server keys correctly separated.
- Parameterized data access through the Supabase client; React output escaping.

---

## Priority remediation order

1. C2 + C3 — server-side payment verification; remove guest-insert clauses. *(revenue/access integrity)*
2. C1 — real server-side OTP or Supabase MFA.
3. H1 — block all self role changes; add `WITH CHECK`.
4. H2 — lock down `send-email` (auth, templates, CORS, rate limit).
5. H3 — restrict `profiles` SELECT.
6. H4 + M1 — `npm audit fix`; pin `search_path` on definer functions.

*This is a code/configuration review, not a penetration test. Verify fixes against a live environment and re-run `npm audit` before release.*
