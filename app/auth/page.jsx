"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmail, verifyOtp } from "@/lib/auth";
import styles from "./auth.module.css";

export default function AuthPage() {
  const router = useRouter();
  const [step, setStep] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  async function handleSendCode(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus("loading");
    setError("");
    try {
      await signInWithEmail(trimmed);
      setCode("");
      setStatus("idle");
      setStep("code");
    } catch (err) {
      setError(err.message || "Couldn't send the code. Please try again.");
      setStatus("error");
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    setStatus("loading");
    setError("");
    try {
      await verifyOtp(email.trim(), trimmed);
      router.replace("/");
    } catch (err) {
      setError(err.message || "That code didn't work. Please try again.");
      setStatus("error");
    }
  }

  function handleUseDifferentEmail() {
    setStep("email");
    setCode("");
    setStatus("idle");
    setError("");
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Link href="/" className={`logo ${styles.logoLink}`}>
          ani<span>index</span>
        </Link>

        {step === "email" ? (
          <>
            <h1 className={styles.heading}>Sign in to contribute</h1>
            <p className={styles.subheading}>
              We will send a 6-digit code to your email — no password needed
            </p>
            <form className={styles.form} onSubmit={handleSendCode}>
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
                {status === "loading" ? "Sending…" : "Send code"}
              </button>
            </form>
          </>
        ) : (
          <>
            <h1 className={styles.heading}>Enter your code</h1>
            <p className={styles.subheading}>
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <form className={styles.form} onSubmit={handleVerifyCode}>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                maxLength={6}
                required
                placeholder="123456"
                className={`${styles.input} ${styles.codeInput}`}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={status === "loading"}
              />
              {status === "error" && <div className={styles.error}>{error}</div>}
              <button
                type="submit"
                className={styles.button}
                disabled={status === "loading" || code.length !== 6}
              >
                {status === "loading" ? "Verifying…" : "Verify code"}
              </button>
            </form>
            <button type="button" className={styles.secondaryAction} onClick={handleUseDifferentEmail}>
              ← Use a different email
            </button>
          </>
        )}
      </div>
    </div>
  );
}
