"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css";

// Session 63: Session 61's arc/movie-title chips ("Mugen Train", "Reze
// Arc", "Greed Island") each matched a real AniList entry, but a
// *separate* one from the main TV series — a movie/special with its own
// id, not the id this project's real seeded arcs are actually stored
// under — so clicking them could land on a real series panel for the
// wrong entry with no arc list, confusing rather than clean. Replaced
// with plain series titles instead: searching the show's own name
// always resolves straight to its main entry, the one real seeded arcs
// are actually attached to. "Shibuya Incident" and "Attack on Titan"
// kept as requested (both already real, arc-name and series-name
// respectively); "Chainsaw Man", "Jujutsu Kaisen", "Hunter x Hunter"
// added as the other three.
const QUICK_SEARCHES = ["Shibuya Incident", "Attack on Titan", "Chainsaw Man", "Jujutsu Kaisen", "Hunter x Hunter"];

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
