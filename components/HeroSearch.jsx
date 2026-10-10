"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css";

// Session 64: One Piece added first — the primary community this app is
// being seeded for, per direct instruction — replacing "Hunter x Hunter".
// Every term here is verified against the exact query searchSeries()
// sends (lib/anilist.js's SEARCH_SERIES_QUERY — AniList title search,
// type: ANIME, popularity_greater: 1000, same verification method as
// Session 61/62) to resolve to the correct real entry: "One Piece" ->
// id 21 (the main series, not a film), "Shibuya Incident" -> Jujutsu
// Kaisen, "Attack on Titan"/"Chainsaw Man"/"Jujutsu Kaisen" -> their own
// main entries. Whether each one has real *seeded arcs* in Supabase
// (vs. just resolving to the right series) can't be independently
// confirmed from this sandbox — no live Supabase credentials exist
// here, and real content seeding happens directly against production,
// outside any session logged in PROJECT.md.
const QUICK_SEARCHES = ["One Piece", "Shibuya Incident", "Attack on Titan", "Chainsaw Man", "Jujutsu Kaisen"];

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
