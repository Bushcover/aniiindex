"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmail } from "@/lib/auth";
import styles from "./auth.module.css";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | success | error
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("loading");
    setError("");
    try {
      await signInWithEmail(trimmed);
      setStatus("success");
    } catch (err) {
      setError(err.message || "Couldn't send the magic link. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Link href="/" className={`logo ${styles.logoLink}`}>
          ani<span>index</span>
        </Link>

        {status === "success" ? (
          <div className={styles.success}>
            <div className={styles.successIcon}>✓</div>
            <p className={styles.successText}>
              Check your email — we sent a magic link to <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <>
            <h1 className={styles.heading}>Sign in to contribute</h1>
            <p className={styles.subheading}>
              We will send a magic link to your email — no password needed
            </p>
            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                type="email"
                required
                placeholder="you@example.com"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "loading"}
              />
              {status === "error" && <div className={styles.error}>{error}</div>}
              <button type="submit" className={styles.button} disabled={status === "loading"}>
                {status === "loading" ? "Sending…" : "Send magic link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
