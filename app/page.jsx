import Link from "next/link";
import Sparkline from "@/components/Sparkline";
import HeroSearch from "@/components/HeroSearch";
import NavAuth from "@/components/NavAuth";
import styles from "./page.module.css";

const NAV_LINKS = [
  { label: "Browse", active: true },
  { label: "Series" },
  { label: "Characters" },
  { label: "Seasonal" },
];

const HERO_STATS = [
  { value: "14,200+", label: "Arcs indexed" },
  { value: "892K", label: "Fan items" },
  { value: "2.1M", label: "Saves" },
  { value: "48K", label: "Contributors" },
];

const TRENDING_ARCS = [
  {
    slug: "shibuya-incident-arc",
    seriesDotColor: "#7B6CF6",
    seriesLabel: "Jujutsu Kaisen · S2",
    name: "Shibuya Incident Arc",
    metaLine: "Episodes 38–47 · Oct 2023",
    spark: [
      { heightPct: 28, tier: "normal" },
      { heightPct: 35, tier: "normal" },
      { heightPct: 55, tier: "high" },
      { heightPct: 62, tier: "high" },
      { heightPct: 87, tier: "peak" },
      { heightPct: 70, tier: "high" },
      { heightPct: 100, tier: "peak" },
      { heightPct: 78, tier: "high" },
      { heightPct: 42, tier: "normal" },
    ],
    count: 2847,
    platforms: [
      { color: "#FF0000", label: "YouTube" },
      { color: "#010101", label: "TikTok" },
      { color: "#1D9BF0", label: "Twitter" },
    ],
    peakLabel: "Peak: Yuji's breakdown",
  },
  {
    slug: "the-rumbling-arc",
    seriesDotColor: "#F0706A",
    seriesLabel: "Attack on Titan · Final Season",
    name: "Rumbling Arc",
    metaLine: "Episodes 87–96 · Jan 2023",
    spark: [
      { heightPct: 55, tier: "high" },
      { heightPct: 65, tier: "high" },
      { heightPct: 90, tier: "peak" },
      { heightPct: 75, tier: "high" },
      { heightPct: 100, tier: "peak" },
      { heightPct: 80, tier: "high" },
      { heightPct: 95, tier: "peak" },
      { heightPct: 72, tier: "high" },
      { heightPct: 50, tier: "normal" },
    ],
    count: 3412,
    platforms: [{ color: "#FF0000" }, { color: "#010101" }, { color: "#FF4500" }],
    peakLabel: "Peak: The Titans march",
  },
  {
    slug: "bomb-girl-arc",
    seriesDotColor: "#F0706A",
    seriesLabel: "Chainsaw Man · S1",
    name: "Bomb Girl Arc",
    metaLine: "Episodes 7–9 · Nov 2022",
    spark: [
      { heightPct: 30, tier: "normal" },
      { heightPct: 52, tier: "high" },
      { heightPct: 68, tier: "high" },
      { heightPct: 100, tier: "peak" },
      { heightPct: 78, tier: "high" },
      { heightPct: 40, tier: "normal" },
      { heightPct: 32, tier: "normal" },
      { heightPct: 28, tier: "normal" },
      { heightPct: 22, tier: "normal" },
    ],
    count: 1893,
    platforms: [{ color: "#010101" }, { color: "#E1306C" }, { color: "#1D9BF0" }],
    peakLabel: "Peak: Reze's reveal",
  },
  {
    slug: "swordsmith-village-arc",
    seriesDotColor: "#6AF0C8",
    seriesLabel: "Demon Slayer · S3",
    name: "Swordsmith Village Arc",
    metaLine: "Episodes 45–55 · Apr 2023",
    spark: [
      { heightPct: 22, tier: "normal" },
      { heightPct: 34, tier: "normal" },
      { heightPct: 58, tier: "high" },
      { heightPct: 72, tier: "high" },
      { heightPct: 80, tier: "high" },
      { heightPct: 100, tier: "peak" },
      { heightPct: 85, tier: "high" },
      { heightPct: 65, tier: "high" },
      { heightPct: 40, tier: "normal" },
    ],
    count: 2109,
    platforms: [{ color: "#FF0000" }, { color: "#010101" }, { color: "#E1306C" }],
    peakLabel: "Peak: Hantengu's true form",
  },
  {
    slug: "onigashima-raid",
    seriesDotColor: "#F0A96A",
    seriesLabel: "One Piece · Wano Country Arc",
    name: "Onigashima Raid",
    metaLine: "Episodes 954–1008 · 2021–22",
    spark: [
      { heightPct: 35, tier: "normal" },
      { heightPct: 60, tier: "high" },
      { heightPct: 70, tier: "high" },
      { heightPct: 65, tier: "high" },
      { heightPct: 95, tier: "peak" },
      { heightPct: 80, tier: "high" },
      { heightPct: 100, tier: "peak" },
      { heightPct: 74, tier: "high" },
      { heightPct: 48, tier: "normal" },
    ],
    count: 4201,
    platforms: [{ color: "#FF0000" }, { color: "#FF4500" }, { color: "#1D9BF0" }],
    peakLabel: "Peak: Luffy's awakening",
  },
  {
    slug: "chimera-ant-arc",
    seriesDotColor: "#6AC8F0",
    seriesLabel: "Hunter × Hunter · 2011",
    name: "Chimera Ant Arc",
    metaLine: "Episodes 76–136 · 2013–14",
    spark: [
      { heightPct: 25, tier: "normal" },
      { heightPct: 38, tier: "normal" },
      { heightPct: 55, tier: "high" },
      { heightPct: 70, tier: "high" },
      { heightPct: 78, tier: "high" },
      { heightPct: 82, tier: "high" },
      { heightPct: 100, tier: "peak" },
      { heightPct: 95, tier: "peak" },
      { heightPct: 60, tier: "high" },
    ],
    count: 3788,
    platforms: [{ color: "#FF0000" }, { color: "#FF4500" }, { color: "#1D9BF0" }],
    peakLabel: "Peak: Meruem & Komugi",
  },
];

