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
export default function ConfirmButton({ id }) {
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
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <span className="confirm-btn confirm-btn-done">✓ Confirmed</span>;
  }

  return (
    <button type="button" className="confirm-btn" onClick={handleClick} disabled={state === "loading"}>
      {state === "loading" ? "Confirming…" : state === "error" ? "Try again" : "✓ Confirm placement"}
    </button>
  );
}
