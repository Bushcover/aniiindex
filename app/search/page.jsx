import Link from "next/link";
import ContentCard from "@/components/ContentCard";
import Sparkline from "@/components/Sparkline";
import styles from "./search.module.css";

const SERIES = {
  slug: "chainsaw-man",
  eyebrow: "✦ Series match",
  name: "Chainsaw Man",
  author: "Tatsuki Fujimoto",
  years: "2018 (manga) · 2022 (anime)",
  tags: ["Action", "Dark fantasy", "Seinen"],
  accent: "#CC2828",
  accentSoft: "rgba(204,40,40,0.12)",
  sparkHigh: "rgba(204,40,40,0.35)",
  sparkPeak: "rgba(204,40,40,0.65)",
  stats: [
    { value: "11", label: "Arcs indexed" },
    { value: "6,847", label: "Fan items" },
    { value: "34,201", label: "Saves" },
    { value: "892", label: "This week" },
  ],
};

const RESULTS_SUMMARY = "11 arcs · 22 characters · 6,847 fan items";

const FILTERS = [
  { label: "All", count: 6847, active: true },
  { label: "Arcs", count: 11 },
  { label: "Characters", count: 22 },
  { label: "Edits & video", count: 2891 },
  { label: "Fan art", count: 2344 },
  { label: "Discussion", count: 1612 },
];

const ARCS = [
  {
    slug: "introduction-arc",
    num: "01",
    name: "Introduction Arc",
    count: 341,
    peak: false,
    spark: [
      { heightPct: 30, tier: "normal" },
      { heightPct: 55, tier: "high" },
      { heightPct: 70, tier: "high" },
      { heightPct: 45, tier: "normal" },
      { heightPct: 35, tier: "normal" },
    ],
  },
  {
    slug: "bat-devil-arc",
    num: "02",
    name: "Bat Devil Arc",
    count: 456,
    peak: false,
    spark: [
      { heightPct: 28, tier: "normal" },
      { heightPct: 50, tier: "high" },
      { heightPct: 85, tier: "peak" },
      { heightPct: 60, tier: "high" },
      { heightPct: 40, tier: "normal" },
    ],
  },
  {
    slug: "eternity-devil-arc",
    num: "03",
    name: "Eternity Devil Arc",
    count: 678,
    peak: false,
    spark: [
      { heightPct: 25, tier: "normal" },
      { heightPct: 38, tier: "normal" },
      { heightPct: 62, tier: "high" },
      { heightPct: 90, tier: "peak" },
      { heightPct: 65, tier: "high" },
    ],
  },
  {
    slug: "katana-man-arc",
    num: "04",
    name: "Katana Man Arc",
    count: 1102,
    peak: true,
    spark: [
      { heightPct: 55, tier: "high" },
      { heightPct: 88, tier: "peak" },
      { heightPct: 70, tier: "high" },
      { heightPct: 95, tier: "peak" },
      { heightPct: 72, tier: "high" },
    ],
  },
  {
    slug: "bomb-girl-arc",
    num: "05",
    name: "Bomb Girl Arc",
    count: 1893,
    peak: true,
    spark: [
      { heightPct: 30, tier: "normal" },
      { heightPct: 52, tier: "high" },
      { heightPct: 68, tier: "high" },
      { heightPct: 100, tier: "peak" },
      { heightPct: 78, tier: "high" },
    ],
  },
  {
    slug: "international-assassins-arc",
    num: "06",
    name: "International Assassins Arc",
    count: 934,
    peak: false,
    spark: [
      { heightPct: 48, tier: "high" },
      { heightPct: 62, tier: "high" },
      { heightPct: 70, tier: "high" },
      { heightPct: 92, tier: "peak" },
      { heightPct: 74, tier: "high" },
    ],
  },
  {
    slug: "hell-arc",
    num: "07",
    name: "Hell Arc",
    count: 1120,
    peak: true,
    dividerAfter: true,
    spark: [
      { heightPct: 55, tier: "high" },
      { heightPct: 65, tier: "high" },
      { heightPct: 90, tier: "peak" },
      { heightPct: 78, tier: "high" },
      { heightPct: 60, tier: "high" },
    ],
  },
  {
    slug: "control-devil-arc",
    num: "08",
    name: "Control Devil Arc",
    count: 2341,
    peak: true,
    spark: [
      { heightPct: 60, tier: "high" },
      { heightPct: 95, tier: "peak" },
      { heightPct: 78, tier: "high" },
      { heightPct: 100, tier: "peak" },
      { heightPct: 82, tier: "high" },
    ],
  },
];

