import { supabase } from "./supabase";

// Sends a magic-link email via Supabase Auth's OTP flow. No password is
// ever created or checked — clicking the emailed link is the whole sign-in.
// Throws on failure so callers (the /auth page) can show a real error
// instead of silently doing nothing.
export async function signInWithEmail(email) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
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
