import { dbSendEmail } from "./db";
import { twoFactorCodeEmail } from "./emailTemplates";

// Enable email 2FA by setting VITE_ENABLE_2FA=true in your .env.
// Off by default so login keeps working until you connect Resend.
export const TWO_FACTOR_ENABLED =
  (import.meta.env.VITE_ENABLE_2FA as string | undefined) === "true";

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Emails a one-time code. Returns whether the email was actually sent
// (false if Resend isn't configured yet — the app still functions).
export async function sendOtpEmail(to: string, name: string, code: string): Promise<boolean> {
  const mail = twoFactorCodeEmail(name, code);
  return dbSendEmail(to, mail.subject, mail.html);
}
