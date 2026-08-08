// Branded HTML email templates for LANI Academy transactional emails.
// Dependency-free so each can be passed straight to the send-email Edge Function
// (Resend). Every builder returns { subject, html }.

const BRAND = "#087443";
const EMERALD = "#10a768";
const NAVY = "#0f2442";
const GOLD = "#c9972b";

function shell(title: string, bodyHtml: string): string {
  return `
  <div style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Segoe UI,Arial,sans-serif;">
    <div style="max-width:560px;margin:0 auto;padding:24px;">
      <div style="background:${NAVY};border-radius:16px 16px 0 0;padding:24px 28px;">
        <span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:-0.5px;">LANI</span>
        <span style="color:${GOLD};font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin-left:6px;">Academy</span>
      </div>
      <div style="background:#fff;border-radius:0 0 16px 16px;padding:28px;color:#334155;font-size:14px;line-height:1.7;">
        <h1 style="margin:0 0 12px;color:${NAVY};font-size:20px;">${title}</h1>
        ${bodyHtml}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
        <p style="font-size:12px;color:#94a3b8;margin:0;">LANI Academy · Nigeria · Ghana · Kenya · Uganda<br/>This is an automated message — please do not reply.</p>
      </div>
    </div>
  </div>`;
}

function badge(label: string, note?: string): string {
  return `<div style="margin:20px 0;">
    <span style="display:inline-block;background:${BRAND};color:#fff;font-weight:700;font-size:13px;padding:12px 22px;border-radius:10px;">${label}</span>
    ${note ? `<div style="font-size:12px;color:#94a3b8;margin-top:8px;">${note}</div>` : ""}
  </div>`;
}

function ctaButton(label: string, url: string): string {
  return `<div style="margin:22px 0;">
    <a href="${url}" style="display:inline-block;background:${BRAND};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 26px;border-radius:10px;">${label}</a>
  </div>`;
}

export type EmailContent = { subject: string; html: string };

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Generic transactional notification (assignment graded, new content, etc.)
export function notificationEmail(title: string, body: string): EmailContent {
  const html = shell(title, body.split("\n").map((l) => (l.trim() ? `<p>${escapeHtml(l)}</p>` : "<br/>")).join(""));
  return { subject: `${title} — LANI Academy`, html };
}

// Generic admin broadcast — turns a plain-text message into branded HTML.
export function broadcastEmail(subject: string, message: string): EmailContent {
  const body = message
    .split("\n")
    .map((line) => (line.trim() ? `<p>${escapeHtml(line)}</p>` : "<br/>"))
    .join("");
  return { subject, html: shell(subject, body) };
}

// ── Onboarding ───────────────────────────────────────────────
export function welcomeEmail(name: string, role = "learner"): EmailContent {
  const roleLabel = role === "facilitator" ? "Facilitator" : role === "organization" ? "Organisation" : "Learner";
  const body = `<p>Hi ${name},</p>
    <p>Welcome to <strong>LANI Academy</strong> — your ${roleLabel.toLowerCase()} account is ready. You can now explore programmes, track your progress, and earn verifiable certificates across our eight thematic academies.</p>
    ${badge(`${roleLabel} account activated`)}
    <p>If you didn't create this account, please ignore this email.</p>`;
  return { subject: "Welcome to LANI Academy 🎓", html: shell("Welcome aboard", body) };
}

// ── Two-factor / OTP ─────────────────────────────────────────
export function twoFactorCodeEmail(name: string, code: string, minutes = 10): EmailContent {
  const body = `<p>Hi ${name},</p>
    <p>Use the verification code below to complete your sign-in. It expires in ${minutes} minutes.</p>
    <div style="margin:24px 0;text-align:center;">
      <span style="display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;color:${NAVY};font-size:30px;font-weight:800;letter-spacing:10px;padding:16px 24px;border-radius:12px;">${code}</span>
    </div>
    <p style="font-size:13px;color:#64748b;">If you didn't request this, someone may be trying to access your account — please change your password.</p>`;
  return { subject: `Your LANI Academy verification code: ${code}`, html: shell("Verify your sign-in", body) };
}

