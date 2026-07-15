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

## Session 5

Converted the submission-flow mockup into `app/submit/page.jsx` — a
3-step client-side wizard (Link → Placement → Review), the first fully
interactive page in the project (previously only `HeroSearch` needed
client state; this entire page does).

- **`"use client"` page.** Unlike the other three pages (server
  components composing mostly-static data), `app/submit/page.jsx` is one
  client component holding all wizard state: `step` (1–3), the step 1
  URL input, the selected story beat index, the character list, the
  selected content type, and the two quality-checkbox booleans.
- **Simplified nav**, per the task: just the logo (a real `next/link` to
  `/`, unlike the plain-`<div>` logo on every other page) and a Cancel
  button that calls `router.back()` via `next/navigation`'s `useRouter`.
  The mockup's own `nav { gap: 12px; ... }` rule is a bare-tag selector
  that would otherwise leak into every page's `<nav>` through the shared
  `globals.css` — since a CSS Module can't scope a bare tag selector
  (Next.js's CSS Modules loader rejects "impure" selectors with no local
  class), the gap override lives on a `.navCompact` class applied
  alongside the shared `nav` tag styling instead.
- **The mockup itself is a single static frame** showing step 1
  collapsed/done, step 2 active, and step 3 grayed out — it isn't three
  separate screens. `app/submit/page.jsx` reconstructs the actual
  3-state wizard the step indicator implies (labeled "Link" /
  "Placement" / "Review"), including inventing the step 1 *active* form
  (a URL input + Next button) since the mockup only shows step 1 already
  *completed*. Per the step indicator's own naming, the quality
  checkboxes and final action button were moved from step 2 (where the
  static mockup has them) to step 3 "Review," alongside a live preview —
  this matches the task instructions and the indicator's own semantics
  better than the mockup's single-frame layout.
- **Step 3 renders a real, live `<ContentCard>`**, not a static stub —
  `title`/`creator`/`platform`/`thumbnailUrl` come from the hardcoded
  "resolved" link data, while `contentType`, `characterTags`, and
  `beatLabel` are read straight from step 2's state, so the preview
  updates immediately if you go back and change the beat, remove a
  character, or pick a different content type. The resolved link reuses
  the exact same title/creator/platform/gradient already hardcoded for
  the "Gojo sealed" TikTok item in `app/arc/[slug]/page.jsx`'s `BEATS`
  data (Session 1) — this flow is simulating submitting that exact
  existing card.
- **The beat selector is a real interactive chart**, not just styled
  bars: clicking any of the 10 bars (or its label) sets the selected
  index, which drives the bar's `selected`/`nearby`/`dim` styling, the
  highlighted label, and the "beat-selected-row" name + item count below
  the chart. The mockup only shows one example selection (index 4, "The
  Sealing," with the two bars *after* it — indices 5 and 6 — marked
  `nearby`); that pattern was generalized to "the up-to-two bars
  immediately following whichever bar is selected" so the same rule
  produces sensible results for any bar the user clicks. Per-beat item
  counts beyond "The Sealing" (891, matching the arc page's real number)
  and "Yuji breaks" (1,102, ditto) are invented placeholder numbers for
  the other 8 beats.
- Small, clearly-scoped interactivity was wired up beyond what the task
  named explicitly, since it was trivial local state with no backend
  implications: removing a character chip (`×`), picking a content type
  pill, and toggling either quality checkbox. Left as inert static
  markup (matching the pattern used elsewhere in the app for
  not-yet-built destinations): the "+ Add character" button (no
  character-picker exists), the Series/Arc "Change" links (no field-edit
  UI exists), and the "Skip this…" / "How placement works →" links.
  Going back to step 1 or step 2 via the "← Back" buttons or a
  completed-step's "Change" button is fully wired and preserves all
  state (screenshot-verified — going back doesn't reset the URL input,
  selected beat, characters, or content type).
- Verified end-to-end: step 1 → 2 → 3 forward navigation, clicking a
  different beat bar updates the selection and the preview, removing a
  character and changing the content type both propagate into the step 3
  `ContentCard` preview, the "Coming soon — backend not connected yet"
  button is genuinely `disabled`, and "← Back" from step 3 → step 2 → step
  1 preserves all prior input.

### Session 5 follow-up: wire up "Submit content"

Session 5 built the `/submit` page but left every other page's "Submit
content" button as inert static markup (matching the pre-existing
pattern for not-yet-built destinations). Once `/submit` existed, that
was a bug, not a placeholder: fixed by turning the "Submit content"
button on the home page (`app/page.jsx`) and search page
(`app/search/page.jsx`) into `next/link`s to `/submit`, and the arc
page's footer "Submit content" text link (`app/arc/[slug]/page.jsx`) the
same way (previously `href="#"`). Also added `text-decoration: none` to
the shared `.btn` rule in `globals.css`, since it's now applied to an
`<a>`/`Link` as well as `<button>`s and anchors default to underlined
text. Click-tested from all three pages to confirm each lands on
`/submit`.

