// Session 55: shared by components/IntensityChart.jsx and
// components/BeatSection.jsx specifically because the task these were
// built for requires both to produce the *exact* same string from the
// same beat title (IntensityChart's bar click target has to match
// BeatSection's own rendered `id`) — a divergence here would fail
// silently (a click that just doesn't scroll, no error anywhere), unlike
// this codebase's usual small-helper duplication (e.g. formatLabel,
// duplicated identically in app/search/page.jsx and
// app/series/[slug]/page.jsx) where the two copies aren't required to
// stay byte-for-byte identical to work correctly. One shared
// implementation is what actually guarantees that here.
export function slugifyBeatTitle(title) {
  return (title ?? "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
