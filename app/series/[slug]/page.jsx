import ArcList from "@/components/ArcList";
import CharacterChips from "@/components/CharacterChips";
import SearchNav from "@/components/SearchNav";
import { getSeriesWithRelations, getSeriesCharacters } from "@/lib/anilist";
import { getArcsBySeries } from "@/lib/supabase";
import { buildOpenGraph, truncate, MAX_META_DESCRIPTION, MAX_TWITTER_DESCRIPTION } from "@/lib/metadata";
import styles from "./series.module.css";

// Fallback only, as of Session 25 — AniList has no arc-level data, so
// this hardcoded placeholder set (originally authored for Chainsaw Man)
// only renders when getArcsBySeries finds no real seeded arcs for this
// series' AniList id. Still used as-is for any series with nothing
// seeded yet.
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

function formatLabel(format) {
  return format ? format.replaceAll("_", " ") : null;
}

function statusLabel(status) {
  return status ? status.replaceAll("_", " ").toLowerCase() : null;
}

// Phase 8 (Session 45): real per-series SEO metadata + Open Graph/Twitter
// preview. `getSeriesWithRelations` failing here means the page itself
// renders its own "Couldn't load this series" error state (see below) —
// mirrored here as a noindex "Series not found" title rather than a
// fabricated title/description for a series that isn't actually loading.
export async function generateMetadata({ params }) {
  const anilistId = Number(params.slug);
  const series = await getSeriesWithRelations(anilistId).catch(() => null);
  const url = `/series/${params.slug}`;

  if (!series) {
    return {
      title: "Series not found",
      robots: { index: false, follow: false },
      alternates: { canonical: url },
    };
  }

  const seriesName = series.title.english || series.title.romaji;
  // Session 47: see app/arc/[slug]/page.jsx's own generateMetadata
  // comment — description/twitterDescription are each truncated
  // independently from the same raw text at their own ceiling
  // (MAX_META_DESCRIPTION/MAX_TWITTER_DESCRIPTION, lib/metadata.js), not
  // one derived from the other. The local `truncateDescription` this file
  // used to define itself (Session 45) moved into lib/metadata.js as a
  // shared `truncate` — no longer just a small per-page helper once two
  // different length ceilings both needed the identical logic.
  const rawDescription = series.description || `Browse ${seriesName}'s arcs and top characters on Aniindex.`;
  const description = truncate(rawDescription, MAX_META_DESCRIPTION);
  const twitterDescription = truncate(rawDescription, MAX_TWITTER_DESCRIPTION);
  const image = series.bannerImage || series.coverImage?.large || null;

  return {
    title: seriesName,
    description,
    alternates: { canonical: url },
    // Session 46 fix: see app/arc/[slug]/page.jsx's own generateMetadata
    // comment — buildOpenGraph (lib/metadata.js) is what keeps
    // og:site_name/locale from silently disappearing when this page
    // defines its own openGraph object.
    openGraph: buildOpenGraph({
      title: seriesName,
      description,
      url,
      type: "website",
      ...(image && { images: [{ url: image }] }),
    }),
    twitter: {
      // Always "summary_large_image" (requested directly, Session 46) —
      // see the arc page's own comment for why this is no longer
      // conditional on `image`.
      card: "summary_large_image",
      title: seriesName,
      description: twitterDescription,
      ...(image && { images: [image] }),
    },
  };
}

export default async function SeriesPage({ params }) {
  const anilistId = Number(params.slug);

  const [seriesResult, charactersResult, seriesArcsResult] = await Promise.allSettled([
    getSeriesWithRelations(anilistId),
    getSeriesCharacters(anilistId),
    getArcsBySeries(anilistId),
  ]);

  const series = seriesResult.status === "fulfilled" ? seriesResult.value : null;
  const characters = charactersResult.status === "fulfilled" ? charactersResult.value : [];
  const realSeriesArcs = seriesArcsResult.status === "fulfilled" ? seriesArcsResult.value : [];

  const seriesName = series ? series.title.english || series.title.romaji : null;

  // Real arcs for this series, if any are seeded — falls back to the
  // hardcoded ARCS placeholder list otherwise (Session 25). `num` uses
  // the real `order_index` (zero-padded, matching the placeholder list's
  // own "01"/"02"/... style); `count`/`spark`/`peak` have no real-data
  // equivalent yet (no per-arc fan-item count or beat-intensity rollup
  // exists), so they're omitted rather than fabricated — ArcList renders
  // fine without them (see components/ArcList.jsx).
  const arcs = realSeriesArcs.length
    ? realSeriesArcs.map((a) => ({
        slug: a.slug,
        name: a.title,
        num: String(a.order_index).padStart(2, "0"),
      }))
    : ARCS;
  const moreLabel = realSeriesArcs.length ? undefined : MORE_ARCS_LABEL;

  return (
    <>
      <SearchNav query="" />

      {!series && (
        <div className={styles.stateMessage}>
          <div className={styles.stateMessageTitle}>Couldn&rsquo;t load this series</div>
          <div className={styles.stateMessageSub}>
            Something went wrong fetching this series from AniList. Please try again in a moment.
          </div>
        </div>
      )}

      {series && (
        <>
          <div className={styles.hero}>
            {/* Session 53: banner image split into its own layer, capped
                at max-height 300px (series.module.css's own .heroBanner
                comment has the full "why" — in short, .hero itself can no
                longer own both the background image and the content, since
                the real content (poster/title/description) can genuinely
                need more than 300px on mobile and shouldn't be clipped or
                have a stray border line cut across it). */}
            <div
              className={styles.heroBanner}
              style={series.bannerImage ? { backgroundImage: `url(${series.bannerImage})` } : undefined}
            ></div>
            <div className={styles.heroOverlay}></div>
            <div className={styles.heroInner}>
              {series.coverImage?.large && (
                <img className={styles.poster} src={series.coverImage.large} alt={`${seriesName} poster`} />
              )}
              <div className={styles.info}>
                <div className={styles.eyebrow}>Series</div>
                <div className={styles.title}>{seriesName}</div>
                <div className={styles.metaLine}>
                  {formatLabel(series.format) && <span>{formatLabel(series.format)}</span>}
                  {series.seasonYear && (
                    <>
                      <span className={styles.dot}>·</span>
                      <span>{series.seasonYear}</span>
                    </>
                  )}
                  {series.episodes && (
                    <>
                      <span className={styles.dot}>·</span>
                      <span>{series.episodes} episodes</span>
                    </>
                  )}
                  {statusLabel(series.status) && (
                    <>
                      <span className={styles.dot}>·</span>
                      <span>{statusLabel(series.status)}</span>
                    </>
                  )}
                </div>
                <div className={styles.genres}>
                  {(series.genres || []).map((genre) => (
                    <span key={genre} className={styles.genreTag}>
                      {genre}
                    </span>
                  ))}
                </div>
                <div className={styles.scoreRow}>
                  <div>
                    <div className={styles.scoreVal}>
                      {series.averageScore != null ? `${series.averageScore}%` : "—"}
                    </div>
                    <div className={styles.scoreLabel}>Score</div>
                  </div>
                </div>
                <p className={styles.description}>{series.description}</p>
              </div>
            </div>
          </div>

          <div className="container">
            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Arcs</div>
                <div className={styles.sectionSub}>
                  Each bar shows community response intensity across story beats
                </div>
              </div>
              <ArcList arcs={arcs} moreLabel={moreLabel} />
            </div>

            <div className={styles.section}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Characters</div>
                <div className={styles.sectionSub}>Top characters for {seriesName}</div>
              </div>
              <CharacterChips characters={characters} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
