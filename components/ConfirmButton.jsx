"use client";

import { useState } from "react";

// Nested inside ContentCard's default (arc-page) render path, on a card
// whose status is "pending". Confirming is a lightweight, no-auth "another
// viewer thinks this belongs here" signal — content_items has no per-user
// confirmation ledger, so this can't stop the same visitor confirming their
// own click twice, only report what app/api/confirm/route.js actually did.
// The card's own <a> wraps this button (the whole card links to
// sourceUrl), so every handler here must stop the click from bubbling up
// into that link.
//
// Session 53: `awaitingSecond` (from ContentCard, true when
// confirmation_count is already 1) only changes the *idle*-state
// label/styling below, to a muted "Awaiting second confirmation" —
// giving the person who already confirmed a refresh-persistent signal
// that their click was recorded, instead of a full, prominent "Confirm
// placement" CTA that looks like nothing happened. Deliberately still
// the exact same clickable control underneath, not a static label — see
// ContentCard.jsx's own comment for why turning this into a dead end
// once count reaches 1 would break the only path this app has for a
// second, genuinely different confirmation to ever land. Once clicked,
// this behaves identically regardless of `awaitingSecond` — the
// loading/error/done states below don't reference it at all.
export default function ConfirmButton({ id, onConfirmed, awaitingSecond = false }) {
  const [state, setState] = useState("idle"); // idle | loading | done | error

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state === "loading" || state === "done") return;
    setState("loading");
    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Confirm failed");
      setState("done");
      // Session 20 (moved up to ArcContent in a later bug fix — see its
      // own comment): tells the caller to record this id as confirmed,
      // hiding the pending badge and this button immediately —
      // ContentCard re-renders with isPending false before this
      // component's own "done" branch below ever gets painted, so in
      // practice this button disappears rather than showing "✓ Confirmed".
      // That branch stays as a defensive fallback for any future caller
      // that doesn't wire up onConfirmed. Only called after the fetch
      // above has resolved and res.ok has been checked — never
      // optimistically ahead of the API call itself.
      onConfirmed?.();
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <span className="confirm-btn confirm-btn-done">✓ Confirmed</span>;
  }

  const isAwaitingIdle = awaitingSecond && state === "idle";

  return (
    <button
      type="button"
      className={`confirm-btn${isAwaitingIdle ? " confirm-btn-awaiting" : ""}`}
      onClick={handleClick}
      disabled={state === "loading"}
      title={isAwaitingIdle ? "A second confirmation is still needed — click to add yours" : undefined}
    >
      {state === "loading"
        ? "Confirming…"
        : state === "error"
        ? "Try again"
        : isAwaitingIdle
        ? "Awaiting second confirmation"
        : "✓ Confirm placement"}
    </button>
  );
}
