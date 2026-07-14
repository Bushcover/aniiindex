"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css";

const QUICK_SEARCHES = ["Shibuya Incident", "Gojo Satoru", "Wano Arc", "Chainsaw Man", "Chimera Ant Arc"];

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