## Session 6

Wired the search page to the real AniList GraphQL API — the first real
external data source in the project. Everything else on the app is still
hardcoded (see below); this is the first crack in that.

- **`lib/anilist.js`** — a `searchSeries(query, { perPage })` utility
  that POSTs a GraphQL query to `https://graphql.anilist.co`, fetching
  `id`, `title { romaji english }`, `format`, `seasonYear`, `genres`,
  `coverImage { large }`, `averageScore`, `popularity`, and `episodes`
  for up to `perPage` (default 5) matching anime (`type: ANIME,
  sort: SEARCH_MATCH`). Returns `[]` for a blank query or zero matches;
  throws if the HTTP request fails or AniList returns a GraphQL error,
  so the page can tell "no results" and "request failed" apart.
- **Caching**: the `fetch` call sets `next: { revalidate: 3600 }` —
  Next.js's built-in Data Cache, not a hand-rolled in-memory `Map` or
  Supabase (not set up, per the task). This caches per exact
  request (URL + method + body), so repeat searches for the same title
  reuse the cached AniList response for up to an hour instead of
  re-fetching. Verified informally: two identical requests seconds apart
  both returned in well under typical AniList round-trip time.
- **`app/search/page.jsx` is now an async Server Component** that reads
  `searchParams.q` and calls `searchSeries`. Three non-happy-path states,
  each replacing the whole results area with a centered message instead
  of a broken or misleading page:
  - no `?q=` at all → "Search for a series" prompt
  - a query with zero AniList matches → "No results" message naming the
    query
  - the AniList request throwing → a friendly "Couldn't reach AniList"
    message (never a stack trace or blank page)
- **The series panel now renders the real top match** — title (English
  name if AniList has one, else romaji), format + season year, up to 4
  genres as tag pills, a real poster image (`coverImage.large`), and four
  stats that are now genuinely real (`Score`, `Popularity`, `Episodes`,
  `Year`) instead of the old fully-fabricated ones (`Fan items`, `Saves`,
  `This week`). AniList doesn't return an author/studio field in what we
  fetch, so that line was dropped rather than keep showing a fake name
  next to real data. The per-series accent color (red border/gradient
  bleed, tinted sparkline) is also gone for real results — there's no
  color in the AniList fields we fetch, so the `--series-accent`/etc. CSS
  variables are simply left unset, and `search.module.css`'s existing
  `var(--series-accent, var(--accent))`-style fallbacks (built in Session
  3) take over automatically, defaulting to the app's standard purple.
  The nav search input and the "Results for ___" heading now reflect the
  actual `?q=` value instead of a hardcoded string.
- **Arcs and characters are untouched, per the task** — AniList has no
  arc-level data, so `ARCS` in `app/search/page.jsx` is still the exact
  hardcoded Chainsaw Man arc list from Session 3, now with a `TODO(Session
  8)` comment explaining it isn't tied to whatever series was actually
  searched and will be replaced once the real series/arc page exists.
  `CHARACTERS` and `TOP_CONTENT` are likewise still fully hardcoded and
  commented as such. Practically, this means searching "Attack on Titan"
  shows a real Attack on Titan series panel with a Chainsaw Man arc list
  underneath it — an intentional, documented placeholder mismatch, not a
  bug.
- One environment-specific caveat surfaced while testing in this sandbox:
  the real poster image didn't load here because this session's outbound
  network policy allowlists `graphql.anilist.co` but blocks AniList's
  image CDN (`s4.anilist.co`) — confirmed via the proxy's own status
  endpoint, not a code issue. The `coverImage.large` URL returned by the
  API is valid and will render normally in a real browser/deployment
  outside this sandbox's restricted proxy.
- Verified end-to-end: a real `curl` to AniList confirms the exact fields
  fetched match what's rendered; searching "Attack on Titan" renders its
  real title/format/year/genres/score/popularity/episodes; a
  nonsense query renders the "No results" state; visiting `/search` with
  no query renders the "Search for a series" prompt.

### Session 6 follow-up: fix search page navigation

The search page's nav was still the plain, non-interactive markup from
before AniList was wired in — the logo was a `<div>`, and the search
input/icon/clear-button had no handlers at all (typing did nothing;
Enter did nothing). Fixed by extracting the whole nav into a new client
component, **`components/SearchNav.jsx`**:

- The logo is now a `next/link` to `/` (`text-decoration: none` added
  via a small `.logoLink` modifier class in `search.module.css`, the same
  pattern already used on the submit page).
