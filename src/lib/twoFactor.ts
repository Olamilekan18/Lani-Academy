import { supabase } from "./supabase";

// Email 2FA. Enable by setting VITE_ENABLE_2FA=true in your .env.
// Off by default so login keeps working until you connect Resend + deploy the
// auth-otp Edge Function.
//
// Security: the one-time code is generated, stored (hashed), and verified
// entirely SERVER-SIDE by the auth-otp Edge Function. The browser never sees
// or checks the code — the previous client-side implementation was bypassable.
export const TWO_FACTOR_ENABLED =
  (import.meta.env.VITE_ENABLE_2FA as string | undefined) === "true";

// Ask the server to generate + email a fresh code. Returns whether the email
// was actually sent (false if Resend/OTP function isn't configured yet).
export async function requestOtp(email: string, name: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.functions.invoke("auth-otp", {
      body: { action: "issue", email, name },
    });
    if (error) {
      console.warn("OTP request failed:", error.message);
      return false;
    }
    return Boolean((data as { sent?: boolean })?.sent);
  } catch (e) {
    console.warn("OTP function unavailable:", e);
    return false;
  }
}

// Verify a code the user typed. Returns true only if the server confirms it.
export async function verifyOtp(email: string, code: string): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.functions.invoke("auth-otp", {
      body: { action: "verify", email, code },
    });
    if (error) {
      console.warn("OTP verify failed:", error.message);
      return false;
    }
    return Boolean((data as { verified?: boolean })?.verified);
  } catch (e) {
    console.warn("OTP function unavailable:", e);
    return false;
  }
}
