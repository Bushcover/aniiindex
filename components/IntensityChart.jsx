// Session 55: click-to-scroll — no "use client" directive needed here
// even though this now owns a real onClick handler, since this
// component is only ever imported/rendered from ArcContent.jsx (already
// "use client"), which puts it in the client bundle regardless of its
// own file-level directive.
import { slugifyBeatTitle } from "@/lib/slug";

// Scrolls the page to the beat section this bar represents —
// components/BeatSection.jsx sets the exact same `id` via the same
// slugifyBeatTitle(beat.title) call, so the two are guaranteed to match
// as long as `beats` here and the beat sections below were built from
// the same real arc data (they are — both ultimately derive from the
// same ordered `beats` query result, see app/arc/[slug]/page.jsx).
// `scrollIntoView`'s own `block: "start"` would otherwise land the
// target right underneath this page's two stacked sticky bars (nav +
// .tabs-wrap) — handled with `.beat`'s own `scroll-margin-top`
// (globals.css) rather than a manual scroll-offset calculation here, so
// this call can stay exactly the plain, literal `scrollIntoView` the
// task asked for.
function scrollToBeat(label) {
  const target = document.getElementById(slugifyBeatTitle(label));
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function IntensityChart({ beats }) {
  return (
    <div className="intensity-wrap">
      <div className="intensity-eyebrow">Community response by story beat</div>
      <div className="intensity-bars">
        {beats.map((beat) => (
          <button
            key={beat.label}
            type="button"
            className={`ibar${beat.tier === "high" ? " high" : ""}${beat.tier === "peak" ? " peak" : ""}`}
            style={{ height: `${beat.heightPct}%` }}
            onClick={() => scrollToBeat(beat.label)}
            aria-label={`Jump to ${beat.label}`}
          >
            {beat.tier === "peak" && <div className="pdot"></div>}
          </button>
        ))}
      </div>
      <div className="ibar-lbls">
        {beats.map((beat) => (
          <div key={beat.label} className={`ibar-lbl${beat.tier === "peak" ? " peak" : ""}`}>
            {beat.label}
          </div>
        ))}
      </div>
    </div>
  );
}
