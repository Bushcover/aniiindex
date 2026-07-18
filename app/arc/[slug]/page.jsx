import Link from "next/link";
import ArcNav from "@/components/ArcNav";
import ArcHero from "@/components/ArcHero";
import ArcContent from "@/components/ArcContent";
import NavAuth from "@/components/NavAuth";
import { getSeriesById, getSeriesCharacters } from "@/lib/anilist";
import { getArcBeats, getArcContent, getArcMeta, getArcsBySeries } from "@/lib/supabase";

// Forces this route to always render dynamically and re-fetch on every
// request — without it, Next can treat this dynamic-segment page as
// eligible for static/ISR-style caching once nothing else forces it
// dynamic, which would keep serving whatever content_items/beats data was
// fetched on an earlier request instead of the current database state.
export const revalidate = 0;

// AniList numeric id for Jujutsu Kaisen — used only as a fallback when
// `params.slug` doesn't match a seeded `arcs` row (see `arcFoundInDb`
// below), matching the hardcoded `ARC.breadcrumb[0]` fallback below it.
// Any seeded slug instead uses its own row's real `anilist_series_id`
// (via `getArcMeta`), not this constant.
const FALLBACK_ANILIST_SERIES_ID = 113415;

// Fallback only, as of Session 25 — used when getArcsBySeries returns no
// real arcs for the current arc's series (e.g. params.slug isn't seeded
// at all, or its series genuinely has no other seeded arcs yet). When
// real arcs exist, the nav strip renders those instead — see
// `arcNavItems` below.
const ARC_NAV = [
  { slug: "cursed-child-arc", name: "Cursed Child Arc", count: 341 },
  { slug: "vs-mahito-arc", name: "Vs. Mahito Arc", count: 589 },
  { slug: "vs-finger-bearer", name: "Vs. Finger Bearer", count: 201 },
  { slug: "kyoto-goodwill-arc", name: "Kyoto Goodwill Arc", count: 892 },
  { slug: "death-painting-arc", name: "Death Painting Arc", count: 673 },
  { slug: "shibuya-incident-arc", name: "Shibuya Incident Arc", count: 2847, active: true },
  { slug: "itadoris-extermination", name: "Itadori's Extermination", count: 1102 },
  { slug: "perfect-preparation-arc", name: "Perfect Preparation Arc", count: 934 },
  { slug: "culling-game-arc", name: "Culling Game Arc", count: 1456 },
];

const ARC = {
  slug: "shibuya-incident-arc",
  name: "Shibuya Incident Arc",
  breadcrumb: ["Jujutsu Kaisen", "Season 2"],
  episodes: "Episodes 38–47",
  seasonPart: "Season 2, Part 2",
  dateRange: "Oct – Dec 2023",
  badges: [
    { type: "red", label: "⚡ High intensity" },
    { type: "amber", label: "Spoilers inside" },
  ],
  description:
    "The most emotionally devastating arc in the series. Pseudo-Geto's plan activates the Shibuya Curtain, trapping thousands of civilians — and what follows changes Jujutsu Kaisen permanently.",
  characters: [
    { initials: "GS", color: "#7B6CF6", name: "Gojo Satoru", count: 891 },
    { initials: "YI", color: "#F0706A", name: "Yuji Itadori", count: 743 },
    { initials: "NK", color: "#6AF0A8", name: "Nanami Kento", count: 412 },
    { initials: "MA", color: "#F0A96A", name: "Mahito", count: 389 },
    { initials: "NK", color: "#F06AC8", name: "Nobara Kugisaki", count: 334 },
    { initials: "SC", color: "#6AC8F0", name: "Pseudo-Geto", count: 278 },
  ],
};

const TABS = [
  { label: "All", count: 2847, active: true },
  { label: "Edits & Video", count: 1203 },
  { label: "Fan Art", count: 891 },
  { label: "Discussion", count: 449 },
  { label: "OST & Music", count: 304 },
];

