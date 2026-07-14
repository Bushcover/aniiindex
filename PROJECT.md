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

## Session 3

Converted the search-results mockup into `app/search/page.jsx` (a
hardcoded "Chainsaw Man" search). Added:

- `components/Sparkline.jsx` (+ colocated `Sparkline.module.css`) — a
  small reusable 5-bar sparkline used in the arc list, styled with the
  same tiered normal/high/peak language as `IntensityChart`, but scoped
  to its own CSS Module rather than added to `globals.css`.
- `app/search/search.module.css` — all styles unique to the search page
  (nav search input, results header/filter pills, series panel, two-column
  layout, arc list, "also found", characters grid). This mockup reuses
  some class names from the arc-page mockup for visually *different*
  things — most notably `.search-bar` is a plain placeholder `<div>` on
  the arc page but a real `<input>` here. Rather than let one definition
  clobber the other in the shared `globals.css`, the search page's own
  classes live in a CSS Module (scoped, collision-proof) and only the
  handful of genuinely identical shared rules (`nav`, `.logo`,
  `.nav-right`, `.btn`/`.btn-ghost`/`.btn-primary`, `.container`) are
  reused straight from `globals.css`.

Per the task instructions, the "top content this week" cards reused the
existing `components/ContentCard.jsx` as-is rather than recreating the
mockup's compact horizontal `.content-card` row style. This was a known,
intentional visual trade-off at the time — `ContentCard` rendered as the
taller, 16:9-thumbnail vertical card, making the right column noticeably
taller than the left. **Resolved in a Session 3 follow-up** (below) by
giving `ContentCard` a `compact` display mode.

The Chainsaw Man red accent (series panel border/gradient bleed, and the
red sparkline tint) is not hardcoded into the CSS — it's passed down as
CSS custom properties (`--series-accent`, `--series-accent-soft`,
`--series-spark-high`, `--series-spark-peak`) set via inline `style` from
the hardcoded `SERIES` object, with the CSS falling back to the default
purple accent when unset. This keeps `search.module.css` series-agnostic
so a future real series lookup only needs to supply a color.

### Session 3 follow-up: ContentCard compact mode

Gave `ContentCard` a `compact` boolean prop instead of only having the
one tall vertical layout:

- `compact` is `false` by default — unchanged behavior, still the tall
  16:9-thumbnail card using `globals.css`'s `.card`/`.thumb`/`.cbody`
  classes, used as-is by `BeatSection` on the arc page.
- `compact={true}` renders a horizontal row instead — 80×52px thumbnail
  on the left, title/creator/tags on the right — matching the search
  mockup's original `.content-card` style. These styles live in a new
  colocated `components/ContentCard.module.css`, entirely separate class
  names from the default mode's `globals.css` classes, so the two modes
  can't bleed into each other.
- `app/search/page.jsx` now passes `compact` on its `ContentCard`s. This
  fixes the Session 3 column-height mismatch — the "top content" list is
  no longer taller than the arc list next to it.
- Both modes were screenshot-verified after the change: the arc page's
  cards are visually unchanged, and the search page's cards now match
  the mockup's compact row style.

## Session 4

Converted the home page mockup into `app/page.jsx` (replacing the old
placeholder that just redirected `/` to the arc page). Added:

- `app/page.module.css` — styles unique to the home page (nav links,
  hero, search bar, quick-search chips, hero stats, section headers, arc
  cards, series scroll cards, feature pills, trending moments list),
  following the same colocated-CSS-Module pattern as the search page so
  none of it collides with `globals.css` or `search.module.css`. The
  radial purple gradient behind the hero (`background: radial-gradient(
  ellipse 80% 60% at 50% -10%, rgba(123,108,246,0.13) 0%, transparent
  70%)`) is copied byte-for-byte from the mockup.
