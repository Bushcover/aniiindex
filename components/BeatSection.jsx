"use client";

// Session 20: became a client component so it can own which items have
// been flagged in this browser session and filter them out of the
// rendered list immediately, rather than waiting for the arc page's next
// full server render (getArcContent's own status allowlist already
// excludes flagged rows there — this is purely about not showing a
// just-flagged card to the person who flagged it, in the tab they're
// already looking at). Safe to convert: app/arc/[slug]/page.jsx (a Server
// Component) already passes this only plain, serializable `beat` data.
import { useState } from "react";
import ContentCard from "@/components/ContentCard";
import { slugifyBeatTitle } from "@/lib/slug";

export default function BeatSection({ beat, confirmedIds, onItemConfirmed }) {
  const [flaggedIds, setFlaggedIds] = useState(() => new Set());

  function handleFlagged(id) {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  // Hardcoded fallback items have no `id` and can never be flagged (see
  // ContentCard's own "omit rather than fabricate" gating), so they always
  // pass this filter untouched.
  const visibleItems = beat.items.filter((item) => !item.id || !flaggedIds.has(item.id));

  return (
    // Session 55: `id` is the click-to-scroll target for
    // IntensityChart.jsx's own bars (components/IntensityChart.jsx),
    // which generates the exact same slug from the exact same beat
    // title via the shared lib/slug.js helper. Assumes beat titles are
    // unique within a single arc (true of every real seeded arc today,
    // per PROJECT.md's seed data) — there's no uniqueness constraint on
    // `beats.title` at the schema level, so two identically-slugging
    // titles on the same arc would produce a duplicate `id` in the DOM;
    // `document.getElementById` would then just land on whichever one
    // renders first. A narrow, accepted edge case, not something this
    // change adds machinery to guard against.
    <div className="beat" id={slugifyBeatTitle(beat.title)}>
      <div className="beat-head">
        <div className="beat-title">{beat.title}</div>
        <div className="beat-ct">{visibleItems.length.toLocaleString("en-US")} items</div>
        {beat.peakLabel && <div className="peak-pill">✦ {beat.peakLabel}</div>}
      </div>
      <div className="cards">
        {visibleItems.map((item, i) => (
          <ContentCard
            key={item.id ?? i}
            beatLabel={beat.title}
            {...item}
            onFlagged={handleFlagged}
            locallyConfirmed={Boolean(item.id) && confirmedIds?.has(item.id)}
            onConfirmed={() => onItemConfirmed?.(item.id)}
          />
        ))}
      </div>
    </div>
  );
}
