"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css";

// Each of these is verified to return a real AniList match against the
// exact query searchSeries() sends (lib/anilist.js's SEARCH_SERIES_QUERY
// — title search, type: ANIME, popularity_greater: 1000), not just
// assumed to work because the arc itself is plausible-sounding — AniList
// searches real anime *titles*, not arc names, so most arc-only phrases
// (the previous "Wano Arc"/"Chimera Ant Arc", and three of the five
// originally requested replacements — "Marineford War", "Enies Lobby",
// "Chimera Ant" — all return zero results from that exact query,
// confirmed directly). "Shibuya Incident" and "Mugen Train" were kept as
// requested (both verified); "Reze Arc" (Chainsaw Man: Reze-hen) and
// "Greed Island" (HUNTER×HUNTER: Greed Island) replace the two broken
// One-Piece-arc names with real, correctly-matching Chainsaw Man/Hunter
// x Hunter titles instead; "Attack on Titan" (a full series title,
// since no AOT arc-name phrasing tested — "The Rumbling" — matched the
// right show) fills the fifth slot.
const QUICK_SEARCHES = ["Shibuya Incident", "Mugen Train", "Reze Arc", "Greed Island", "Attack on Titan"];

export default function HeroSearch() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function goToSearch(query) {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      goToSearch(value);
    }
  }

  function handleChipClick(chip) {
    setValue(chip);
    goToSearch(chip);
  }

  return (
    <>
      <div className={styles.searchWrap}>
        <svg
          className={styles.searchIcon}
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className={styles.searchMain}
          type="text"
          placeholder="Search an anime, arc, or character…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className={styles.searchKbd}>
          <span>⌘</span>
          <span>K</span>
        </div>
      </div>

      <div className={styles.quickSearch}>
        <span className={styles.qsLabel}>Try:</span>
        {QUICK_SEARCHES.map((chip) => (
          <span key={chip} className={styles.qsChip} onClick={() => handleChipClick(chip)}>
            {chip}
          </span>
        ))}
      </div>
    </>
  );
}