const MORE_ARCS_LABEL = "+ 3 more arcs — Part 2 manga arcs";

const ALSO_FOUND = [
  { type: "Manga", name: "Chainsaw Man Part 2", count: "4 arcs · 2,341 items" },
  { type: "OST", name: "Chainsaw Man Original Soundtrack", count: "304 items" },
  { type: "Related", name: "Tatsuki Fujimoto Works", count: "Fire Punch · Look Back · +3" },
];

const CHARACTERS = [
  { initials: "DE", color: "#CC2828", name: "Denji", count: 1892 },
  { initials: "PO", color: "#D45E8A", name: "Power", count: 1543 },
  { initials: "MA", color: "#6A3A3A", name: "Makima", count: 2101 },
  { initials: "AK", color: "#4A6A8A", name: "Aki Hayakawa", count: 1234 },
  { initials: "KO", color: "#8A7A2A", name: "Kobeni", count: 678 },
  { initials: "KI", color: "#5A6A5A", name: "Kishibe", count: 445 },
  { initials: "RE", color: "#3A6A6A", name: "Reze", count: 891 },
  { initials: "QU", color: "#6A3A8A", name: "Quanxi", count: 567 },
];

const MORE_CHARACTERS_COUNT = 14;

const TOP_CONTENT = [
  {
    title: "Power's final moments edit. Not okay. Never will be okay.",
    creator: "@jjkfeels_ · 4.2M views",
    platform: "tt",
    thumbnailUrl: "linear-gradient(135deg,#1a0505,#2d0808)",
    contentType: ["Edit"],
    characterTags: ["Power", "Denji"],
    sourceUrl: "#",
  },
  {
    title: "Every hint that Makima was the Control Devil — a full rewatch breakdown",
    creator: "@animedepth · 891K views",
    platform: "yt",
    thumbnailUrl: "linear-gradient(135deg,#0d0505,#180808)",
    contentType: ["Breakdown"],
    characterTags: ["Makima"],
    sourceUrl: "#",
  },
  {
    title: "Spent 2 months drawing every main character in Fujimoto's original style",
    creator: "@art.by.hana · 124K likes",
    platform: "x",
    thumbnailUrl: "linear-gradient(135deg,#150508,#200808)",
    contentType: ["Fan art", "Series"],
    characterTags: [],
    sourceUrl: "#",
  },
  {
    title: "Chainsaw Man OST every track ranked and explained — why it hits different",
    creator: "@soundofanime · 234K views",
    platform: "yt",
    thumbnailUrl: "linear-gradient(135deg,#100408,#1a0508)",
    contentType: ["OST", "Analysis"],
    characterTags: [],
    sourceUrl: "#",
  },
];

