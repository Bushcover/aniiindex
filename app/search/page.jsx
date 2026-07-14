import Link from "next/link";
import ContentCard from "@/components/ContentCard";
import ArcList from "@/components/ArcList";
import SearchNav from "@/components/SearchNav";
import { searchSeries } from "@/lib/anilist";
import styles from "./search.module.css";

// Hardcoded placeholder counts for the sections that aren't wired to real
// data yet (arcs/characters/content — see the ARCS/CHARACTERS/TOP_CONTENT
// comments below). Not derived from whatever series is actually searched.
const RESULTS_SUMMARY = "11 arcs · 22 characters · 6,847 fan items";

const FILTERS = [
  { label: "All", count: 6847, active: true },
  { label: "Arcs", count: 11 },
  { label: "Characters", count: 22 },
  { label: "Edits & video", count: 2891 },
  { label: "Fan art", count: 2344 },
  { label: "Discussion", count: 1612 },
];

// TODO(Session 8): AniList has no arc-level data, so this arc list is still
// hardcoded placeholder content (originally authored for Chainsaw Man) and
// isn't tied to whichever series the search above actually resolves. Replace
// this with real per-series arc data once the series page is built.
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

// Also still hardcoded (Session 6 only wires the series panel to real data;
// characters and top content remain placeholders until a real backend exists).
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

function formatLabel(format) {
  return format ? format.replaceAll("_", " ") : null;
}

export default async function SearchPage({ searchParams }) {
  const rawQuery = Array.isArray(searchParams?.q) ? searchParams.q[0] : searchParams?.q;
  const query = typeof rawQuery === "string" ? rawQuery.trim() : "";

  let series = null;
  let fetchFailed = false;

  if (query) {
    try {
      const results = await searchSeries(query);
      series = results[0] || null;
    } catch (err) {
      fetchFailed = true;
    }
  }

  const seriesName = series ? series.title.english || series.title.romaji : null;

  return (
    <>
      <SearchNav key={query} query={query} />

      <div className={styles.resultsHeader}>
        <div>
          {query ? (
            <>
              <div className={styles.resultsQuery}>
                Results for <strong>&quot;{query}&quot;</strong>
              </div>
              <div className={styles.resultsCount}>{RESULTS_SUMMARY}</div>
            </>
          ) : (
            <div className={styles.resultsQuery}>Browse aniindex</div>
          )}
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

      <div className="container">
        {!query && (
          <div className={styles.stateMessage}>
            <div className={styles.stateMessageTitle}>Search for a series</div>
            <div className={styles.stateMessageSub}>
              Type an anime title into the search bar above to find its arcs, characters, and fan content.
            </div>
          </div>
        )}

        {query && fetchFailed && (
          <div className={styles.stateMessage}>
            <div className={styles.stateMessageTitle}>Couldn&rsquo;t reach AniList</div>
            <div className={styles.stateMessageSub}>
              Something went wrong fetching results for &quot;{query}&quot;. Please try again in a moment.
            </div>
          </div>
        )}

        {query && !fetchFailed && !series && (
          <div className={styles.stateMessage}>
            <div className={styles.stateMessageTitle}>No results</div>
            <div className={styles.stateMessageSub}>
              We couldn&rsquo;t find a series matching &quot;{query}&quot;. Try a different title or check the
              spelling.
            </div>
          </div>
        )}

        {series && (
          <>
            <div className={styles.seriesPanel}>
              <div className={styles.seriesPanelBody}>
                {series.coverImage?.large && (
                  <img
                    className={styles.seriesPanelPoster}
                    src={series.coverImage.large}
                    alt={`${seriesName} poster`}
                  />
                )}
                <div className={styles.seriesInfo}>
                  <div className={styles.seriesEyebrow}>✦ Series match</div>
                  <div className={styles.seriesName}>{seriesName}</div>
                  <div className={styles.seriesMeta}>
                    {formatLabel(series.format) && <span>{formatLabel(series.format)}</span>}
                    {series.seasonYear && (
                      <>
                        <span className={styles.dot}>·</span>
                        <span>{series.seasonYear}</span>
                      </>
                    )}
                    {(series.genres || []).slice(0, 4).map((genre) => (
                      <span key={genre} className={styles.seriesTag}>
                        {genre}
                      </span>
                    ))}
                  </div>
                  <div className={styles.seriesStats}>
                    <div className={styles.sstat}>
                      <div className={styles.sstatVal}>
                        {series.averageScore != null ? `${series.averageScore}%` : "—"}
                      </div>
                      <div className={styles.sstatLabel}>Score</div>
                    </div>
                    <div className={styles.sstat}>
                      <div className={styles.sstatVal}>
                        {series.popularity != null ? series.popularity.toLocaleString("en-US") : "—"}
                      </div>
                      <div className={styles.sstatLabel}>Popularity</div>
                    </div>
                    <div className={styles.sstat}>
                      <div className={styles.sstatVal}>{series.episodes ?? "—"}</div>
                      <div className={styles.sstatLabel}>Episodes</div>
                    </div>
                    <div className={styles.sstat}>
                      <div className={styles.sstatVal}>{series.seasonYear ?? "—"}</div>
                      <div className={styles.sstatLabel}>Year</div>
                    </div>
                  </div>
                </div>
                <div className={styles.seriesActions}>
                  <Link href={`/series/${series.id}`} className={`${styles.seriesBtn} ${styles.seriesBtnPrimary}`}>
                    Browse arcs
                  </Link>
                  <button className={`${styles.seriesBtn} ${styles.seriesBtnGhost}`}>Characters</button>
                </div>
              </div>
            </div>

            <div className={styles.twoCol}>
              <div>
                <div className={styles.colTitle}>Arcs</div>
                <div className={styles.colSub}>
                  Each bar shows community response intensity across story beats
                </div>

                <ArcList arcs={ARCS} moreLabel={MORE_ARCS_LABEL} />

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
                  Most saved across all {seriesName} arcs
                </div>

                <div className={styles.topContent}>
                  {TOP_CONTENT.map((item, i) => (
                    <ContentCard key={i} compact {...item} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
