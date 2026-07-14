# aniindex

A fan content index for anime series. No API or database is connected
yet — everything on the arc page is hardcoded sample data for the
"Shibuya Incident Arc" (Jujutsu Kaisen).

## Session 1

Converted the arc-page mockup (a single static HTML file) into a Next.js
(App Router) app.

## Session 2

Extracted the content card markup out of `BeatSection` into its own
reusable `components/ContentCard.jsx`, with an explicit, self-contained
prop API (`title`, `creator`, `platform`, `thumbnailUrl`, `contentType`,
`characterTags`, `sourceUrl`, `beatLabel`) instead of the ad-hoc
`tags: [{label, type}]` shape it used before. `BeatSection` now just
spreads each hardcoded item straight into `ContentCard`. The `BEATS`
data in `app/arc/[slug]/page.jsx` was updated to match the new field
names (`thumbGradient` → `thumbnailUrl`, `tags` → `contentType` +
`characterTags`, `href` → `sourceUrl`); no visual output changed — the
rendered page was screenshot-compared against Session 1 and is pixel-
identical.

## Stack

- Next.js 14 (App Router), plain JavaScript/JSX (no TypeScript)
- No CSS framework — global stylesheet ported 1:1 from the mockup's
  `<style>` block, using the same class names and CSS custom properties
  so colors, spacing, and typography match the original exactly
- No external UI or data libraries

## File layout

```
app/
  layout.jsx          Root layout: loads Syne + Inter from Google Fonts, imports globals.css
  globals.css          All page styles, copied from the mockup <style> block (unchanged)
  page.jsx              Redirects "/" to "/arc/shibuya-incident-arc" for convenience
  arc/[slug]/page.jsx  The arc page. Holds all hardcoded data consts and composes the components below.
components/
  ArcNav.jsx           Horizontal scrolling arc strip (the row of arc chips under the top nav)
  ArcHero.jsx          Breadcrumb, arc title, meta line, badges, description, character chips, stat row
  ContentTabs.jsx      Sticky tab bar (All / Edits & Video / Fan Art / Discussion / OST & Music)
  IntensityChart.jsx   Bar chart of "community response by story beat" with peak-moment markers
  BeatSection.jsx      One story-beat block: heading + item count + optional "peak" pill + grid of ContentCards
  ContentCard.jsx      A single fan-content link card (thumbnail, platform badge, title, creator, tags)
jsconfig.json           Configures the "@/*" import alias used for components (e.g. "@/components/ArcNav")
```

The top site nav bar (logo, search bar, Browse/Sign in buttons) and the footer
disclaimer note are rendered directly in `app/arc/[slug]/page.jsx` — they
weren't part of the five requested components, so they were kept inline
rather than split into extra component files.

## What each component does

- **ArcNav** — renders the horizontal, scrollable strip of arc chips (e.g.
  "Cursed Child Arc", "Vs. Mahito Arc" …). Takes an `arcs` array and marks
  whichever entry has `active: true`.
- **ArcHero** — renders the breadcrumb trail, `<h1>` arc title, the meta
  row (episode range, season part, date range, intensity/spoiler badges),
  the description paragraph, the row of character chips (avatar initials,
  color, name, mention count), and the four-stat row (fan items, saves,
  this week, contributors).
- **ContentTabs** — renders the sticky tab bar. Takes a `tabs` array;
  whichever tab has `active: true` gets the accent underline.
- **IntensityChart** — renders the bar chart of ten story beats. Each beat
  has a `heightPct` (bar height as % of the chart) and a `tier`
  (`"normal" | "high" | "peak"`) that controls bar color and whether the
  small accent dot + highlighted label appear above peak bars.
- **BeatSection** — renders one story-beat's content: the beat title, item
  count, an optional "peak moment" pill, and a responsive grid of
  `ContentCard`s. It passes each hardcoded item's fields straight through
  as props (`<ContentCard beatLabel={beat.title} {...item} />`) — it has
  no markup or platform logic of its own.
- **ContentCard** — a single fan-content link card. Always an `<a>` that
  opens `sourceUrl` in a new tab (`target="_blank" rel="noreferrer"`).
  Renders a thumbnail (`background: thumbnailUrl`), a platform badge, the
  title, the creator/engagement line, and tag pills for `contentType`
  (generic tags, e.g. "Edit", "Lore") followed by `characterTags`
  (character tags, styled with the accent color). `beatLabel` isn't shown
  visually — it's folded into the card's `aria-label` for context. The
  `platform` prop (`"yt" | "tt" | "x" | "ig" | "rd"`) is looked up in a
  `PLATFORM_META` map at the top of the file, which supplies the badge's
  icon, display label, and CSS class — YouTube red, TikTok black, X
  near-black, Instagram pink-red, and Reddit orange, all defined as
  existing `.plt-*` classes in `globals.css`.

## Hardcoded data (in `app/arc/[slug]/page.jsx`)

All of the following are plain `const` objects/arrays at the top of the
page file, standing in for what will eventually come from a database/API:

- `ARC_NAV` — the list of arcs shown in the horizontal strip, with fan-item
  counts and which one is "active". Will come from a per-series "arcs"
  table/endpoint, keyed by the same `slug` the route already receives via
  `params.slug` (not yet used — the page always renders the Shibuya arc
  regardless of the URL's `[slug]`).
- `ARC` — series/arc metadata: breadcrumb (series → season), episode
  range, date range, badges, description, character list (with avatar
  color/initials and per-character mention counts), and the four top-line
  stats. Will come from an arc detail endpoint plus a characters
  relation, likely combining aniindex's own DB with series metadata from
  the AniList API (referenced in the footer note).
- `TABS` — tab labels and per-tab item counts. Counts will need to be
  computed from the real content index; only "All" is meaningful right
  now since the other tabs don't yet filter anything (no filtering logic
  has been wired up).
- `INTENSITY_BEATS` — the ten story-beat bars (label, bar height, tier).
  Bar heights are hand-picked to look right in the mockup; a real version
  will derive `heightPct` from some engagement/intensity metric per beat
  and derive `tier` from thresholds on that metric instead of being
  hand-assigned.
- `BEATS` — the three story-beat sections and their content cards
  (`platform`, `thumbnailUrl`, `title`, `creator`, `contentType`,
  `characterTags`, `sourceUrl` — currently `"#"` for every card). This is
  the actual fan-content index data and will come from the content
  database — one row per submitted item, with real thumbnails, real
  outbound links, and moderation state. Note: `thumbnailUrl` currently
  holds a CSS `linear-gradient(...)` string (there are no real images
  yet) — `ContentCard` applies it directly as the thumbnail's
  `background`, which works for a gradient string today but will need to
  switch to a real `background-image: url(...)` or an `<img>` once actual
  thumbnail images exist.

## Explicitly not done in this session

- No routing/data logic keyed off the `[slug]` param — every slug renders
  the same hardcoded Shibuya Incident Arc.
- No tab filtering — clicking a tab doesn't change which cards are shown.
- No API, database, auth, or search functionality — the search bar,
  "Browse", and "Sign in" controls in the top nav are static markup.
- No pagination/infinite scroll for the card grids.