const INTENSITY_BEATS = [
  { label: "Curtain falls", heightPct: 28, tier: "normal" },
  { label: "Shibuya station", heightPct: 36, tier: "normal" },
  { label: "Gojo arrives", heightPct: 54, tier: "high" },
  { label: "Domain battle", heightPct: 63, tier: "high" },
  { label: "The Sealing", heightPct: 87, tier: "peak" },
  { label: "Nanami", heightPct: 70, tier: "high" },
  { label: "Yuji breaks", heightPct: 100, tier: "peak" },
  { label: "Nobara", heightPct: 77, tier: "high" },
  { label: "Aftermath", heightPct: 42, tier: "normal" },
  { label: "Fallout", heightPct: 30, tier: "normal" },
];

const BEATS = [
  {
    title: "Curtain falls & Shibuya Station",
    count: 234,
    peakLabel: null,
    items: [
      {
        platform: "yt",
        thumbnailUrl: "linear-gradient(135deg,#1a1230,#2a1a45)",
        title: "The Shibuya Curtain explained — what it means for Jujutsu Kaisen",
        creator: "@jjkanalysis · 487K views",
        contentType: ["Breakdown", "Lore"],
        characterTags: ["Pseudo-Geto"],
        sourceUrl: "#",
      },
      {
        platform: "tt",
        thumbnailUrl: "linear-gradient(135deg,#0d1520,#162035)",
        title: "Shibuya opening sequence edit is actually insane 🔥",
        creator: "@animecuts.hd · 2.1M views",
        contentType: ["Edit", "AMV"],
        characterTags: ["Gojo Satoru"],
        sourceUrl: "#",
      },
      {
        platform: "x",
        thumbnailUrl: "linear-gradient(135deg,#200d1a,#350d28)",
        title: "Fan art — the Shibuya curtain from street level. The scale is terrifying",
        creator: "@yuki.draws · 34.2K likes",
        contentType: ["Fan art", "Digital"],
        characterTags: ["Pseudo-Geto"],
        sourceUrl: "#",
      },
    ],
  },
  {
    title: "The Sealing",
    count: 891,
    peakLabel: "Peak moment",
    items: [
      {
        platform: "tt",
        thumbnailUrl: "linear-gradient(135deg,#0f0820,#1a0f3a)",
        title: "The moment Gojo got sealed and the internet broke in real time 💔",
        creator: "@jjkmoments_ · 8.4M views",
        contentType: ["Edit", "Emotional"],
        characterTags: ["Gojo Satoru"],
        sourceUrl: "#",
      },
      {
        platform: "yt",
        thumbnailUrl: "linear-gradient(135deg,#1a0a08,#2d1008)",
        title: "Every Gojo scene before the sealing — a tribute AMV [Blue · A-Ha edit]",
        creator: "@animeedits.official · 1.2M views",
        contentType: ["AMV", "Tribute"],
        characterTags: ["Gojo Satoru"],
        sourceUrl: "#",
      },
      {
        platform: "ig",
        thumbnailUrl: "linear-gradient(135deg,#080d20,#0d1535)",
        title: "Prison realm fanart series — Part 1 of 6. The hand reaching out",
        creator: "@hiroshi.artworks · 67K likes",
        contentType: ["Fan art", "Series"],
        characterTags: ["Gojo Satoru"],
        sourceUrl: "#",
      },
      {
        platform: "rd",
        thumbnailUrl: "linear-gradient(135deg,#0d0820,#180d35)",
        title: "What exactly did Gojo see in those final seconds? [full scene analysis]",
        creator: "r/JuJutsuKaisen · 12.4K upvotes",
        contentType: ["Discussion", "Theory"],
        characterTags: ["Gojo Satoru"],
        sourceUrl: "#",
      },
    ],
  },
  {
    title: "Yuji's Breakdown",
    count: 1102,
    peakLabel: "Highest moment",
    items: [
      {
        platform: "tt",
        thumbnailUrl: "linear-gradient(135deg,#1a0808,#2d1212)",
        title: "Yuji crying over Nanami while blood rain falls. I am not okay",
        creator: "@jjkfeels · 14.2M views",
        contentType: ["Edit", "Emotional"],
        characterTags: ["Yuji Itadori", "Nanami"],
        sourceUrl: "#",
      },
      {
        platform: "yt",
        thumbnailUrl: "linear-gradient(135deg,#0a1520,#102030)",
        title: "Yuji's entire emotional arc in 8 minutes — from Junpei to this moment",
        creator: "@animenarratives · 3.8M views",
        contentType: ["Essay", "Character study"],
        characterTags: ["Yuji Itadori"],
        sourceUrl: "#",
      },
      {
        platform: "x",
        thumbnailUrl: "linear-gradient(135deg,#1a0d15,#280d20)",
        title: "I spent 3 months on this Yuji breakdown piece. The blood rain was intentional",
        creator: "@kenzo.illustrates · 89K likes",
        contentType: ["Fan art", "Detailed"],
        characterTags: ["Yuji Itadori"],
        sourceUrl: "#",
      },
    ],
  },
];