- The input is a controlled field seeded from the `query` prop. Pressing
  Enter or clicking the (now-clickable; `pointer-events: none` was
  removed from `.searchIcon`) search icon calls
  `router.push('/search?q=' + encodeURIComponent(value))`. The clear (×)
  button clears the field and calls `router.push('/')`.
- `app/search/page.jsx` renders `<SearchNav key={query} query={query} />`
  — the `key` forces the component to remount (and thus re-seed its
  input state from the new `query` prop) whenever the URL's `?q=`
  changes via client-side navigation, so searching again from an
  already-loaded results page correctly updates the input to match.
- Verified end-to-end: loading `/search?q=Attack%20on%20Titan` pre-fills
  the input with "Attack on Titan"; typing "One Piece" and pressing Enter
  navigates to `/search?q=One%20Piece` and renders One Piece's real
  AniList data (including "—" for episodes, since AniList reports `null`
  for an ongoing series); clicking the search icon after typing "Naruto"
  does the same; clicking × or the logo both return to `/`.

## Session 7

Wired the arc page's series-level and character-level data to AniList,
following the same pattern Session 6 established for the search page.

- **`lib/anilist.js`** gained two new functions, plus a shared
  `postToAniList(query, variables)` helper (`searchSeries` was refactored
  onto it too, no behavior change):
  - `getSeriesById(anilistId)` — fetches `title` (romaji/english),
    `description`, `genres`, `coverImage.large`, `bannerImage`,
    `seasonYear`, `format`, `episodes`, and `status` for one series.
    AniList's `description` field contains basic HTML (`<br>`, `<i>`,
    etc.); this function strips those tags before returning, so callers
    get plain text ready to render directly.
  - `getSeriesCharacters(anilistId, { perPage = 10 })` — fetches the top
    `perPage` characters (sorted main-role-first, then by favourites),
    returning `{ id, name, image }` per character (`image` is the large
    portrait URL, or `null` if AniList has none).
  - Both share `searchSeries`'s caching (`next: { revalidate: 3600 }`)
    and error contract (throw on request/GraphQL failure, so callers can
    catch and fall back).
- **`app/arc/[slug]/page.jsx` is now an async Server Component.** It
  hardcodes `ANILIST_SERIES_ID = 113415` (Jujutsu Kaisen's real AniList
  id) and calls both new functions via `Promise.allSettled` — using
  `allSettled` rather than `Promise.all` specifically so a failure in one
  call (say, characters) doesn't wipe out a successful result from the
  other (series). Each result independently falls back to the existing
  hardcoded `ARC` data if its fetch rejected or returned nothing:
  - The breadcrumb's series name (previously the hardcoded string
    `"Jujutsu Kaisen"`) is now `series.title.english || series.title.romaji`.
  - The hero description (previously an arc-specific blurb about the
    Shibuya Curtain) is now the real AniList series synopsis. This is an
    intentional, task-directed swap — the paragraph now describes the
    whole series rather than this specific arc's plot, since "series
    description" was explicitly what the task asked to wire up. Worth
    reconciling once Session 8's real series/arc page exists (arc-level
    blurbs will need their own field, separate from the series synopsis).
  - The character chips are now the real top-10 AniList cast for the
    series (not the same 6 characters as before — AniList's top-10 by
    role/favourites for Jujutsu Kaisen includes some named minor
    characters, e.g. background students, that never appear in the
    Shibuya arc specifically).
  - The arc name ("Shibuya Incident Arc"), episode range, season/date
    line, badges, intensity chart, beat sections, and content cards are
    all untouched — still fully hardcoded, per the task.
- **`components/ArcHero.jsx`** — character chips now render a real photo
  (`background-image`, via `char.image`) when one is available, falling
  back to the existing colored-initials circle (`char.color` +
  `char.initials`) when it isn't. The small mention-count badge next to
  each chip (`char.count`) is now optional and only renders when present
  — real AniList characters don't have an aniindex-specific "mentions in
  this arc" number, so that badge is simply omitted for them rather than
  showing a fabricated count.
- **Fallback verified concretely, not just by code review**: temporarily
  pointing `ANILIST_SERIES_ID` at a nonexistent id (AniList returns a
  GraphQL "Not Found" error for it) and re-requesting the page confirmed
  it still renders `200 OK` with the original hardcoded description and
  all 6 original hardcoded characters — the page never breaks.
- Same environment caveat as Session 6: AniList's image CDN
  (`s4.anilist.co`) is blocked by this sandbox's outbound network policy,
  so character portraits render as empty circles in this session's own
  screenshots even though the underlying `background-image` URLs are
  real and correct (confirmed by reading the computed style in a headless
  browser) — this will display normally in a real browser/deployment.