const POPULAR_SERIES = [
  { name: "Jujutsu Kaisen", gradient: "linear-gradient(160deg,#1a1030,#0d0820)", arcs: 12, items: "9.2K items" },
  { name: "Attack on Titan", gradient: "linear-gradient(160deg,#1a0808,#200d0d)", arcs: 9, items: "14.1K items" },
  { name: "One Piece", gradient: "linear-gradient(160deg,#081520,#0d1a28)", arcs: 30, items: "21.4K items" },
  { name: "Hunter × Hunter", gradient: "linear-gradient(160deg,#0d1a12,#0a1a0f)", arcs: 8, items: "11.2K items" },
  { name: "Chainsaw Man", gradient: "linear-gradient(160deg,#1a0d08,#201008)", arcs: 11, items: "6.8K items" },
  { name: "Demon Slayer", gradient: "linear-gradient(160deg,#100d1a,#0d0a20)", arcs: 7, items: "8.3K items" },
  { name: "Fullmetal Alchemist", gradient: "linear-gradient(160deg,#0d1520,#0a1a25)", arcs: 15, items: "7.6K items" },
  { name: "Vinland Saga", gradient: "linear-gradient(160deg,#1a0a10,#200a12)", arcs: 6, items: "4.1K items" },
];

const TRENDING_MOMENTS = [
  {
    rank: "01",
    top: true,
    name: "Yuji's Breakdown — blood rain sequence",
    series: "Jujutsu Kaisen · Shibuya Incident Arc",
    count: "1,102 items",
    delta: "↑ 234 this week",
  },
  {
    rank: "02",
    top: true,
    name: "Luffy's Gear 5 Awakening",
    series: "One Piece · Onigashima Raid",
    count: "2,441 items",
    delta: "↑ 189 this week",
  },
  {
    rank: "03",
    top: true,
    name: "Meruem's final game with Komugi",
    series: "Hunter × Hunter · Chimera Ant Arc",
    count: "891 items",
    delta: "↑ 156 this week",
  },
  {
    rank: "04",
    top: false,
    name: "The Titans begin their march",
    series: "Attack on Titan · The Rumbling Arc",
    count: "1,340 items",
    delta: "↑ 134 this week",
  },
  {
    rank: "05",
    top: false,
    name: "Nanami's final words to Yuji",
    series: "Jujutsu Kaisen · Shibuya Incident Arc",
    count: "412 items",
    delta: "↑ 98 this week",
  },
];

const FEATURES = [
  { icon: "🔗", title: "Nothing hosted here", text: "Every item links back to the original creator and platform" },
  { icon: "📖", title: "Organized by story beat", text: "Content lives where it belongs in the narrative" },
  { icon: "✦", title: "Attribution first", text: "Creator credit is part of every card, always" },
];

