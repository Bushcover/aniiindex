"use client";

// Session 56 (Phase 8 final QA): the arc page's nav ".search-bar" has been a
// purely decorative div (icon + static placeholder text, no <input>, no
// handler) since it was first added in Session 3 as part of the original
// hardcoded mockup — confirmed against PROJECT.md's own Session 3 log entry,
// which explicitly noted the arc page's search bar was a placeholder while
// the search page's was real. It was never revisited because nothing in the
// intervening 53 sessions touched arc-page search specifically. This QA
// pass's checklist requires "search works... from every page", so this
// makes it a real input, matching SearchNav.jsx's Enter-to-navigate
// behavior used on the search/series pages — reusing the existing
// ".search-bar" container class (app/globals.css:117) rather than adding
// new styles, so the visual layout stays exactly as it was.
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArcSearchBar() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleKeyDown(e) {
    if (e.key !== "Enter") return;
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="search-bar">
      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search series, arcs, characters…"
        aria-label="Search series, arcs, characters"
        className="arc-search-input"
      />
    </div>
  );
}
