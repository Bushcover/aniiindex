"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import styles from "../auth.module.css";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function completeSignIn() {
      const code = searchParams.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        router.replace("/");
        return;
      }

      // No `code` param — either an older/implicit-flow magic link (whose
      // session Supabase's client already parsed from the URL's hash
      // fragment on load, via detectSessionInUrl) or a genuinely broken
      // link. Either way, whether a session now exists is what actually
      // tells the two apart.
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessionError) {
        setError(sessionError.message);
        return;
      }
      if (data.session) {
        router.replace("/");
        return;
      }
      setError("This magic link is invalid or has expired.");
    }

    completeSignIn();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <div className={styles.card}>
      <span className={`logo ${styles.logoLink}`}>
        ani<span>index</span>
      </span>
      {error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <p className={styles.subheading}>Signing you in…</p>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className={styles.wrap}>
      <Suspense
        fallback={
          <div className={styles.card}>
            <span className={`logo ${styles.logoLink}`}>
              ani<span>index</span>
            </span>
            <p className={styles.subheading}>Signing you in…</p>
          </div>
        }
      >
        <CallbackContent />
      </Suspense>
    </div>
  );
}
