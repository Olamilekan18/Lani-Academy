# LANI Academy — Go-Live Checklist

_Last updated: 9 August 2026_

This is the ordered list of steps to take the app from its current state to production. Code is in good shape; most remaining work is deployment and configuration in Supabase and your host. Check items off top to bottom.

---

## 1. Database — apply schema & pending fixes

- [ ] Push all migrations to the live database: `supabase db push`
      (If it errors with "policy already exists", the migrations are idempotent — re-run, or use `supabase migration repair`.)
- [ ] **Or**, if applying by hand, run `scripts/apply_dashboard_fixes.sql` in Supabase → SQL Editor. It is idempotent and covers:
      - Facilitator read access to enrollments (fixes Avg. Completion + Learner Progress)
      - `learner_activity` table + policies (fixes the learner Day Streak)
      - Extended learner profile columns: `country`, `state_region`, `city`, `gender`, `date_of_birth`
- [ ] Seed your first admin (self-service role changes are blocked by design):
      `UPDATE public.profiles SET role='super_admin' WHERE email='you@lani.ng';`

## 2. Edge Functions — deploy

- [ ] `supabase functions deploy send-email verify-payment auth-otp enroll issue-certificate send-class-reminders`
- [ ] Confirm each function appears as deployed in the Supabase dashboard.

## 3. Secrets (server-side, set in Supabase)

- [ ] `PAYSTACK_SECRET_KEY` — real payment verification
- [ ] `FLUTTERWAVE_SECRET_KEY` — real payment verification
- [ ] `RESEND_API_KEY` — outbound email + 2FA codes
- [ ] `EMAIL_FROM` — verified sender, e.g. `LANI Academy <noreply@lani.ng>`
- [ ] `ALLOWED_ORIGINS` — CORS allow-list, e.g. `https://lani.ng,https://www.lani.ng`
- [ ] `OTP_PEPPER` — any long random string (extra 2FA hash secret)

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` are injected automatically — do not set these.

## 4. Client environment (public keys only — in host env / `.env`)

- [ ] `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_PAYSTACK_PUBLIC_KEY`, `VITE_FLUTTERWAVE_PUBLIC_KEY`
- [ ] `VITE_ENABLE_2FA=true` — **only after** `RESEND_API_KEY` is live, or codes can't be delivered.

## 5. Supabase Auth settings

- [ ] Turn on leaked-password protection.
- [ ] Raise the minimum password length above the default (6).
- [ ] Add your production URL under Auth → URL configuration (redirect/allow list).

## 6. Build & host

- [ ] `npm install` (picks up patched `react-router-dom`).
- [ ] `npm run build` → deploy `dist/` to your static host (Vercel / Netlify / Cloudflare Pages / S3+CloudFront).
- [ ] Add an SPA rewrite so all routes fall back to `index.html`.

## 7. Security follow-ups (from the audit)

- [ ] Add CAPTCHA / rate-limiting to public intake forms (contact, corporate leads, scholarship applications) — these are open by design (M3).
- [ ] Plan a deliberate Vite major-version bump to clear the dev-server-only `esbuild`/`vite` advisory. **Do not** `npm audit fix --force` (it's a breaking change and only affects the dev server, not production builds).
- [ ] Confirm no `console.*` calls log tokens/PII in production (M4).

---

## Behaviour notes (expected until configured)

- **Payments run in demo mode** until the gateway secret keys are set: checkout is simulated (nothing is charged) but enrolment is still granted. Verification becomes strictly enforced the moment the secrets exist.
- **No emails send** until the `send-email` function is deployed and `RESEND_API_KEY` / `EMAIL_FROM` are set.
- **Admins can't be created from the app** — by design; provision via the SQL above or by an existing admin.

## Known code items still open (optional, not blocking launch)

- Certificate **templates & revocation**, SMS/WhatsApp notifications, and subscriptions are on the roadmap but not yet built.
- Learner DOB has no minimum-age enforcement; city/gender/DOB are currently optional at signup.
- Facilitators are rated via surveys only — no direct star-rating widget yet.
