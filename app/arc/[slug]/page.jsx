import Link from "next/link";
import ArcNav from "@/components/ArcNav";
import ArcHero from "@/components/ArcHero";
import ContentTabs from "@/components/ContentTabs";
import IntensityChart from "@/components/IntensityChart";
import BeatSection from "@/components/BeatSection";

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
  stats: [
    { value: "2,847", label: "Fan items" },
    { value: "14,209", label: "Saves" },
    { value: "891", label: "This week" },
    { value: "38", label: "Contributors" },
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

export default function ArcPage({ params }) {
  return (
    <>
      <nav>
        <div className="logo">
          ani<span>index</span>
        </div>
        <div className="search-bar">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Search series, arcs, characters…
        </div>
        <div className="nav-right">
          <button className="btn btn-ghost">Browse</button>
          <button className="btn btn-primary">Sign in</button>
        </div>
      </nav>

      <ArcNav arcs={ARC_NAV} />

      <ArcHero arc={ARC} />

      <ContentTabs tabs={TABS} />

      <div className="container">
        <IntensityChart beats={INTENSITY_BEATS} />

        <div className="content-body">
          {BEATS.map((beat) => (
            <BeatSection key={beat.title} beat={beat} />
          ))}
        </div>

        <div className="index-note">
          aniindex is a fan content index — nothing is hosted here. All items link to their original source
          and creator. Series data via <a href="#">AniList API</a>. &nbsp;·&nbsp;{" "}
          <Link href="/submit">Submit content</Link> &nbsp;·&nbsp; <a href="#">Report an item</a>
        </div>
      </div>
    </>
  );
}
