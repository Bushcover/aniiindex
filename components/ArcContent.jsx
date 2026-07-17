"use client";

// Session 28: owns the arc page's content-tab filter state. ContentTabs
// and the beat sections below it aren't parent/child in the markup (a
// `.container` boundary and IntensityChart sit between them) but both
// need to react to the same "which tab is active" state, and the arc
// page itself is a Server Component that can't hold state at all — so
// this client component takes over rendering everything from the tab bar
// through the beat-section list (and the index note after it), leaving
// the arc page to keep owning everything above it (nav, ArcNav, ArcHero).
import { useState } from "react";
import Link from "next/link";
import ContentTabs from "@/components/ContentTabs";
import IntensityChart from "@/components/IntensityChart";
import BeatSection from "@/components/BeatSection";

// Maps each tab label to the content-type bucket it filters to. `null`
// means "no filter" (All). Keys match TABS' labels in
// app/arc/[slug]/page.jsx exactly.
const TAB_BUCKETS = {
  All: null,
  "Edits & Video": "edit",
  "Fan Art": "fanart",
  Discussion: "discussion",
  "OST & Music": "ost",
};

// Classifies a single free-text content-type tag into one of the 4
// filterable buckets, or null if it doesn't belong to any of them (an
// item tagged only with a non-matching type, e.g. "Breakdown"/"Other",
// still shows under "All", just never under a specific tab).
// Keyword-based rather than an exact-match table on purpose:
// content_type has never been a real enum (see PROJECT.md's "Explicitly
// not built"), and this needs to classify both the submit form's fixed
// option strings ("Edit / AMV", "Fan art", "Discussion", "OST / Music")
// and the hardcoded fallback data's more varied tag vocabulary ("AMV",
// "Tribute", "Digital", "Theory", etc.) with one function.
function classifyTag(tag) {
  const t = (tag ?? "").toLowerCase();
  if (t.includes("edit") || t.includes("amv")) return "edit";
  if (t.includes("fan art") || t.includes("fanart")) return "fanart";
  if (t.includes("discussion")) return "discussion";
  if (t.includes("ost") || t.includes("music") || t.includes("soundtrack")) return "ost";
  return null;
}

// An item's `contentType` is a single string for real Supabase rows but
// an array of several tags for the hardcoded fallback data (see
// ContentCard's own `genTags` handling) — coerced the same way here, and
// an item matches a bucket if *any* of its tags classify into it.
function itemMatchesBucket(item, bucket) {
  if (!bucket) return true;
  const tags = [].concat(item.contentType ?? []);
  return tags.some((tag) => classifyTag(tag) === bucket);
}

export default function ArcContent({ tabs, intensityBeats, beatSections }) {
  const [activeLabel, setActiveLabel] = useState(tabs.find((tab) => tab.active)?.label ?? tabs[0]?.label ?? "All");

  const activeBucket = TAB_BUCKETS[activeLabel] ?? null;
  const tabsWithActive = tabs.map((tab) => ({ ...tab, active: tab.label === activeLabel }));

  // "All" (activeBucket === null) always shows every beat section
  // unfiltered, including ones with zero items — matching this page's
  // existing, deliberate "a beat with no submissions yet still shows its
  // header" behavior. Any other tab filters each beat's items down to
  // matches and drops the beat section entirely once nothing matches,
  // rather than showing an empty header for a category that arc genuinely
  // has nothing in.
  const filteredBeatSections = activeBucket
    ? beatSections
        .map((beat) => ({ ...beat, items: beat.items.filter((item) => itemMatchesBucket(item, activeBucket)) }))
        .filter((beat) => beat.items.length > 0)
    : beatSections;

  return (
    <>
      <ContentTabs tabs={tabsWithActive} onSelect={setActiveLabel} />

      <div className="container">
        <IntensityChart beats={intensityBeats} />

        <div className="content-body">
          {filteredBeatSections.map((beat) => (
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
