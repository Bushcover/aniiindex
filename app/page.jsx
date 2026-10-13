import Link from "next/link";
import Sparkline from "@/components/Sparkline";
import HeroSearch from "@/components/HeroSearch";
import NavAuth from "@/components/NavAuth";
import { getTrendingArcs, getPopularSeries } from "@/lib/supabase";
import { buildOpenGraph } from "@/lib/metadata";
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
//
// Session 46 fix: `openGraph` now goes through `buildOpenGraph`
// (lib/metadata.js) instead of a bare `{ description, url }` object —
// this page defining its own `openGraph` was silently replacing (not
// merging with) the root layout's `openGraph.siteName`/`locale`, so
// `og:site_name` never actually rendered on the home page despite
// app/layout.jsx defining it — confirmed via direct `<head>` inspection.
const HOME_DESCRIPTION =
  "Fan edits, art, breakdowns, and discussion for anime story arcs — organized by story beat. Not hosted, just found.";

export const metadata = {
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: buildOpenGraph({ description: HOME_DESCRIPTION, url: "/" }),
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

  // Session 67: real series data (including the real AniList cover image
  // and real arc/item counts) for the "Popular series" scroll below —
  // replaces the old POPULAR_SERIES hardcoded array. "One Piece" no
  // longer appears here: it was never a real `series` row (no arcs have
  // ever been seeded for it), so it correctly drops out now that this
  // section reflects the database instead of a fake list.
  const popularSeries = await getPopularSeries();

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
            <Link href="/arcs" className={styles.sectionLink}>
              View all →
            </Link>
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

        {/* Session 67: real data now (getPopularSeries), so the
            sampleDataSection/sampleDataLabel wrapper from Session 51 is
            removed here — it stays on Trending moments below, which is
            still 100% hardcoded. */}
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>Popular series</div>
            <div className={styles.sectionSub}>Browse by series, then drill into arcs</div>
            <div className={styles.sectionLink}>All series →</div>
          </div>
          <div className={styles.seriesScroll}>
            {popularSeries.map((series) => (
              <Link
                key={series.id}
                href={`/search?q=${encodeURIComponent(series.title)}`}
                className={styles.seriesCard}
              >
                <div
                  className={styles.seriesPoster}
                  style={
                    series.coverImage
                      ? {
                          backgroundImage: `url(${series.coverImage})`,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                >
                  {/* Session 67: only rendered when there's a real cover
                      image behind it — an empty gradient layer over the
                      plain --surface background would just darken it
                      slightly for no reason. */}
                  {series.coverImage && <div className={styles.seriesPosterGradient}></div>}
                </div>
                <div className={styles.seriesCardBody}>
                  <div className={styles.seriesCardName}>{series.title}</div>
                  <div className={styles.seriesStats}>
                    <span>{series.arcCount} {series.arcCount === 1 ? "arc" : "arcs"}</span>
                    <span>·</span>
                    <span>{series.itemCount.toLocaleString("en-US")} items</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Session 51: same sampleDataSection treatment — TRENDING_MOMENTS
            is also still 100% hardcoded, no real "story beats with the
            most new content this week" query exists anywhere in this
            app. */}
        <div className={`${styles.section} ${styles.sampleDataSection}`}>
          <div className={styles.sampleDataLabel}>Sample data</div>
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
