import ArcList from "@/components/ArcList";
import CharacterChips from "@/components/CharacterChips";
import SearchNav from "@/components/SearchNav";
import { getSeriesWithRelations, getSeriesCharacters } from "@/lib/anilist";
import styles from "./series.module.css";

// TODO(Session 8): AniList has no arc-level data, so this arc list is the
// same hardcoded placeholder set used on the search page (originally
// authored for Chainsaw Man) — it isn't derived from the real series above.
// Replace once real per-series arc data exists.
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

export default async function SeriesPage({ params }) {
  const anilistId = Number(params.slug);

  const [seriesResult, charactersResult] = await Promise.allSettled([
    getSeriesWithRelations(anilistId),
    getSeriesCharacters(anilistId),
  ]);

  const series = seriesResult.status === "fulfilled" ? seriesResult.value : null;
  const characters = charactersResult.status === "fulfilled" ? charactersResult.value : [];

  const seriesName = series ? series.title.english || series.title.romaji : null;

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
          <div
            className={styles.hero}
            style={series.bannerImage ? { backgroundImage: `url(${series.bannerImage})` } : undefined}
          >
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
              <ArcList arcs={ARCS} moreLabel={MORE_ARCS_LABEL} />
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
