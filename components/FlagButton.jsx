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

  return (
    <button
      type="button"
      className="flag-btn"
      onClick={handleClick}
      disabled={state === "loading"}
      aria-label="Flag this item"
      title="Flag this item"
    >
      🚩
    </button>
  );
}
