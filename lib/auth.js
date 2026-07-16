import { supabase } from "./supabase";

// Sends a 6-digit one-time code by email via Supabase Auth's OTP flow. No
// password is ever created or checked. shouldCreateUser: true means a
// brand-new email signs up the same way an existing one signs in — there's
// no separate sign-up flow in this app. Throws on failure so callers (the
// /auth page) can show a real error instead of silently doing nothing.
export async function signInWithEmail(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
  return data;
}

// Verifies the 6-digit code from signInWithEmail's email and establishes a
// real session on success. Throws on failure (wrong/expired code) so the
// caller can show an inline error and let the user retry.
export async function verifyOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Returns the current session, or null if signed out. Swallows the error
// case rather than throwing, since every caller so far just wants "is
// someone signed in right now" and would otherwise need its own try/catch
// for what's normally just an empty/anonymous session.
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("[lib/auth] getSession error:", error.message);
    return null;
  }
  return data.session ?? null;
}