- One data quirk worth noting: AniList's `title.english` for this series
  is literally `"JUJUTSU KAISEN"` (all-caps) rather than title-cased —
  the breadcrumb shows it as AniList returns it, same
  `english || romaji` preference already used on the search page (which
  shows the same quirk for "ONE PIECE").

### Session 7 follow-up: fix logo navigation on the home and arc pages

Since there's no shared `Nav` component (each page inlines its own —
see the file layout notes above), the logo-as-`Link` fix from Session 6
(search page) and Session 5 (submit page) had never been applied to the
home page or the arc page — both still had a plain, non-clickable
`<div className="logo">`. Fixed by wrapping the logo in a `next/link` to
`/` on both, and added `text-decoration: none` to the shared `.logo` rule
in `globals.css` itself (rather than another one-off page-scoped
modifier class) so it's underline-free wherever it's used as a link,
without needing to touch it again per page. Click-tested the logo from
all four pages (home, arc, search, submit) and confirmed every one now
navigates to `/`.

## Session 8

Added a series page at `app/series/[slug]/page.jsx` — the URL's `[slug]`
is the AniList numeric series id (e.g. `/series/113415` for Jujutsu
Kaisen), not an aniindex-specific slug like the arc page's. This is the
first page that resolves genuinely different real data per URL, rather
than always rendering the same hardcoded example (verified with both
Jujutsu Kaisen and Attack on Titan — see below).

- **`lib/anilist.js`** gained `getSeriesWithRelations(anilistId)` —
  fetches `title`, `description` (HTML-stripped), `coverImage.large`,
  `bannerImage`, `seasonYear`, `format`, `status`, `genres`,
  `averageScore`, `popularity`, and `episodes`. It overlaps with Session
  7's `getSeriesById`, but is kept separate on purpose: the series page
  needs `averageScore`/`popularity` that the arc page doesn't, and the
  two pages' fallback behavior is different enough (arc page falls back
  to hardcoded arc data; series page has no sensible fallback and shows
  an error state) that merging them would blur both call sites'
  contracts. Same `next: { revalidate: 3600 }` caching as every other
  function in this file.
- **Two components extracted for reuse, per the task's "reuse the same
  pattern" instructions**, rather than copy-pasting JSX across pages:
  - **`components/CharacterChips.jsx`** — pulled out of `ArcHero.jsx`
    verbatim (same photo/colored-initials-fallback/optional-count logic
    from Session 7). `ArcHero` now just calls
    `<CharacterChips characters={arc.characters} />`. This is genuinely
    "the same character chip component from the arc page," not a
    lookalike.
  - **`components/ArcList.jsx`** — pulled out of the search page's arc
    list block (the `.arcList`/`.arcRow`/`Sparkline`/divider/"show more"
    markup), importing `search.module.css` directly for its classes —
    the same "component imports a page-specific CSS Module" pattern
    already used by `HeroSearch` (Session 4) and `SearchNav` (Session 6
    follow-up). `app/search/page.jsx` was refactored to use it too
    (`<ArcList arcs={ARCS} moreLabel={MORE_ARCS_LABEL} />`), so both
    pages render arc rows from one implementation.
