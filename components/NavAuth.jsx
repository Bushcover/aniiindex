"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getSession, signOut } from "@/lib/auth";

// Renders the auth-dependent slice of a page's nav: a "Sign in" link to
// /auth when signed out, or the signed-in user's email + a "Sign out"
// button when signed in. Client-only, since it needs to read the browser's
// Supabase session — every page's nav is otherwise a server component.
export default function NavAuth({ signInClassName = "btn btn-ghost" }) {
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getSession().then((s) => {
      if (cancelled) return;
      setSession(s);
      setLoaded(true);
    });

    // Keeps the nav in sync after a magic-link redirect lands on /auth/callback
    // (a full navigation, not a re-mount of this component) and after
    // sign-out, without needing a page reload either time.
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoaded(true);
    });

    return () => {
      cancelled = true;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error("[NavAuth] sign out failed:", err.message);
    } finally {
      setSigningOut(false);
    }
  }

  // Renders nothing until the initial session check resolves, rather than
  // flashing "Sign in" and then possibly swapping to the signed-in state a
  // moment later.
  if (!loaded) return null;

  if (session) {
    return (
      <>
        <span className="nav-auth-email">{session.user.email}</span>
        <button className="btn btn-ghost" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </>
    );
  }

  return (
    <Link href="/auth" className={signInClassName}>
      Sign in
    </Link>
  );
}