export default function HomePage() {
  return (
    <>
      <nav>
        <Link href="/" className="logo">
          ani<span>index</span>
        </Link>
        <div className={styles.navLinks}>
          {NAV_LINKS.map((link) => (
            <div
              key={link.label}
              className={`${styles.navLink}${link.active ? ` ${styles.navLinkActive}` : ""}`}
            >
              {link.label}
            </div>
          ))}
        </div>
        <div className="nav-right">
          <NavAuth />
          <Link href="/submit" className="btn btn-primary nav-submit-btn" aria-label="Submit content">
            <span className="nav-submit-icon" aria-hidden="true">+</span>
            <span className="nav-submit-text">Submit content</span>
          </Link>
        </div>
      </nav>

      <div className={styles.hero}>
        <div className={styles.heroEyebrow}>✦ Fan content index</div>
        <h1>
          Every arc.
          <br />
          <em>Everything</em> the fandom made for it.
        </h1>
        <p className={styles.heroSub}>
          Fan edits, art, breakdowns and discussion — indexed by arc, organized by story beat. Not hosted, just
          found.
        </p>

        <HeroSearch />

        <div className={styles.heroStats}>
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className={styles.hstat}>
              <div className={styles.hstatVal}>{stat.value}</div>
              <div className={styles.hstatLabel}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>Trending arcs</div>
            <div className={styles.sectionSub}>Most active in the last 7 days</div>
            <div className={styles.sectionLink}>View all →</div>
          </div>
          <div className={styles.arcGrid}>
            {TRENDING_ARCS.map((arc) => (
              <Link key={arc.slug} href={`/arc/${arc.slug}`} className={styles.arcCard}>
                <div className={styles.arcCardTop}>
                  <div className={styles.arcSeriesBadge}>
                    <div className={styles.arcSeriesDot} style={{ background: arc.seriesDotColor }}></div>
                    <div className={styles.arcSeriesName}>{arc.seriesLabel}</div>
                  </div>
                  <div className={styles.arcName}>{arc.name}</div>
                  <div className={styles.arcMetaLine}>{arc.metaLine}</div>
                  <Sparkline bars={arc.spark} width="100%" height="36px" />
                </div>
                <div className={styles.arcCardBottom}>
                  <span className={styles.arcCount}>{arc.count.toLocaleString("en-US")}</span>
                  <span className={styles.arcCountLabel}>items</span>
                  <div className={styles.arcPlatforms}>
                    {arc.platforms.map((platform, i) => (
                      <div
                        key={i}
                        className={styles.pltDot}
                        style={{ background: platform.color }}
                        title={platform.label}
                      ></div>
                    ))}
                  </div>
                  <div className={styles.arcPeak}>✦ {arc.peakLabel}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>Popular series</div>
            <div className={styles.sectionSub}>Browse by series, then drill into arcs</div>
            <div className={styles.sectionLink}>All series →</div>
          </div>
          <div className={styles.seriesScroll}>
            {POPULAR_SERIES.map((series) => (
              <Link
                key={series.name}
                href={`/search?q=${encodeURIComponent(series.name)}`}
                className={styles.seriesCard}
              >
                <div className={styles.seriesPoster} style={{ background: series.gradient }}>
                  <div className={styles.seriesPosterGradient}></div>
                </div>
                <div className={styles.seriesCardBody}>
                  <div className={styles.seriesCardName}>{series.name}</div>
                  <div className={styles.seriesStats}>
                    <span>{series.arcs} arcs</span>
                    <span>·</span>
                    <span>{series.items}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>Trending moments</div>
            <div className={styles.sectionSub}>Story beats with the most new content this week</div>
            <div className={styles.sectionLink}>See all →</div>
          </div>
          <div className={styles.momentList}>
            {TRENDING_MOMENTS.map((moment) => (
              <div key={moment.rank} className={styles.momentRow}>
                <div className={`${styles.momentRank}${moment.top ? ` ${styles.momentRankTop}` : ""}`}>
                  {moment.rank}
                </div>
                <div className={styles.momentInfo}>
                  <div className={styles.momentName}>{moment.name}</div>
                  <div className={styles.momentSeries}>{moment.series}</div>
                </div>
                <div className={styles.momentCount}>{moment.count}</div>
                <div className={styles.momentDelta}>{moment.delta}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.features}>
        {FEATURES.map((feature) => (
          <div key={feature.title} className={styles.featurePill}>
            <div className={styles.featureIcon}>{feature.icon}</div>
            <div className={styles.featureText}>
              <strong>{feature.title}</strong>
              {feature.text}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
