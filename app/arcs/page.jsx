import Link from "next/link";
import Sparkline from "@/components/Sparkline";
import SearchNav from "@/components/SearchNav";
import { getTrendingArcs } from "@/lib/supabase";
import { buildOpenGraph } from "@/lib/metadata";
import styles from "./arcs.module.css";

// Session 67: the home page's "Trending arcs → View all" link had no
// href at all (a plain div, not even a <Link>) — this is the real page
// it now points to. Dynamic for the same reason the home page is
// (`export const revalidate = 0`): real, live Supabase data, not
// eligible for static/ISR caching.
export const revalidate = 0;

const ARCS_DESCRIPTION =
  "Every story arc with real fan content indexed so far on Aniindex — edits, art, breakdowns, and discussion, organized by story beat.";

export const metadata = {
  title: "All arcs",
  description: ARCS_DESCRIPTION,
  alternates: { canonical: "/arcs" },
  openGraph: buildOpenGraph({ description: ARCS_DESCRIPTION, url: "/arcs" }),
};

// Same palette/platform-dot helpers as app/page.jsx's own trending-arc
// cards — this page reuses that exact card look at a higher limit, and
// every other small per-page UI helper in this app (NAV_LINKS,
// HERO_STATS, FILTERS, etc.) is already kept local to its own page file
// rather than shared through a lib, so this follows the same pattern.
const SERIES_DOT_PALETTE = ["#7B6CF6", "#F0706A", "#6AF0A8", "#F0A96A", "#F06AC8", "#6AC8F0", "#6AF0C8"];
function seriesDotColor(arcId) {
  return SERIES_DOT_PALETTE[arcId % SERIES_DOT_PALETTE.length];
}

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

export default async function AllArcsPage() {
  // Same getTrendingArcs the home page's own "Trending arcs" section
  // uses, just with a much higher limit — this page's whole purpose is
  // to be the "view all" of that section, not a different data source.
  const arcs = await getTrendingArcs(50);

  return (
    <>
      <SearchNav query="" />

      <div className="container">
        <div className={styles.pageHead}>
          <div className={styles.pageTitle}>All arcs</div>
          <div className={styles.pageSub}>Every arc with real fan content, most recently added first</div>
        </div>

        <div className={styles.arcGrid}>
          {arcs.map((arc) => (
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
        </div>

        {arcs.length === 0 && (
          <div className={styles.emptyMessage}>
            <div className={styles.emptyMessageTitle}>No arcs have real fan content yet.</div>
            <div className={styles.emptyMessageSub}>Check back soon, or be the first to submit something.</div>
          </div>
        )}
      </div>
    </>
  );
}
