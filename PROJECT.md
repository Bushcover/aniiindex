# aniindex — Session 1

A fan content index for anime series. This session converts the arc-page
mockup (a single static HTML file) into a Next.js (App Router) app. No
API or database is connected yet — everything on the page is hardcoded
sample data for the "Shibuya Incident Arc" (Jujutsu Kaisen).

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
  BeatSection.jsx      One story-beat block: heading + item count + optional "peak" pill + grid of content cards
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
  count, an optional "peak moment" pill, and a responsive grid of content
  cards. Each card shows a gradient thumbnail, a platform badge (YouTube/
  TikTok/Twitter/Instagram/Reddit — icon + label + platform-specific
  badge color), title, creator/engagement line, and generic + character
  tags. The platform icon/label/class lookup lives in a small
  `PLATFORM_META` map at the top of this file.

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
  (platform, thumbnail, title, creator, tags, and the target `href`,
  currently `"#"` for every card). This is the actual fan-content index
  data and will come from the content database — one row per submitted
  item, with real thumbnails, real outbound links, and moderation state.

## Explicitly not done in this session

- No routing/data logic keyed off the `[slug]` param — every slug renders
  the same hardcoded Shibuya Incident Arc.
- No tab filtering — clicking a tab doesn't change which cards are shown.
- No API, database, auth, or search functionality — the search bar,
  "Browse", and "Sign in" controls in the top nav are static markup.
- No pagination/infinite scroll for the card grids.
