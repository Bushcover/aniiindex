"use client";

import { useState } from "react";

// Nested inside ContentCard's default (arc-page) render path, on any card
// with a real content_items id. Flagging doesn't remove the card from the
// page the visitor is currently looking at (this app has no client-side
// data refetch/removal wiring elsewhere either — see PROJECT.md) — it just
// records the flag; the item stops appearing on the *next* load, once
// getArcContent's status allowlist excludes it. Nested inside the card's
// own <a>, so its click handler must stop the click from bubbling into
// that link.
export default function FlagButton({ id }) {
  const [state, setState] = useState("idle"); // idle | loading | done | error

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (state === "loading" || state === "done") return;
    setState("loading");
    try {
      const res = await fetch("/api/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Flag failed");
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <span className="flag-btn flag-btn-done" aria-label="Flagged">
        🚩 Flagged
      </span>
    );
  }

  // Session 19: a failed request used to fall through to the same plain
  // 🚩 icon as the idle state, with nothing visibly different — from the
  // outside, a real server-side failure (e.g. an RLS-blocked write) looked
  // exactly like "clicking the flag icon does nothing." This renders a
  // distinct label on error so a failure is never invisible again.
  return (
    <button
      type="button"
      className="flag-btn"
      onClick={handleClick}
      disabled={state === "loading"}
      aria-label={state === "error" ? "Flagging failed, try again" : "Flag this item"}
      title={state === "error" ? "Flagging failed — try again" : "Flag this item"}
    >
      {state === "loading" ? "…" : state === "error" ? "⚠" : "🚩"}
    </button>
  );
}
