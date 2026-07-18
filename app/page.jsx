import Link from "next/link";
import Sparkline from "@/components/Sparkline";
import HeroSearch from "@/components/HeroSearch";
import NavAuth from "@/components/NavAuth";
import { getTrendingArcs } from "@/lib/supabase";
import styles from "./page.module.css";

// Session 37: forces this route to render dynamically on every request
// rather than being eligible for static/ISR caching — same reasoning as
// the arc page's own `export const revalidate = 0` (see app/arc/[slug]/
// page.jsx), needed now that this page reads live data via
// getTrendingArcs instead of only hardcoded consts.
export const revalidate = 0;

// Phase 8 (Session 45): no `title` here deliberately — this page has no
// title more specific than the site itself, so it inherits
// `metadata.title.default` from the root layout ("Aniindex — Fan Content
// Index for Anime Arcs") rather than templating a redundant "Aniindex ·
// Aniindex". `description`/`openGraph` mirror the hero copy below rather
// than the root layout's more generic site-wide description. No
// `openGraph.images` — this page has no single real image to point at
// (see app/layout.jsx's own comment on why no site-wide placeholder
// image was added either).
const HOME_DESCRIPTION =
  "Fan edits, art, breakdowns, and discussion for anime story arcs — organized by story beat. Not hosted, just found.";

export const metadata = {
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    description: HOME_DESCRIPTION,
    url: "/",
  },
};

// A small, fixed set of the app's existing accent-family hex colors
// (reused from ArcHero's character-chip palette and the old hardcoded
// TRENDING_ARCS data), hashed by arc id purely for visual variety on the
// series-badge dot — decorative only, not a claim about real data the way
// a fabricated stat number would be.
const SERIES_DOT_PALETTE = ["#7B6CF6", "#F0706A", "#6AF0A8", "#F0A96A", "#F06AC8", "#6AC8F0", "#6AF0C8"];
function seriesDotColor(arcId) {
  return SERIES_DOT_PALETTE[arcId % SERIES_DOT_PALETTE.length];
}

// Maps a content_items.platform value to a dot color + label for the
// trending-arc cards — mirrors ContentCard.jsx's own PLATFORM_META (same
// five known platforms, same "unrecognized value" fallback philosophy),
// but as a plain hex color rather than a CSS class, matching how the old
// hardcoded TRENDING_ARCS.platforms[].color was already consumed by
// `.pltDot`'s inline `style`.
const PLATFORM_DOT_META = {
  yt: { color: "#FF0000", label: "YouTube" },
  youtube: { color: "#FF0000", label: "YouTube" },
  tt: { color: "#010101", label: "TikTok" },
  tiktok: { color: "#010101", label: "TikTok" },
  x: { color: "#1D9BF0", label: "Twitter" },
  ig: { color: "#E1306C", label: "Instagram" },
  instagram: { color: "#E1306C", label: "Instagram" },
  rd: { color: "#FF4500", label: "Reddit" },
  reddit: { color: "#FF4500", label: "Reddit" },
};
const DEFAULT_PLATFORM_DOT = { color: "#666", label: "Link" };

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

export default async function HomePage() {
  // Session 37: real arcs with real submitted content, most recent first —
  // replaces the old TRENDING_ARCS, a fully hardcoded list of 6 fake arcs
  // from shows this app doesn't even have real data for. Returns fewer
  // than 6 (possibly zero) when fewer real arcs have content yet; the
  // empty-state placeholders below fill out the remaining grid slots
  // rather than this page inventing fake arcs to pad the row back to 6.
  const trendingArcs = await getTrendingArcs(6);

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
            <div className={styles.sectionSub}>Most recently added content</div>
            <div className={styles.sectionLink}>View all →</div>
          </div>
          <div className={styles.arcGrid}>
            {trendingArcs.map((arc) => (
              <Link key={arc.slug} href={`/arc/${arc.slug}`} className={styles.arcCard}>
                <div className={styles.arcCardTop}>
                  <div className={styles.arcSeriesBadge}>
                    <div className={styles.arcSeriesDot} style={{ background: seriesDotColor(arc.id) }}></div>
                    {arc.seriesTitle && <div className={styles.arcSeriesName}>{arc.seriesTitle}</div>}
                  </div>
                  <div className={styles.arcName}>{arc.title}</div>
                  {(arc.episodeStart || arc.episodeEnd) && (
                    <div className={styles.arcMetaLine}>
                      Episodes {arc.episodeStart}–{arc.episodeEnd}
                    </div>
                  )}
                  {arc.spark.length > 0 && <Sparkline bars={arc.spark} width="100%" height="36px" />}
                </div>
                <div className={styles.arcCardBottom}>
                  <span className={styles.arcCount}>{arc.count.toLocaleString("en-US")}</span>
                  <span className={styles.arcCountLabel}>items</span>
                  <div className={styles.arcPlatforms}>
                    {arc.platforms.map((platform, i) => {
                      const meta = PLATFORM_DOT_META[platform] || DEFAULT_PLATFORM_DOT;
                      return (
                        <div
                          key={i}
                          className={styles.pltDot}
                          style={{ background: meta.color }}
                          title={meta.label}
                        ></div>
                      );
                    })}
                  </div>
                  {arc.peakLabel && <div className={styles.arcPeak}>✦ {arc.peakLabel}</div>}
                </div>
              </Link>
            ))}
            {Array.from({ length: Math.max(0, 6 - trendingArcs.length) }).map((_, i) => (
              <div key={`empty-${i}`} className={styles.arcCardEmpty}>
                <span>More trending arcs coming soon</span>
              </div>
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