// ── Password reset (optional; Supabase can also handle this) ──
export function passwordResetEmail(name: string, resetUrl: string): EmailContent {
  const body = `<p>Hi ${name},</p>
    <p>We received a request to reset your LANI Academy password. Click below to choose a new one. This link is valid for a limited time.</p>
    ${ctaButton("Reset my password", resetUrl)}
    <p style="font-size:13px;color:#64748b;">If you didn't request this, you can safely ignore this email.</p>`;
  return { subject: "Reset your LANI Academy password", html: shell("Password reset", body) };
}

// ── Payments / enrolment ─────────────────────────────────────
export function paymentConfirmationEmail(name: string, courseTitle: string, amount: string, receipt: string, pending: boolean): EmailContent {
  const subject = pending
    ? `We received your enrolment for ${courseTitle}`
    : `Payment confirmed — ${courseTitle}`;
  const body = pending
    ? `<p>Hi ${name},</p>
       <p>Thanks for enrolling in <strong>${courseTitle}</strong>. We've recorded your bank transfer and your enrolment will be activated as soon as our finance team confirms payment.</p>
       <p><strong>Amount:</strong> ${amount}<br/><strong>Reference:</strong> ${receipt}</p>
       ${badge("Pending confirmation")}`
    : `<p>Hi ${name},</p>
       <p>Your payment was successful and you're now enrolled in <strong>${courseTitle}</strong>. You can start learning right away from your dashboard.</p>
       <p><strong>Amount paid:</strong> ${amount}<br/><strong>Receipt:</strong> ${receipt}</p>
       ${badge("Enrolment active")}`;
  return { subject, html: shell(pending ? "Enrolment received" : "Payment successful", body) };
}

export function enrolmentAccessEmail(name: string, courseTitle: string): EmailContent {
  const body = `<p>Hi ${name},</p>
    <p>You now have full access to <strong>${courseTitle}</strong>. Head to your learner dashboard to work through the modules, download materials, and take assessments at your own pace.</p>
    ${badge("Course access granted")}`;
  return { subject: `You're in — ${courseTitle} is now available`, html: shell("Course access granted", body) };
}

// ── Certification ────────────────────────────────────────────
export function certificateReadyEmail(name: string, courseTitle: string, certId: string): EmailContent {
  const body = `<p>Congratulations ${name}!</p>
    <p>You've completed <strong>${courseTitle}</strong> and your certificate has been issued. You can download it from your learner dashboard, and anyone can verify it using the ID below.</p>
    <p><strong>Certificate ID:</strong> ${certId}</p>
    ${badge("Certificate issued", "Verify anytime on the LANI Academy verification page.")}`;
  return { subject: `Your certificate for ${courseTitle} is ready`, html: shell("Certificate ready 🎓", body) };
}

// ── Applications ─────────────────────────────────────────────
export function applicationStatusEmail(name: string, programme: string, status: string): EmailContent {
  const body = `<p>Hi ${name},</p>
    <p>There's an update on your application for <strong>${programme}</strong>.</p>
    <p>Current status: <strong style="color:${BRAND};">${status}</strong></p>
    <p>We'll be in touch with any next steps. Thank you for your interest in LANI Academy.</p>`;
  return { subject: `Update on your ${programme} application: ${status}`, html: shell("Application update", body) };
}

// ── Class / session reminder ─────────────────────────────────
export function classReminderEmail(name: string, courseTitle: string, sessionTitle: string, dateStr: string, time: string, joinUrl?: string): EmailContent {
  const body = `<p>Hi ${name},</p>
    <p>This is a reminder for your upcoming session in <strong>${courseTitle}</strong>.</p>
    <p><strong>${sessionTitle}</strong><br/>${dateStr} · ${time}</p>
    ${joinUrl ? ctaButton("Join the session", joinUrl) : badge("See you there")}`;
  return { subject: `Reminder: ${sessionTitle} — ${dateStr}`, html: shell("Upcoming session", body) };
}

// ── Corporate / B2B ──────────────────────────────────────────
export function corporateLeadAckEmail(contactName: string, organisation: string): EmailContent {
  const body = `<p>Hi ${contactName},</p>
    <p>Thank you for your training enquiry on behalf of <strong>${organisation}</strong>. A LANI Academy consultant will review your requirements and get back to you within 48 business hours with a tailored proposal.</p>
    ${badge("Request received")}
    <p>In the meantime, feel free to explore our thematic academies and delivery models on the website.</p>`;
  return { subject: "We've received your training request", html: shell("Thanks for reaching out", body) };
}