export default function SearchPage() {
  return (
    <>
      <nav>
        <div className="logo">
          ani<span>index</span>
        </div>
        <div className={styles.searchWrap}>
          <svg
            className={styles.searchIcon}
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
          <input className={styles.searchBarInput} type="text" defaultValue={SERIES.name} />
          <span className={styles.searchClear}>×</span>
        </div>
        <div className="nav-right">
          <button className="btn btn-ghost">Sign in</button>
          <Link href="/submit" className="btn btn-primary">
            Submit content
          </Link>
        </div>
      </nav>

      <div className={styles.resultsHeader}>
        <div>
          <div className={styles.resultsQuery}>
            Results for <strong>&quot;{SERIES.name}&quot;</strong>
          </div>
          <div className={styles.resultsCount}>{RESULTS_SUMMARY}</div>
        </div>
        <div className={styles.typeFilters}>
          {FILTERS.map((filter) => (
            <div
              key={filter.label}
              className={`${styles.filterPill}${filter.active ? ` ${styles.filterPillActive}` : ""}`}
            >
              {filter.label} <span className={styles.pillCount}>{filter.count.toLocaleString("en-US")}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="container"
        style={{
          "--series-accent": SERIES.accent,
          "--series-accent-soft": SERIES.accentSoft,
          "--series-spark-high": SERIES.sparkHigh,
          "--series-spark-peak": SERIES.sparkPeak,
        }}
      >
        <div className={styles.seriesPanel}>
          <div className={styles.seriesPanelBody}>
            <div className={styles.seriesInfo}>
              <div className={styles.seriesEyebrow}>{SERIES.eyebrow}</div>
              <div className={styles.seriesName}>{SERIES.name}</div>
              <div className={styles.seriesMeta}>
                <span>{SERIES.author}</span>
                <span className={styles.dot}>·</span>
                <span>{SERIES.years}</span>
                <span className={styles.dot}>·</span>
                {SERIES.tags.map((tag) => (
                  <span key={tag} className={styles.seriesTag}>
                    {tag}
                  </span>
                ))}
              </div>
              <div className={styles.seriesStats}>
                {SERIES.stats.map((stat) => (
                  <div key={stat.label} className={styles.sstat}>
                    <div className={styles.sstatVal}>{stat.value}</div>
                    <div className={styles.sstatLabel}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.seriesActions}>
              <button className={`${styles.seriesBtn} ${styles.seriesBtnPrimary}`}>Browse arcs</button>
              <button className={`${styles.seriesBtn} ${styles.seriesBtnGhost}`}>Characters</button>
            </div>
          </div>
        </div>

        <div className={styles.twoCol}>
          <div>
            <div className={styles.colTitle}>Arcs</div>
            <div className={styles.colSub}>Each bar shows community response intensity across story beats</div>

            <div className={styles.arcList}>
              {ARCS.map((arc) => (
                <div key={arc.slug}>
                  <Link href={`/arc/${arc.slug}`} className={styles.arcRow}>
                    <div className={styles.arcNum}>{arc.num}</div>
                    <div className={styles.arcRowName}>{arc.name}</div>
                    <Sparkline bars={arc.spark} />
                    <div className={styles.arcRowCount}>{arc.count.toLocaleString("en-US")}</div>
                    {arc.peak && (
                      <div className={styles.arcRowPeak}>
                        <div className={styles.arcPeakDot}></div>
                      </div>
                    )}
                    <div className={styles.arcRowArrow}>›</div>
                  </Link>
                  {arc.dividerAfter && <div className={styles.arcDivider}></div>}
                </div>
              ))}

              <div className={styles.showMore}>
                <span>{MORE_ARCS_LABEL}</span>
              </div>
            </div>

            <div className={styles.alsoFound}>
              <div className={styles.colTitle} style={{ marginBottom: 12 }}>
                Also found
              </div>
              <div className={styles.arcList}>
                {ALSO_FOUND.map((item) => (
                  <div key={item.name} className={styles.alsoRow}>
                    <div className={styles.alsoType}>{item.type}</div>
                    <div className={styles.alsoName}>{item.name}</div>
                    <div className={styles.alsoCount}>{item.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className={styles.colTitle}>Characters</div>
            <div className={styles.colSub} style={{ marginBottom: 14 }}>
              Filter any arc page by character
            </div>
            <div className={styles.charsGrid}>
              {CHARACTERS.map((char) => (
                <a key={char.name} className={styles.charChip} href="#">
                  <div className={styles.charAv} style={{ background: char.color }}>
                    {char.initials}
                  </div>
                  {char.name} <span className={styles.charCount}>{char.count.toLocaleString("en-US")}</span>
                </a>
              ))}
              <div className={styles.moreChars}>+{MORE_CHARACTERS_COUNT} more</div>
            </div>

            <div style={{ height: 1, background: "var(--border)", marginBottom: 20 }}></div>

            <div className={styles.colTitle} style={{ marginBottom: 6 }}>
              Top content this week
            </div>
            <div className={styles.colSub} style={{ marginBottom: 14 }}>
              Most saved across all {SERIES.name} arcs
            </div>

            <div className={styles.topContent}>
              {TOP_CONTENT.map((item, i) => (
                <ContentCard key={i} compact {...item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
