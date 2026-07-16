"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NavAuth from "@/components/NavAuth";
import styles from "@/app/search/search.module.css";

export default function SearchNav({ query }) {
  const [value, setValue] = useState(query || "");
  const router = useRouter();

  function goToSearch() {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      goToSearch();
    }
  }

  function handleClear() {
    setValue("");
    router.push("/");
  }

  return (
    <nav>
      <Link href="/" className={`logo ${styles.logoLink}`}>
        ani<span>index</span>
      </Link>
      <div className={styles.searchWrap}>
        <svg
          className={styles.searchIcon}
          onClick={goToSearch}
          role="button"
          aria-label="Search"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          className={styles.searchBarInput}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <span className={styles.searchClear} onClick={handleClear}>
          ×
        </span>
      </div>
      <div className="nav-right">
        <NavAuth />
        <Link href="/submit" className="btn btn-primary">
          Submit content
        </Link>
      </div>
    </nav>
  );
}