- **The series page itself** (`app/series/[slug]/page.jsx`) parses
  `params.slug` as a number and calls `getSeriesWithRelations` and
  `getSeriesCharacters` via `Promise.allSettled` (same independent-
  fallback pattern as the arc page). Layout:
  - A hero banner using `series.bannerImage` as a background image
    (with a dark gradient overlay for legibility) — no mockup existed
    for this page, so the banner/poster/title/meta/genre-pills/score/
    description layout was designed fresh, reusing the app's existing
    color/typography tokens for visual consistency with the other pages.
  - An "Arcs" section using `ArcList` — **still the exact same 8
    hardcoded placeholder arcs used on the search page** (same TODO-style
    comment: AniList has no arc-level data, and this isn't derived from
    the real series above). Per the app's established convention of
    hardcoding page-level consts rather than sharing a data module, the
    array is duplicated in this page file rather than imported from the
    search page — only the `ArcList` *component* (the rendering pattern)
    is shared, not the placeholder data itself.
  - A "Characters" section using `CharacterChips` with the real top-10
    AniList cast for whatever series id is in the URL.
  - If `getSeriesWithRelations` fails or returns nothing, the whole page
    replaces its content with a clean error message ("Couldn't load this
    series...") — there's no sensible hardcoded series to fall back to
    here, unlike the arc page.
- **`app/search/page.jsx`'s "Browse arcs" button** is now a `next/link`
  to `/series/${series.id}` (previously a plain, non-functional
  `<button>`) using the real AniList id of whatever series matched the
  search. Needed `text-decoration: none` added to `.seriesBtn` in
  `search.module.css` for the same reason as every other button-turned-
  link fix this project has needed.
- Verified end-to-end, including cross-series correctness: loaded
  `/series/113415` directly (real Jujutsu Kaisen title/genres/score/
  description, all 8 placeholder arcs, 10 real characters); then, from
  `/search?q=Attack%20on%20Titan`, clicked "Browse arcs" and confirmed it
  navigated to `/series/16498` and rendered *Attack on Titan's own* real
  title/genres/score/description/cast — not the Jujutsu Kaisen example —
  proving the id is genuinely threaded through, not hardcoded end to end.
- Same sandbox-only caveat as Sessions 6–7: cover/banner images render
  as empty boxes in this session's screenshots because this environment's
  network policy blocks AniList's image CDN (`s4.anilist.co`); the URLs
  themselves are real and will load normally in a real browser.

### Session 8 follow-up: fix series page nav + character ranking

Two bugs found after Session 8 shipped:

1. **The series page's search bar didn't work.** It had been built with
   the same decorative, non-interactive nav markup as the arc page
   (logo + a plain `<div>` "search bar" with no input at all) instead of
   the `SearchNav` client component the search page already uses. Fixed
   by swapping it in directly — `<SearchNav query="" />` (the series page
   has no `?q=` of its own to seed the field with, since its `[slug]` is
   an AniList id, not a search string). This also means the series page's
   nav-right buttons changed from "Browse"/"Sign in" to "Sign in"/"Submit
   content," matching `SearchNav` exactly rather than a near-identical
   copy — the intent was consistency, not a redesign.
2. **`getSeriesCharacters` surfaced minor characters over main ones.**
   The AniList sort was `[ROLE, FAVOURITES]` — `ROLE` correctly grouped
   MAIN before SUPPORTING, but plain `FAVOURITES` sorts **ascending**,
   so within each role group the *least*-favourited characters came
   first. For Jujutsu Kaisen this put Nobara (14,539 favourites) before
   Gojo (40,950) among MAIN characters, and surfaced near-zero-favourite
   background characters (a few named students with 2–5 favourites each)
   ahead of genuinely prominent SUPPORTING characters like Nanami Kento
   (14,110) or Sukuna (12,417). Fixed by sorting `[ROLE,
   FAVOURITES_DESC]` instead — confirmed via a direct AniList query
   before and after the change that this reorders the top 10 to Gojo,
   Yuji, Megumi, Nobara (MAIN, highest-favourited first), then Nanami,
   Maki Zenin, Sukuna, Toge Inumaki, Geto, Aoi Todo (SUPPORTING, same
   ordering) — exactly the "actual main cast" the task asked for.
- Verified both fixes together on `/series/113415`: character chips now
  read Satoru Gojou → Yuuji Itadori → Megumi Fushiguro → Nobara Kugisaki
  → Kento Nanami → …; typing "One Piece" into the series page's nav
  search bar and pressing Enter navigates to `/search?q=One%20Piece` and
  renders One Piece's real AniList data, exactly like the search page.

## Session 9

Set up Supabase as the project's database — no tables are actually wired
into any page yet, this session just lays the plumbing.

- **Installed `@supabase/supabase-js`** (`npm install @supabase/supabase-js`).
- **`lib/supabase.js`** — initializes and exports a single `supabase`
  client via `createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)`, following the same
  "one shared client, imported wherever needed" pattern `lib/anilist.js`
  already established for AniList. `NEXT_PUBLIC_` prefix is required for
  these to be readable client-side, matching Supabase's own docs — the
  key involved is the publishable/anon key, which is designed to be
  exposed in client code (RLS policies, not key secrecy, are what protect
  the data).
- **`.env.local`** — holds the real `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` values for this project's Supabase
  instance. Verified `.env.local` was already covered by the existing
  `.env*.local` line in `.gitignore` (no change needed) and confirmed with
  `git check-ignore -v .env.local` that git actually ignores it before
  doing anything else.
- **Verified the client initializes correctly**: loaded `.env.local`,
  called `createClient(...)` with the real values, and confirmed the
  returned client has a working `.auth` and `.from(...)` — i.e. it's a
  genuine, usable Supabase client, not just code that type-checks.
- **Four tables designed and created** — `series`, `arcs`, `beats`,
  `content_items`, mirroring the hardcoded data shapes already used across
  `app/arc/[slug]/page.jsx`, `app/search/page.jsx`, and
  `app/series/[slug]/page.jsx` (see "Database schema" below for the full
  SQL and column-by-column notes). Per the task, the SQL was handed to the
  user to run manually in the Supabase SQL editor rather than executed by
  any tool here — the user ran it and confirmed all four tables now exist
  in the Supabase project's Table Editor. **The database itself is set up
  and empty** — no page reads from or writes to Supabase yet. That wiring
  (replacing the hardcoded `ARC`/`ARCS`/`BEATS`/etc. consts with real
  queries, and inserting rows) is future work.

## Database schema

Four tables, **created and confirmed live** in the Supabase project
(verified in the Table Editor), designed to eventually replace the
hardcoded per-page consts documented above (`ARC_NAV`/`ARC`/
`INTENSITY_BEATS`/`BEATS` on the arc page, `ARCS`/`CHARACTERS`/
`TOP_CONTENT` on the search page, `ARCS` on the series page). Created
manually via the Supabase SQL editor, not through any tool/migration in
this repo — all four tables exist but are currently empty, and no page
queries them yet.

- **`series`** — one row per anime series. Keyed by `anilist_id` (unique)
  so a series can be looked up or upserted from an AniList id the same
  way `app/series/[slug]/page.jsx` already does; `slug` is aniindex's own
  URL-friendly identifier (independent of the AniList id, unlike the
  series page's current `[slug]` param, which *is* the raw AniList id).
- **`arcs`** — one row per story arc, `series_id` foreign-keyed to
  `series`. Also keeps its own `anilist_series_id` alongside the
  `series_id` foreign key, so an arc's originating AniList series is
  always recoverable even without a join. `episode_start`/`episode_end`
  match the arc page's existing episode-range meta line; `order_index`
  drives the arc strip / arc list ordering that `ARC_NAV`/`ARCS` currently
  hardcode by array order.
- **`beats`** — one row per story beat within an arc, `arc_id`
  foreign-keyed to `arcs` (required — a beat always belongs to an arc).
  `intensity` and `is_peak` are the real-data equivalents of
  `INTENSITY_BEATS`' hand-picked `heightPct`/`tier` values; `order_index`
  replaces relying on array position for beat ordering.
- **`content_items`** — one row per submitted fan-content link, i.e. the
  real backing store for what `BEATS[].items` (arc page) and
  `TOP_CONTENT` (search page) currently hardcode, and what `/submit`'s
  wizard would eventually insert into once its "Coming soon" button is
  wired up. `arc_id` is required; `beat_id` is optional (nullable) since
  a submission could plausibly land at the arc level before/without a
  specific beat assignment. `status` (default `'pending'`) and
  `submitted_by` anticipate the moderation workflow `/submit` currently
  has no backend for; `confirmation_count` anticipates some future
  "confirm this is accurate" community signal that doesn't exist in the
  UI yet. `character_tags` is a Postgres `text[]`, matching
  `ContentCard`'s existing `characterTags` array prop directly — no
  join table needed for this first pass.

SQL (run manually in the Supabase SQL editor — this repo's tooling never
executed it):

```sql
create table series (
  id bigint primary key generated always as identity,
  anilist_id integer unique not null,
  title text not null,
  slug text unique not null,
  created_at timestamptz default now()
);

create table arcs (
  id bigint primary key generated always as identity,
  series_id bigint references series(id),
  anilist_series_id integer not null,
  title text not null,
  slug text unique not null,
  episode_start integer,
  episode_end integer,
  order_index integer not null,
  created_at timestamptz default now()
);

create table beats (
  id bigint primary key generated always as identity,
  arc_id bigint references arcs(id) not null,
  title text not null,
  order_index integer not null,
  intensity integer not null default 50,
  is_peak boolean default false,
  created_at timestamptz default now()
);

create table content_items (
  id bigint primary key generated always as identity,
  arc_id bigint references arcs(id) not null,
  beat_id bigint references beats(id),
  source_url text not null,
  title text not null,
  creator text not null,
  platform text not null,
  thumbnail_url text,
  content_type text not null,
  character_tags text[] default array[]::text[],
  status text not null default 'pending',
  submitted_by text,
  confirmation_count integer default 0,
  created_at timestamptz default now()
);
```

## Stack

- Next.js 14 (App Router), plain JavaScript/JSX (no TypeScript)
- No CSS framework — global stylesheet ported 1:1 from the mockup's
  `<style>` block, using the same class names and CSS custom properties
  so colors, spacing, and typography match the original exactly
- No external UI or data libraries
- **Supabase** (`@supabase/supabase-js`) — added Session 9 as the
  project's database; see "Database schema" above. `lib/supabase.js`
  exports a shared client, credentials come from `.env.local`
  (`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`, gitignored).
  All four tables (`series`, `arcs`, `beats`, `content_items`) are created
  and confirmed live in the Supabase project, but empty — no page
  reads/writes Supabase data yet, and every page is still on its
  Session 1–8 hardcoded data / AniList calls.

## File layout

```
app/
  layout.jsx            Root layout: loads Syne + Inter from Google Fonts, imports globals.css
  globals.css           All shared page styles, copied from the arc-page mockup's <style> block
  page.jsx               The home page. Holds all hardcoded data consts and composes the components below.
  page.module.css        Styles unique to the home page (see Session 4 notes above)
  arc/[slug]/page.jsx   The arc page. Holds all hardcoded data consts and composes the components below.
  search/page.jsx        The search results page. Async Server Component — fetches the series panel from AniList (Session 6); ARCS/CHARACTERS/TOP_CONTENT are still hardcoded consts.
  search/search.module.css  Styles unique to the search page (see Session 3 notes above)
  submit/page.jsx         The 3-step "Add content" wizard. Client component; owns all wizard state (see Session 5 notes above)
  submit/submit.module.css Styles unique to the submit page
  series/[slug]/page.jsx  The series page — [slug] is an AniList numeric id, not an aniindex slug (see Session 8 notes above)
  series/[slug]/series.module.css  Styles unique to the series page
lib/
  anilist.js             searchSeries / getSeriesById / getSeriesCharacters / getSeriesWithRelations — AniList GraphQL calls, cached via Next's fetch cache (see Session 6/7/8 notes above)
  supabase.js             Exports a shared Supabase client (see Session 9 notes above); not yet used by any page
components/
  ArcNav.jsx           Horizontal scrolling arc strip (the row of arc chips under the top nav)
  ArcHero.jsx          Breadcrumb, arc title, meta line, badges, description, character chips (via CharacterChips), stat row
  ContentTabs.jsx      Sticky tab bar (All / Edits & Video / Fan Art / Discussion / OST & Music)
  IntensityChart.jsx   Bar chart of "community response by story beat" with peak-moment markers
  BeatSection.jsx      One story-beat block: heading + item count + optional "peak" pill + grid of ContentCards
  ContentCard.jsx      A single fan-content link card (thumbnail, platform badge, title, creator, tags)
  ContentCard.module.css  Colocated styles for ContentCard's compact (horizontal) display mode
  Sparkline.jsx        A small intensity sparkline (5 bars on the search page, 9 on the home page)
  Sparkline.module.css Colocated styles for Sparkline (normal/high/peak tiers, series-accent override)
  HeroSearch.jsx       Client component: home page's hero search input + quick-search chips
  SearchNav.jsx        Client component: search page's nav — logo link, functional search input/icon/clear
  CharacterChips.jsx   Character chip list (photo or colored-initials fallback, optional mention count) — used by ArcHero and the series page
  ArcList.jsx          Arc-row list with sparklines (imports search.module.css) — used by the search page and the series page
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
  the description paragraph, the row of character chips, and the
  four-stat row (fan items, saves, this week, contributors). Each
  character chip renders a real photo (`char.image`, as a
  `background-image`) when present, falling back to the colored-initials
  circle (`char.color` + `char.initials`) otherwise; the small
  mention-count badge (`char.count`) only renders when the value is
  present, since real AniList characters (Session 7) don't have one.
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
- **HeroSearch** — a client component (`"use client"`). Renders the home
  page's hero search input and its "Try:" quick-search chips, and owns
  the input's value as local state so a chip click can visibly populate
  the field before navigating. Enter in the input, or clicking a chip,
  calls `router.push('/search?q=...')` via `next/navigation`'s
  `useRouter`.
- **SearchNav** — another client component; the search page's entire nav
  (logo, search input, icon, clear button). Seeds its input from a
  `query` prop and is remounted (`key={query}`) whenever that prop
  changes, so it stays in sync across client-side navigations. Enter or
  clicking the search icon navigates to `/search?q=...`; the clear (×)
  button clears the field and navigates to `/`.
- **CharacterChips** — renders a list of character chips (`.chars`/
  `.char-chip` from `globals.css`). Each chip shows a real photo
  (`char.image`, as a `background-image`) when present, falling back to
  a colored-initials circle (`char.color` + `char.initials`) otherwise;
  the small mention-count badge (`char.count`) only renders when the
  value is present. Extracted from `ArcHero` in Session 8 so the arc
  page and the series page render character chips identically.
- **ArcList** — renders a list of arc rows with sparklines
  (`.arcList`/`.arcRow`/etc., imported from `search.module.css`). Takes
  `arcs` (each with `slug`, `num`, `name`, `count`, `peak`, `spark`, and
  optional `dividerAfter`) and an optional `moreLabel` for a trailing
  "+N more" row. Each row is a `next/link` to `/arc/${arc.slug}`.
  Extracted from the search page in Session 8; also used by the series
  page.

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

As of Session 6, the series panel itself is **real data** fetched from
AniList via `lib/anilist.js` (see the Session 6 notes above) — it's no
longer a hardcoded const. Still hardcoded, unaffected by the actual
search query:

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

As of Session 7, `ANILIST_SERIES_ID` (113415, Jujutsu Kaisen) drives real
`getSeriesById`/`getSeriesCharacters` calls that override `ARC`'s
`breadcrumb[0]` (series name), `description`, and `characters` when
AniList succeeds — see the Session 7 notes above. `ARC.characters` is
still the fallback used when AniList fails or `params.slug` isn't
plugged in yet. Everything else below is a plain `const` at the top of
the page file, standing in for what will eventually come from a
database/API:

- `ARC_NAV` — the list of arcs shown in the horizontal strip, with fan-item
  counts and which one is "active". Will come from a per-series "arcs"
  table/endpoint, keyed by the same `slug` the route already receives via
  `params.slug` (not yet used — the page always renders the Shibuya arc,
  and the same hardcoded AniList series id, regardless of the URL's
  `[slug]`).
- `ARC` — arc-specific metadata that's still fully hardcoded: name,
  episode range, season/date line, badges, and the four top-line stats.
  (`breadcrumb[0]`, `description`, and `characters` are overridden by
  real AniList data when available — see above.) A real version needs an
  arc detail endpoint (for the arc-specific fields) that also stores
  which AniList series id each arc belongs to.
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

## Hardcoded data (in `app/submit/page.jsx`)

- `RESOLVED_LINK` — stands in for what a real link-resolver service would
  return for the pasted URL (title, creator, platform, thumbnail). It's
  the same TikTok item as the Shibuya arc page's "The Sealing" beat
  (Session 1), used regardless of what the user actually types into the
  step 1 URL field — the "auto-detection" is entirely fake.
- `SERIES_DETECTED` / `ARC_DETECTED` — the step 2 "auto-detected" series
  and arc, always Jujutsu Kaisen / Shibuya Incident Arc regardless of the
  resolved link. A real version needs actual title/caption parsing (or
  manual series/arc pickers behind the still-inert "Change" links).
  `note` is the small "Detected from…" explainer text under each field.
- `BEATS` — the 10-bar beat selector's chart data (label, bar height,
  placeholder item count). Same caveat as `INTENSITY_BEATS` on the arc
  page: heights are hand-picked, not derived from real engagement data;
  `count` is invented per-beat except "The Sealing" and "Yuji breaks"
  (see the Session 5 note above).
- `INITIAL_CHARACTERS` — the one pre-detected character chip (Gojo
  Satoru). A real version needs actual character detection from the
  video/caption, plus a working character picker behind "+ Add
  character" (currently inert).
- `CONTENT_TYPE_OPTIONS` — the 6 content-type pills; "Edit / AMV" is
  preselected to match the mockup. These are just labels, not IDs tied to
  any real taxonomy yet.

## Hardcoded data (in `app/series/[slug]/page.jsx`)

- `ARCS` and `MORE_ARCS_LABEL` — the exact same 8 placeholder arcs (plus
  "+ 3 more arcs" label) as the search page's `ARCS`/`MORE_ARCS_LABEL`,
  duplicated rather than imported (see the Session 8 note above on why).
  Same caveat as everywhere else this data appears: not derived from
  whichever real series the page is showing.
- Everything else on this page — hero title, description, genres, score,
  format/year/episodes/status, and all 10 character chips — is real
  AniList data keyed off the `[slug]` (an AniList numeric id), the first
  page in the project where that's true.

## Explicitly not done

- No routing/data logic keyed off the `[slug]` param — every slug renders
  the same hardcoded Shibuya Incident Arc, including the arc links
  clicked from the search page and the home page's trending arc cards
  (`/arc/introduction-arc`, `/arc/rumbling-arc`, etc. all currently
  render the same Shibuya page).
- **Resolved in Session 6**: the `?q=` query param on `/search` is now
  read and drives a real AniList lookup for the series panel. What's
  still not real: the arc list, characters, "also found," and top
  content sections all stay fully hardcoded regardless of `?q=` (see the
  Session 6 notes above) — e.g. searching "Attack on Titan" shows a real
  AniList series panel over a hardcoded Chainsaw Man arc list.
- No tab/filter-pill filtering on any page — clicking a tab or a filter
  pill doesn't change which items are shown.
- No API, database, or auth — the nav links, "Browse"/"Submit
  content"/"Sign in" buttons, character chips, "also found" rows, and
  trending-moment rows are all static, non-functional markup beyond the
  navigation described elsewhere in this doc. (Search itself is real as
  of Session 6, for the series panel only.)
- No pagination/infinite scroll for the card grids, and no real
  expansion behind the "+N more" affordances on the search page.
- No real link resolution, series/arc/character/beat detection, or
  submission on `/submit` — every field in the wizard is either hardcoded
  ("detected" values, the resolved link) or purely local `useState` (beat
  selection, character removal, content type, checkboxes). The final
  step's button is intentionally disabled ("Coming soon — backend not
  connected yet"); nothing on this page can actually add content to the
  index yet. The Series/Arc "Change" links, "+ Add character", "Skip
  this beat", and "How placement works" links are all inert.
