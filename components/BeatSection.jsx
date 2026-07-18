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
    <div className="beat">
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