- **Trending arc cards reuse `components/Sparkline.jsx`** for their mini
  intensity charts instead of introducing the mockup's own
  `.mini-intensity`/`.mbar` classes, per the task instructions. Since the
  mockup's version needed 9 bars stretched across the full card width
  (vs. the search page's fixed 34×20px, 5-bar sparkline), `Sparkline` was
  given optional `width`/`height`/`gap` props (defaulting to the existing
  34px/20px/1.5px so the search page's call site didn't need to change)
  — the home page passes `width="100%" height="36px"`. The bar colors/
  radius are still exactly `Sparkline`'s existing values (not the
  mockup's slightly different 0.22/0.45 opacities or 2px radius), which
  is an intentional consistency choice over pixel-matching a third
  variant of the same chart.
- `components/HeroSearch.jsx` — a small **client component**
  (`"use client"`) holding the hero search input and the "Try:" quick-
  search chips, since both need interactivity that a server component
  can't have:
  - Pressing Enter in the search input navigates to
    `/search?q=<input value>` via `useRouter().push(...)`.
  - Clicking a quick-search chip sets the input's value to that chip's
    text and immediately navigates to `/search?q=<chip value>`.
  - Everything else on the home page (nav, hero copy, stats, arc cards,
    series cards, moments list, feature pills) stays a plain server
    component — `HeroSearch` is the only client-rendered piece.
- Trending arc cards are `next/link`s to `/arc/[slug]`; popular series
  cards are `next/link`s to `/search?q=<series name>`. Both were
  click-tested: an arc card navigates to and renders `/arc/<slug>`, and
  a quick-search chip navigates to `/search?q=...`.
- The series horizontal scroll row uses `overflow-x: auto` with both
  `scrollbar-width: none` (Firefox) and `::-webkit-scrollbar { display:
  none }` (Chromium/WebKit) — the same no-visible-scrollbar technique
  already used for the arc strip on the arc page — confirmed
  programmatically that the row still overflows/scrolls
  (`scrollWidth > clientWidth`) while no scrollbar is drawn.

## Stack

- Next.js 14 (App Router), plain JavaScript/JSX (no TypeScript)
- No CSS framework — global stylesheet ported 1:1 from the mockup's
  `<style>` block, using the same class names and CSS custom properties
  so colors, spacing, and typography match the original exactly
- No external UI or data libraries

## File layout

```
app/
  layout.jsx            Root layout: loads Syne + Inter from Google Fonts, imports globals.css
  globals.css           All shared page styles, copied from the arc-page mockup's <style> block
  page.jsx               The home page. Holds all hardcoded data consts and composes the components below.
  page.module.css        Styles unique to the home page (see Session 4 notes above)
  arc/[slug]/page.jsx   The arc page. Holds all hardcoded data consts and composes the components below.
  search/page.jsx        The search results page. Holds all hardcoded data consts (SERIES, ARCS, CHARACTERS, TOP_CONTENT, etc.)
  search/search.module.css  Styles unique to the search page (see Session 3 notes above)
components/
  ArcNav.jsx           Horizontal scrolling arc strip (the row of arc chips under the top nav)
  ArcHero.jsx          Breadcrumb, arc title, meta line, badges, description, character chips, stat row
  ContentTabs.jsx      Sticky tab bar (All / Edits & Video / Fan Art / Discussion / OST & Music)
  IntensityChart.jsx   Bar chart of "community response by story beat" with peak-moment markers
  BeatSection.jsx      One story-beat block: heading + item count + optional "peak" pill + grid of ContentCards
  ContentCard.jsx      A single fan-content link card (thumbnail, platform badge, title, creator, tags)
  ContentCard.module.css  Colocated styles for ContentCard's compact (horizontal) display mode
  Sparkline.jsx        A small intensity sparkline (5 bars on the search page, 9 on the home page)
  Sparkline.module.css Colocated styles for Sparkline (normal/high/peak tiers, series-accent override)
  HeroSearch.jsx       Client component: home page's hero search input + quick-search chips
jsconfig.json           Configures the "@/*" import alias used for components (e.g. "@/components/ArcNav")
```

The top site nav bar (logo, search bar/links, Sign in/Submit content
buttons) and the footer/feature-pill content are rendered directly in
each page file rather than split into extra shared components, since nav
contents differ meaningfully between the arc, search, and home pages
(different links, different search UI).

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
  icon and display label, plus two CSS classes per platform — one for
  each visual mode below.
  - `compact` (boolean, default `false`) picks between two entirely
    separate markup/style branches: the default tall 16:9-thumbnail
    vertical card (uses the shared `.card`/`.thumb`/`.cbody`/`.tag-*`
    classes in `globals.css`, unchanged since Session 1/2) or, when
    `compact` is true, a horizontal row with an 80×52px thumbnail on the
    left and text on the right (uses `compact*` classes in the colocated
    `ContentCard.module.css`). The two variants don't share classes, so
    styling one can't accidentally affect the other.
- **Sparkline** — renders a small intensity sparkline: 5 bars at a fixed
  34×20px on the search page's arc list, 9 bars stretched full-width at
  36px tall on the home page's trending arc cards. Takes a `bars` array
  of `{ heightPct, tier }` (same `"normal" | "high" | "peak"` vocabulary
  as `IntensityChart`'s beats) plus optional `width`/`height`/`gap` props
  (defaulting to `34px`/`20px`/`1.5px`, the search page's original size,
  so that call site needed no changes). Bar colors default to the same
  purple accent as `IntensityChart`, but fall back to whatever
  `--series-spark-high` / `--series-spark-peak` CSS variables are set on
  an ancestor element, which is how the search page tints these red for
  Chainsaw Man without the component needing a `color` prop; the home
  page doesn't set these, so its bars use the default purple.
- **HeroSearch** — the only client component (`"use client"`) in the
  project. Renders the home page's hero search input and its "Try:"
  quick-search chips, and owns the input's value as local state so a
  chip click can visibly populate the field before navigating. Enter in
  the input, or clicking a chip, calls `router.push('/search?q=...')`
  via `next/navigation`'s `useRouter`.

## Hardcoded data (in `app/page.jsx`)

- `NAV_LINKS`, `HERO_STATS`, `FEATURES` — static nav links and top-line
  numbers; `NAV_LINKS`' "active" link is hand-set, not derived from the
  current route.
- `TRENDING_ARCS` — the 6 trending arc cards (series badge color/label,
  arc name/meta line, 9-bar sparkline data, item count, up to 3 platform
  dot colors, peak-moment label). `slug` builds each card's `/arc/[slug]`
  link — same caveat as the search page's arc list: every slug currently
  renders the same hardcoded Shibuya arc page. Sparkline heights/tiers
  are hand-picked the same way as `INTENSITY_BEATS`/`ARCS[].spark`
  elsewhere and will eventually come from real per-arc engagement data,
  and "trending" itself will need a real ranking query.
- `POPULAR_SERIES` — the horizontally-scrolling series cards (name,
  poster gradient, arc count, item count). Links to
  `/search?q=<series name>`; the search page doesn't actually read that
  query param yet (`app/search/page.jsx` always renders its own
  hardcoded Chainsaw Man results regardless of `?q=`), so this link is
  correct but not yet "wired through."
- `TRENDING_MOMENTS` — the 5 trending-moment rows (rank, whether it's a
  top-3 "hot" rank, moment name, series/arc, item count, weekly delta).
  These rows aren't links yet — there's no destination page for an
  individual story beat/moment outside of an arc page's beat sections.

## Hardcoded data (in `app/search/page.jsx`)

- `SERIES` — the matched series' identity, blurb, tags, top-line stats,
  and its accent color (`accent`/`accentSoft`/`sparkHigh`/`sparkPeak`).
  Will come from a series lookup keyed by the search query; the color
  fields imply aniindex will need some scheme for assigning/storing a
  per-series accent color.
- `RESULTS_SUMMARY` and `FILTERS` — the results-count line and the type
  filter pills with their counts. None of the filter pills actually
  filter anything yet (only "All" is marked active); wiring them up needs
  real per-type counts and a query mechanism.
- `ARCS` — the 8 detailed arc rows (slug, display number, name, item
  count, sparkline bars, whether it gets a "peak" dot). `slug` is used to
  build each row's `/arc/[slug]` link. The `dividerAfter` flag on one arc
  hardcodes where the mockup's visual divider falls — a real version
  would probably derive that from a "part" grouping instead. `spark`
  heights/tiers are hand-picked exactly like `INTENSITY_BEATS` on the arc
  page and will eventually derive from real per-arc engagement data.
- `MORE_ARCS_LABEL` and `MORE_CHARACTERS_COUNT` — static stand-ins for
  the "+N more" affordances; today they're plain text, not real
  expand/pagination.
- `ALSO_FOUND` — the "Manga / OST / Related" rows; currently static
  text-only rows (not links) since there's no destination page for a
  manga part, an OST, or a "related works" listing yet.
- `CHARACTERS` — the character chips (initials, avatar color, name,
  mention count). Chip links are still `href="#"` placeholders — no
  character detail/filter page exists yet.
- `TOP_CONTENT` — 4 items shaped exactly like `ContentCard`'s props
  (`title`, `creator`, `platform`, `thumbnailUrl`, `contentType`,
  `characterTags`, `sourceUrl`). Same caveats as `BEATS` on the arc page:
  `thumbnailUrl` is a CSS gradient placeholder and `sourceUrl` is `"#"`
  for every item.

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

## Explicitly not done

- No routing/data logic keyed off the `[slug]` param — every slug renders
  the same hardcoded Shibuya Incident Arc, including the arc links
  clicked from the search page and the home page's trending arc cards
  (`/arc/introduction-arc`, `/arc/rumbling-arc`, etc. all currently
  render the same Shibuya page).
- The `?q=` query param on `/search` isn't read yet — every link into the
  search page (quick-search chips, Enter in the hero search bar, series
  cards) navigates correctly, but the destination always shows the same
  hardcoded Chainsaw Man results regardless of the query string.
- No tab/filter-pill filtering on any page — clicking a tab or a filter
  pill doesn't change which items are shown.
- No API, database, auth, or real search functionality — the nav
  links/search bar/input, "Browse"/"Submit content"/"Sign in" buttons,
  character chips, "also found" rows, and trending-moment rows are all
  static, non-functional markup beyond the navigation described above.
- No pagination/infinite scroll for the card grids, and no real
  expansion behind the "+N more" affordances on the search page.
