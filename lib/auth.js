import { supabase } from "./supabase";

// Sends a magic-link email via Supabase Auth's OTP flow. No password is
// ever created or checked — clicking the emailed link is the whole
// sign-in. Throws on failure so callers (the /auth page) can show a real
// error instead of silently doing nothing.
//
// A 6-digit-code variant of this flow was tried in Session 15 and
// reverted in Session 16: sending a code instead of a link requires
// editing the Magic Link email template to use {{ .Token }} instead of
// {{ .ConfirmationURL }} (there's no client-side option for this — see
// the Session 15 follow-up notes in PROJECT.md), and that template editor
// is a paid-plan feature in Supabase. This project is on the free plan
// without custom SMTP, so a magic link is the only sign-in email this app
// can actually send.
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
