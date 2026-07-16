"use client";

import { useState } from "react";

// Nested inside ContentCard's default (arc-page) render path, on any card
// with a real content_items id. Session 20: on success, calls onFlagged(id)
// so BeatSection (which owns the actual list of rendered cards) can filter
// this item out immediately — this component can hide itself, but it can't
// remove its own sibling cards' layout gap or update the beat's item count,
// so the real removal is lifted up rather than handled locally. Nested
// inside the card's own <a>, so its click handler must stop the click from
// bubbling into that link.
export default function FlagButton({ id, onFlagged }) {
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
      onFlagged?.(id);
    } catch {
      setState("error");
    }
  }

  // In practice, on the arc page this branch is unreachable — BeatSection
  // unmounts the whole card the instant onFlagged fires above, before this
  // re-render would ever paint. Kept as a defensive fallback for any
  // future caller that renders FlagButton without wiring up onFlagged.
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