// Groups real content items under their real beat, in the same order the
// beats table returned (already sorted by order_index). Every beat gets a
// section — including ones with zero items — per the task: a beat with no
// submissions yet shows its header with no cards, not a hardcoded stand-in.
function buildBeatSections(beats, content) {
  const itemsByBeatId = new Map();
  for (const item of content) {
    if (!itemsByBeatId.has(item.beat_id)) itemsByBeatId.set(item.beat_id, []);
    itemsByBeatId.get(item.beat_id).push(item);
  }

  return beats.map((beat) => {
    const items = itemsByBeatId.get(beat.id) ?? [];
    return {
      title: beat.title,
      count: items.length,
      peakLabel: beat.is_peak ? "Peak moment" : null,
      items: items.map((item) => ({
        id: item.id,
        platform: item.platform,
        thumbnailUrl: item.thumbnail_url,
        title: item.title,
        creator: item.creator,
        contentType: item.content_type,
        characterTags: item.character_tags,
        sourceUrl: item.source_url,
        submittedBy: item.submitted_by,
        status: item.status,
      })),
    };
  });
}

export default async function ArcPage({ params }) {
  // Looked up first, in its own round trip, because the series lookup
  // below depends on its result (`arcMeta.anilist_series_id`) — it can't
  // join the AniList calls in a single Promise.allSettled the way
  // getArcBeats/getArcContent do, since those two are independently keyed
  // by `params.slug` alone.
  const [arcMetaResult, beatsResult, contentResult] = await Promise.allSettled([
    getArcMeta(params.slug),
    getArcBeats(params.slug),
    getArcContent(params.slug),
  ]);

  const arcMeta = arcMetaResult.status === "fulfilled" ? arcMetaResult.value : null;
  const realArcBeats = beatsResult.status === "fulfilled" ? beatsResult.value : null;
  const realArcContent = contentResult.status === "fulfilled" ? contentResult.value : null;

  const anilistSeriesId = arcMeta?.anilist_series_id ?? FALLBACK_ANILIST_SERIES_ID;

  const [seriesResult, charactersResult, seriesArcsResult] = await Promise.allSettled([
    getSeriesById(anilistSeriesId),
    getSeriesCharacters(anilistSeriesId),
    getArcsBySeries(anilistSeriesId),
  ]);

  const series = seriesResult.status === "fulfilled" ? seriesResult.value : null;
  const realCharacters = charactersResult.status === "fulfilled" ? charactersResult.value : null;
  const realSeriesArcs = seriesArcsResult.status === "fulfilled" ? seriesArcsResult.value : [];

  // Real arcs for the current arc's series, if any are seeded — falls
  // back to the hardcoded ARC_NAV placeholder strip otherwise (Session
  // 25). `active` marks whichever chip matches the arc actually being
  // viewed; getArcsBySeries doesn't know params.slug, so that's set here.
  const arcNavItems = realSeriesArcs.length
    ? realSeriesArcs.map((a) => ({ slug: a.slug, name: a.title, active: a.slug === params.slug }))
    : ARC_NAV;

  const seriesName = series ? series.title.english || series.title.romaji : ARC.breadcrumb[0];
  const description = series?.description || ARC.description;
  const characters = realCharacters?.length ? realCharacters : ARC.characters;

  // `getArcBeats`/`getArcContent` both resolve to `null` specifically when
  // `params.slug` doesn't match a seeded arc — treated as one signal so the
  // page never mixes real beats with hardcoded content or vice versa.
  const arcFoundInDb = realArcBeats !== null && realArcContent !== null;

  // Session 37: the hero stats bar (Fan items/Saves/This week/Contributors)
  // used to always render `ARC.stats` — four numbers hardcoded from the
  // Phase 1 mockup, shown regardless of which arc (real or fallback) was
  // actually being viewed. "Fan items" is the one figure this app can
  // actually compute: `realArcContent` (fetched above via getArcContent,
  // same `arc_id` + visible-status filter used everywhere else on this
  // page) already *is* the exact set of items this count needs — no
  // separate query required. The other three were never tracked by any
  // table this project has (no "save" action exists at all; "this week"
  // and "contributors" would need created_at-windowed / distinct-
  // submitted_by aggregation this project has no view or RPC for yet) —
  // shown as a plain dash rather than inventing a number, per the
  // project's standing "don't fabricate data" convention (see e.g. the
  // arc nav/series arc list omitting fan-item counts in Session 25).
  // Applies even on the hardcoded-fallback path (`arcFoundInDb` false,
  // i.e. `params.slug` doesn't match any seeded arc) — that path already
  // renders fake mockup beats/content elsewhere, but a fake *stat number*
  // specifically is exactly what this task was about removing, so it
  // isn't reintroduced here just because the rest of that fallback page
  // is still a mockup.
  const fanItemsCount = arcFoundInDb ? realArcContent.length : 0;
  const heroStats = [
    { value: fanItemsCount.toLocaleString("en-US"), label: "Fan items" },
    { value: "—", label: "Saves" },
    { value: "—", label: "This week" },
    { value: "—", label: "Contributors" },
  ];

  const arc = {
    ...ARC,
    name: arcMeta?.title || ARC.name,
    episodes: arcMeta ? `Episodes ${arcMeta.episode_start}–${arcMeta.episode_end}` : ARC.episodes,
    breadcrumb: [seriesName, ARC.breadcrumb[1]],
    description,
    characters,
    stats: heroStats,
  };

  const intensityBeats = arcFoundInDb
    ? realArcBeats.map((beat) => ({
        label: beat.title,
        heightPct: beat.intensity,
        tier: beat.is_peak ? "peak" : beat.intensity >= 50 ? "high" : "normal",
      }))
    : INTENSITY_BEATS;

  const beatSections = arcFoundInDb ? buildBeatSections(realArcBeats, realArcContent) : BEATS;

  return (
    <>
      <nav>
        <Link href="/" className="logo">
          ani<span>index</span>
        </Link>
        <div className="search-bar">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Search series, arcs, characters…
        </div>
        <div className="nav-right">
          <button className="btn btn-ghost nav-browse-btn">Browse</button>
          <NavAuth signInClassName="btn btn-primary" />
        </div>
      </nav>

      <ArcNav arcs={arcNavItems} />

      <ArcHero arc={arc} />

      <ArcContent tabs={TABS} intensityBeats={intensityBeats} beatSections={beatSections} />
    </>
  );
}
