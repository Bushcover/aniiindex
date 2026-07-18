# aniindex

A fan content index for anime series. Started as a single hardcoded
mockup page; as of Session 38 it has a real Next.js App Router
structure, real AniList GraphQL data on several pages, a real
Supabase database with a working (if narrowly-scoped) submission
pipeline, real Supabase Auth magic-link sign-in (a 6-digit-code
variant was tried in Session 15 and reverted in Session 16 — the
Supabase free plan doesn't allow the email template edit that a code
requires; see the Session 16 notes for the full story), submissions
that are genuinely tied to the signed-in user who made them, a
no-auth community quality-control layer (Session 18, bug-fixed across
Sessions 19–21) — pending items are visibly marked, any viewer can
confirm a pending placement (two confirmations promote it to
`confirmed`) or flag an item outright, and both actions update the
arc page instantly, client-side, with no reload required — real
multi-arc/multi-series data seeded across Sessions 23–25, a real
client-side content-type tab filter (Session 28), a real mobile-
responsive layout on every page (an eight-session saga, 29–36), and
real (not hardcoded) arc-page fan-item counts and home-page trending
arcs (Session 37). See "Current State — Handoff Audit" immediately
below for a full, current snapshot; the session-by-session log after
it is the historical record of how each piece got built.

**A note on session numbering**: this file's session count has been
mislabeled by incoming tasks more than once — a task framed as "Session
15" turned out to collide with an already-used number (the email-OTP
detour, see that log entry below), so the work was logged as **Session
18** instead; later, a task framed as "Session 20" collided the same way
and was logged as **Session 37**. The rule applied consistently every
time this happens: treat the work as new and log it under the next
actually-available sequential number, without renumbering anything
already written. **Full project audits have been done three times**:
Session 17 (the first), Session 22 (the second, "every file in `app/`,
`components/`, and `lib/`, plus every config file, was re-read directly
from disk"), and **Session 38 (this one, the third)** — same standard:
every file re-read fresh from disk, not reconstructed from Sessions
23–37's incremental patches to this section.

## Current State — Handoff Audit (as of Session 38, full project audit)

This section is a complete, current-state snapshot of the project, written
as a handoff for whichever session picks this up next. The session-by-
session log below this section is still the accurate history of *how* the
project got here and *why* specific decisions were made — read this section
first for orientation, then the log for the reasoning behind any specific
piece of code.

**Session 38 is this file's third full audit** (the first was Session 17,
the second Session 22). Every file in `app/`, `components/`, and `lib/` —
38 files (37 through Session 22's own count; `components/ArcContent.jsx`
was added in Session 28, after that count was taken) — plus all 4 root
config files (`next.config.mjs`, `jsconfig.json`, `package.json`,
`.gitignore`) were re-read directly from disk this session, not
reconstructed from Sessions 23–37's incremental patches to this section.
Two small staleness corrections came out of that re-read, noted here since
they're the kind of drift a documentation-only audit exists to catch:
`lib/supabase.js` has **one** module-load `console.log` call (a single
multi-line statement), not two as this section previously said; and only
**one** `TODO`-marked comment remains in the codebase
(`app/search/page.jsx`'s hardcoded-arc-list note) — the series page has an
equivalent, similarly-tracked comment but it doesn't use the literal `TODO`
marker, so counting it as a second `TODO` was inaccurate bookkeeping, not
a discovered gap. **Nothing in the application code changed this
session** — this is a documentation-only pass, same convention as Sessions
17 and 22. Where this section disagrees with something a session log below
says, this section is the current truth — the logs are history, not a live
source.

**What's changed since Session 22's audit** (the high-level summary — see
each session's own log entry below for the full reasoning and diagnostic
detail):
- **Sessions 23–25 — real multi-arc/multi-series data**: seeded a second
  and third series (Attack on Titan, Chainsaw Man) and 4 more arcs beyond
  the original single Shibuya seed, then made the arc page (`getArcMeta`),
  the arc-chip nav strip and series-page arc list (`getArcsBySeries`) all
  derive their header/routing data from whichever real `arcs`/`series` row
  actually matches the current URL, instead of always assuming Jujutsu
  Kaisen/Shibuya. Session 26 found (and Session 27 fixed) a real data bug
  this exposed: Chainsaw Man's seeded `anilist_series_id` was wrong.
- **Session 28 — real tab filtering**: the arc page's content-type tabs
  (All/Edits & Video/Fan Art/Discussion/OST & Music) went from decorative
  to a genuine client-side filter, via a new client component
  (`ArcContent.jsx`) that owns the active-tab state the server-rendered
  page itself can't hold.
- **Sessions 29–36 — mobile responsiveness, an eight-session saga**: a
  real-device "page slides sideways on mobile" report that took eight
  rounds to fully close, because most of the real causes (a missing
  viewport meta tag, two different sticky-positioning regressions, a
  signed-in-only nav overflow invisible to every session that only ever
  tested signed-out, and an unrelated card-grid `minmax()` overflow) were
  each invisible to the testing technique that had worked for the
  previous cause. See "Known issues" below for the full blow-by-blow —
  it's kept there rather than summarized away, since the specific reasons
  each round's verification missed the next bug are the actually useful
  part of that history for whoever hits a mobile report next.
- **Session 37 — the arc page's hero stats and the home page's "Trending
  arcs" stopped being fake numbers**: the arc page's Fan items count is
  now a real `content_items` count (Saves/This week/Contributors show a
  dash — nothing tracks them); the home page's 6 trending-arc cards are
  now real arcs with real item counts and real per-arc beat intensity,
  via a new `getTrendingArcs` query, with an honest empty-state
  placeholder for any slot real data doesn't fill rather than fake arcs
  padding the row back to 6.

Phase 5 (Sessions 18–21, quality control) remains stable and unchanged
since Session 22's audit — confirming and flagging both still work end to
end in production. See "Phases" below for the current phase list, which
now names a **Phase 6** (Sessions 22–37, closed as of this audit) covering
everything summarized above, and a **Phase 7 roadmap** (renamed from the
old "Phase 6+ roadmap") for what's next.

**Stack**: Next.js 14.2.35 (App Router), plain JavaScript/JSX (no
TypeScript), no CSS framework (global stylesheet ported 1:1 from the
original mockup, plus one colocated CSS Module per page/component that
needs page-specific or component-specific styles), `@supabase/supabase-js`
(`^2.110.5`) as the only real dependency beyond `next`/`react`/`react-dom`
— confirmed directly from `package.json`; no other runtime dependency has
ever been added (Sessions 20/21 each installed Playwright temporarily for
browser-driven verification via `npm install --no-save`, then uninstalled
it before finishing — confirmed via `git status` on `package.json`/
`package-lock.json` showing no diff either time). No test runner, no
linter config beyond Next's own built-in ESLint (never actually run in
this repo — `next lint` prompts for first-time setup and no session has
completed it), no CI configuration exists in this repo.

Default branch: **`claude/aniindex-arc-page-nextjs-wwizd5`** (not `main` —
this repo has no `main` branch). This is the branch Vercel deploys as
Production. Sessions 13–16 developed on an assigned feature branch and
fast-forward-merged into the default branch; Sessions 18 onward (including
this one) have developed and pushed directly to the default branch.
Always confirm with `git log --oneline -1` rather than assuming.

**Phases**:
- **Phase 1** (Sessions 1–5): converted static HTML mockups into Next.js
  pages/components, 100% hardcoded data.
- **Phase 2** (Sessions 6–8): wired real AniList GraphQL data into the
  search, arc, and series pages.
- **Phase 3** (Sessions 9–12): added Supabase as a real database — schema,
  seeding, the submit form's real write path, the arc page's real read
  path, real Open Graph/oEmbed link detection.
- **Phase 4 — auth (Sessions 13–17), closed**: real Supabase Auth
  sign-in (a magic link, Session 13); a UX fix so the sign-in success
  screen is never a dead end; a detour into a 6-digit email-OTP flow
  (Session 15) that was reverted back to the magic link (Session 16); the
  signed-in user's identity wired into real app behavior (Session 14) —
  `submitted_by` and the arc page's "Yours" badge; and Session 17, a full
  audit.
- **Phase 5 — quality control (Sessions 18–21), stable**: a "pending
  review" badge, a "confirm placement" button, and a flag button on the
  arc page's content cards, backed by two new API routes (`/api/confirm`,
  `/api/flag`). Built in Session 18; hardened against three real
  production bugs across Sessions 19–21. Both actions are confirmed
  working end to end against the live Supabase project.
- **Phase 6 — real data expansion + platform hardening (Sessions 22–37),
  closed as of this audit**: Session 22's own full audit, then real
  multi-arc/multi-series seeding and per-slug routing (23–25, including a
  real production data bug found and fixed — Chainsaw Man's wrong
  `anilist_series_id`, 26–27), a real client-side content-type tab filter
  on the arc page (28), an eight-session mobile-responsiveness effort that
  eventually found and fixed every real cause of a "page slides sideways
  on mobile" report (29–36), and the arc page's hero stats / home page's
  trending arcs going from hardcoded mockup numbers to real Supabase
  queries (37). See "What's changed since Session 22's audit" above for
  the summary and "Known issues"/the session log below for full detail.
- **Phase 7 roadmap**: not started. See "Phase 7 roadmap" at the end of
  this section for what's next, roughly ordered by what unblocks the most
  other things.

### Complete file inventory

Every file in `app/`, `components/`, and `lib/`, confirmed by reading each
one directly from disk this session (38 files total, plus 4 root config
files):

```
app/
  layout.jsx                      Root layout — server component. Syne + Inter fonts via Google Fonts <link> tags, imports globals.css, static <head>/metadata (title "Aniindex"). As of Session 30: also exports `viewport = { width: "device-width", initialScale: 1 }` — this was missing entirely through Session 29, meaning every `@media (max-width: ...)` rule added that session almost certainly never matched on a real mobile browser (which defaults to an ~980px layout viewport without this, regardless of physical screen size) even though it tested clean under Playwright/DevTools viewport emulation (which sets the rendering viewport directly, bypassing the need for this tag).
  globals.css                     Shared styles ported 1:1 from the original mockup's <style> block. Bare-tag/class selectors (nav, .btn, .card, .thumb, .yours-badge, .pending-badge, .card-actions, .confirm-btn, .flag-btn, etc.) used across every page — see "Design tokens" below for the full custom-property list. As of Session 29: a `.tab-empty-state` class (the tab-filter empty-state message, `ArcContent.jsx`) and a responsive section at the end (`@media (max-width: 768px)`/`(max-width: 480px)`) fixing `.tabs-wrap` (no horizontal-scroll handling before this, unlike `.arc-strip-wrap`), the arc page's `.hero h1` size, and `.cards`' grid at mobile widths. As of Session 30: `body { overflow-x: hidden; }` (real-device-only mobile overflow, see "Known issues" — reached this exact one-line rule only after two attempts that both broke `nav`'s `position: sticky`, see the rule's own comment for the full story), plus `overflow-wrap: break-word` on `.ctitle`/`.ccreator` (real submitted content, e.g. a long unbroken creator handle, has no length limit the way this app's own mock/test strings always did). As of Session 31 — the arc page's content tabs were still reported overflowing on a real device despite Session 30's fixes: `.tabs` switched from horizontal-scroll (`overflow-x: auto` + `width: max-content`) to `flex-wrap: wrap` at `max-width: 768px`, structurally removing the nested-scrollable-region-inside-a-sticky-element pattern entirely rather than continuing to harden it; `.tabs-wrap` (itself `position: sticky`) also gets `overflow-x: hidden` directly as a backstop, confirmed via an isolated test page not to break its own stickiness (only two *ancestors* both having non-visible overflow-x does that, not an element and one ancestor — see that rule's own comment). `.arc-strip-wrap` also gets `overscroll-behavior-x: contain` defensively (not reported broken, but the same nested-horizontal-scroll pattern, and this is the purpose-built property for stopping a nested scroll region's touch gesture from chaining out to the whole page — a real-device-only failure mode a `scrollWidth` check can't detect at all). As of Session 32 — a requested "reset" pass after real-device overflow was reported a fourth time: `html { max-width: 100vw; }` (new), `*, *::before, *::after` gains `max-width: 100%` (added to the Session 1 box-sizing/margin/padding reset already there), and `body` gains `max-width: 100vw` (alongside its existing `overflow-x: hidden`). **Deliberately does not add `overflow-x: hidden` to `html`**, even though that was explicitly requested — see the rule's own comment for the full reasoning: Session 30 already proved, via an isolated test page, that `overflow-x: hidden` on both `html` and `body` together breaks `nav`'s `position: sticky`, and `body` alone already provides full containment. Confirmed the universal `max-width: 100%` doesn't break `.arc-strip`'s intentional wider-than-container horizontal scroll (`width: max-content`) — its own rendered `width` gets capped to its container's, but its flex children still refuse to shrink below their natural size (unrelated default flexbox `min-width: auto` behavior on the children, not overridden by the parent's cap), so `scrollWidth` still reports the full unshrunk content extent and `.arc-strip-wrap`'s existing `overflow-x: auto` still scrolls it exactly as before — confirmed via direct measurement and a screenshot, not assumed. As of Session 33: `.tabs-wrap`'s `overflow-x: hidden` (previously only inside the `max-width: 768px` query) moved to its own unconditional base rule — a minor gap closed, not a new bug fix; see "Known issues" for why this session otherwise came up empty despite a thorough from-scratch structural comparison against the home page.
  page.jsx                        Home page (`/`) — as of Session 37, an **async** server component (`export const revalidate = 0`, same as the arc page). `NAV_LINKS`, `HERO_STATS`, `POPULAR_SERIES`, `TRENDING_MOMENTS`, `FEATURES` are still hardcoded; the "Trending arcs" section (formerly `TRENDING_ARCS`, a fully hardcoded 6-card list) now calls `getTrendingArcs(6)` and renders real arcs with real item counts and real per-arc beat intensity, filling any of the 6 grid slots real data doesn't cover with a plain `.arcCardEmpty` placeholder — see "Known issues" and the Session 37 log entry for the full story. Composes HeroSearch + Sparkline + NavAuth.
  page.module.css                 Home-page-only styles (hero, arc/series cards, trending moments list, feature pills). As of Session 29: a responsive section hides `.navLinks` (Browse/Series/Characters/Seasonal — already plain non-clickable divs, not real nav) at `max-width:768px`, since it was the confirmed cause of this page's nav overflowing on mobile, plus a `.hero h1` size tightening at `max-width:480px`.
  arc/[slug]/page.jsx             Arc page — async server component, `export const revalidate = 0` (forces dynamic, no caching). As of Session 24: looks up `params.slug` in Supabase's `arcs` table via `getArcMeta` (a second round trip, run before the AniList calls since they depend on its result) to get the arc's real title, episode range, and `anilist_series_id`; uses that id to fetch the correct series' real AniList description/characters (`getSeriesById`/`getSeriesCharacters`), instead of always querying Jujutsu Kaisen's hardcoded id. Falls back to `FALLBACK_ANILIST_SERIES_ID` (113415, JJK) and the hardcoded `ARC` object's own `name`/`episodes` when `params.slug` isn't seeded. As of Session 25: also calls `getArcsBySeries(anilistSeriesId)` and builds `arcNavItems` (real arc chips for the current arc's series, each `{ slug, name, active }`) passed to `ArcNav` — falls back to the hardcoded `ARC_NAV` placeholder strip when the series has no other seeded arcs. `TABS` is still fully hardcoded regardless of slug — deliberately out of scope. `ARC`'s `badges`/`seasonPart`/`dateRange` were also always Shibuya's regardless of slug through Session 43; **as of Session 44, these are omitted entirely for any real seeded arc** (`arcMeta` present) rather than shown wrong — none of the three have a real per-arc data source in this schema (episode_start/episode_end are episode numbers, not air dates; nothing tracks a season/part label or an intensity/spoiler classification at all), so "derive them from real data" wasn't possible the way `episodes` itself was in Session 24 — the honest fix was hiding them, matching this project's "omit rather than fabricate" convention. The breadcrumb's second segment (previously always the hardcoded `"Season 2"`) is dropped the same way for a real arc — `breadcrumb` is just `[seriesName]`, not `[seriesName, "Season 2"]`. All three (badges/seasonPart/dateRange) still render at their original hardcoded values on the fallback path (`arcMeta` null, i.e. `params.slug` isn't seeded), unchanged. As of Session 37: `stats`' "Fan items" value is real (`realArcContent.length`, the same already-fetched list `getArcContent` returns — no separate query needed), the other three (Saves/This week/Contributors) render as a plain dash rather than a fabricated number, since no table tracks any of them yet — see "Known issues." Supabase beats/content (keyed by params.slug, via getArcBeats/getArcContent) are unchanged. `buildBeatSections` threads each real item's `id` and `status` through to ContentCard (needed for the pending badge/confirm/flag UI). Session 25's two temporary diagnostic `console.error` calls (added to chase a missing-beats bug on `/arc/control-devil-arc`) were removed in Session 27 once that bug was confirmed fixed live — no debug logging of any kind remains. As of Session 28: no longer renders `ContentTabs`/`IntensityChart`/`BeatSection` directly — delegates everything from the tab bar down to the new client component `ArcContent` (`tabs={TABS}`, `intensityBeats`, `beatSections` passed through unchanged), since the tab-filtering feature needs client state shared between the tab bar and the beat sections, and this page itself is a Server Component.
  search/page.jsx                 Search page (`/search`) — async server component. Real AniList series panel (keyed by ?q=), everything else (TOP_CONTENT, FILTERS, ALSO_FOUND, RESULTS_SUMMARY) hardcoded. As of Session 44, the Characters column is also real — `getSeriesCharacters(series.id)` (the same function the arc page and series page already call, `lib/anilist.js`), keyed directly off the AniList id the series match already carries, no extra Supabase round trip needed (unlike the arc list). Each real character renders its real AniList portrait (`char.image`) when present, or a small rotating-palette colored-initials fallback (`CHAR_AVATAR_COLORS`/`getInitials`, page-local — not `components/CharacterChips.jsx`, since this column's own grid/chip visual design differs from that shared component's flat-list style) when AniList has no image for them; no mention-count badge, since no real per-character count exists (the old hardcoded list's numbers were fabricated). Renders "No characters listed for this series." if AniList genuinely has none, or if the fetch fails (caught separately from the series-search fetch above, so a characters-specific failure doesn't take down the already-resolved series panel/arc list). As of Session 42, the arc list is also real: once AniList resolves a series match, `getSeriesByAnilistId(series.id)` looks up the matching Supabase `series` row, then `getAllArcsForSeries(seriesRow.id)` fetches its real arcs, then `getArcSparkline(arc.id)` (one call per arc, via `Promise.all`) fetches each arc's real beat-intensity sparkline — falling back to a flat, equal-height `FLAT_SPARKLINE` (5 bars, 50%, "normal") only for an individual arc with zero beats seeded, never for the list as a whole. `num` is the real `order_index` zero-padded; `peak` is derived from whether any of that arc's own beats is `is_peak` (not fabricated — a real read of the same data driving the sparkline). If AniList resolves a series but nothing matches it in Supabase at all (no `series` row, or a `series` row with zero arcs), renders "No arcs indexed yet for this series." instead — the old hardcoded `ARCS`/`MORE_ARCS_LABEL` (an 11-arc Chainsaw Man placeholder list, unrelated to whatever was actually searched) is gone entirely, not just bypassed when real data exists. Renders ContentCard directly (compact mode) for TOP_CONTENT — the one place a Server Component renders the now-client-component ContentCard, which is valid, ordinary App Router behavior.
  search/search.module.css        Search-page-only styles — also imported directly by components/ArcList.jsx and app/series/[slug]/series.module.css's sibling page (series page reuses SearchNav, which imports this module). As of Session 29: `.twoCol` (arc list | characters+top content) stacks to a single column at `max-width:768px` — confirmed via direct measurement that both columns squeezed to ~185–236px on a 390px viewport before this fix, with the right column extending 83px past the viewport. As of Session 30: `.seriesName` (the real AniList series title) also has `overflow-wrap: break-word`. As of Session 31 — both `.typeFilters` (the search-page filter pills row) and the real series panel were still reported overflowing on a real device: `.typeFilters` gets `overflow-x: hidden` unconditionally plus `width: 100%` at `max-width: 768px` (forces it to claim its full row width once `.resultsHeader`'s own flex-wrap puts it on its own line, closing an edge case plain `flex-wrap` didn't); `.seriesPanelBody` (a `flex: 1` child of the already-`overflow: hidden` `.seriesPanel`) gets `min-width: 0` — it had none, so its real content (poster/title/genre tags/buttons) could refuse to shrink below its own natural width and get silently clipped by the panel's existing `overflow: hidden` instead of properly reflowing, which is the likely explanation for "content cut off" specifically (as opposed to the page itself growing wider).
  submit/page.jsx                 3-step submission wizard (`/submit`) — client component, owns all wizard state. Real: step 1's /api/og-fetch link detection, step 2's manual series/arc picker (Phase 7, Session 39 — replaced the old hardcoded SERIES_DETECTED/ARC_DETECTED/ARC_SLUG: a debounced (300ms) series search box calling lib/supabase.js's new searchSeries(query), rendered as selectable chips; picking one loads that series' arcs via the new getAllArcsForSeries(seriesId) as a selectable list; picking an arc loads its real beats via the existing getArcBeats(arc.slug), same beat-selector chart as before, now keyed to whichever arc was actually picked instead of always Shibuya), step 3's real content_items insert with a real submitted_by (session.user.id, or "anonymous" when signed out) and a real arc_id/beat_id (the selected arc/beat's own ids — no separate arc-lookup query needed at submit time anymore, since the picker already resolved a real arcs row). As of Session 40, the character-tags field is also real free-text (bug fix — see that session's log entry): starts empty, no hardcoded "Gojo Satoru" chip, a plain text input where Enter commits the typed text as a removable chip (`characters` is now a plain array of strings, not `{name, initials, color}` objects — `character_tags` on insert is `characters` directly, no `.map((c) => c.name)` needed). Session 40 originally also wired comma as a second commit trigger; Session 41 removed it again at the user's request — Enter is now the only way to commit a chip, and comma types literally into the input like any other character. Step 3's success screen also gained a "View arc page" button (`Link` to `/arc/${selectedArc.slug}`) alongside a "Back to home" link, both session 40. Hardcoded: CONTENT_TYPE_OPTIONS (just labels). No debug logging.
  submit/submit.module.css        Submit-page-only styles (step indicator, all 3 step cards, beat selector chart, character chips, quality checklist). All 13 `var(--green)`/`var(--green-soft)` call sites resolve to a real color (both tokens defined in globals.css's `:root` since Session 18).
  series/[slug]/page.jsx          Series page (`/series/[slug]`) — async server component, `[slug]` is an AniList numeric id (not an aniindex slug). Real: everything about the series itself + top-10 cast. As of Session 25: also calls `getArcsBySeries(anilistId)` and, when it returns any rows, renders those as real `ArcList` rows (`slug`, `name` ← `title`, `num` ← zero-padded `order_index`; no `count`/`spark`/`peak` — omitted, no real equivalent exists yet) instead of the hardcoded `ARCS` placeholder list, and drops the hardcoded `moreLabel`. Falls back to `ARCS`/`MORE_ARCS_LABEL` for any series with nothing seeded.
  series/[slug]/series.module.css Series-page-only styles (banner hero, genre pills, score row). As of Session 29: `.heroInner` switches from row to column at `max-width:768px` — confirmed via direct measurement that the fixed-160px poster + flex info block didn't just look cramped but genuinely broke (info squeezed to ~150px, wrapped into an 1000px+-tall column, and `align-items:flex-end` shoved the poster hundreds of pixels down to align with it, landing it mid-page instead of at the top).
  submit/page.jsx and series/[slug]/page.jsx share no code beyond components — noted since they're easy to conflate by name similarity.
  api/og-fetch/route.js           POST route — real HTML/OG scraping (regex-based, no HTML-parsing dependency) for TikTok/X/Instagram/Reddit; real YouTube oEmbed (a separate code path, no scraping) for YouTube. Basic hostname-literal SSRF guard + 8s timeout on every upstream fetch. No response-size cap (see "Known issues"). Unchanged since Session 12.
  api/confirm/route.js            POST route, body `{ id }`. Calls lib/supabase.js's confirmContentItem(id) and returns its result as JSON, or a 400/500 with `{ error }` on a missing id / thrown error. No auth check — any viewer can confirm a pending item. The catch block console.error's the full thrown error (with the id) before responding — intentional, permanent operational logging (added Session 19), not a temporary debug log.
  api/flag/route.js               POST route, body `{ id }`. Calls lib/supabase.js's flagContentItem(id) and returns its result as JSON, or a 400/500 with `{ error }`. No auth check. Same console.error-before-responding pattern as api/confirm/route.js.
  auth/page.jsx                   Sign-in card (`/auth`) — client component, single step. Email input → "Send magic link" (calls signInWithEmail) → success screen ("Check your email — we sent you a sign in link" + a same-device note + a "← Back to home" link, so the screen is never a dead end). Real error states, not simulated.
  auth/auth.module.css            Styles for auth/page.jsx and auth/callback/page.jsx (imported by both).
  auth/callback/page.jsx          Magic-link redirect handler (`/auth/callback`) — client component, wrapped in <Suspense> (required for useSearchParams in a statically-rendered page). Exchanges the URL's `code` for a session via exchangeCodeForSession, or falls back to checking for an already-parsed hash-based session (implicit-flow links), then redirects to `/` or shows an error. Genuinely load-bearing — every real magic-link click passes through this page.
lib/
  anilist.js                      searchSeries(query, {perPage}) / getSeriesById(id) / getSeriesCharacters(id, {perPage}) / getSeriesWithRelations(id) — real AniList GraphQL calls via a shared postToAniList() helper, each cached via Next's fetch cache (next: { revalidate: 3600 }). All four throw on request/GraphQL failure; getSeriesById/getSeriesWithRelations strip AniList's HTML markup out of `description` before returning. searchSeries unchanged since Session 8 through Session 42; as of Session 43, its query sorts by `POPULARITY_DESC` (was `SEARCH_MATCH`) and adds a `popularity_greater: $minPopularity` filter (a new `MIN_SEARCH_POPULARITY = 1000` constant) — fixes a real bug where AniList's own relevance ranking put an obscure, unrelated title ahead of the actual popular series a query almost always means (searching "Demon Slayer" returned "Onigiri," AniList id 21612, ahead of the real "Kimetsu no Yaiba," id 101922, confirmed live against AniList's API both before and after this fix). `type: ANIME` (present since Session 6, unchanged) is what already restricts results to anime rather than manga.
  supabase.js                     Exports the shared `supabase` client (createClient with a placeholder-URL fallback so a missing env var can't crash next build; a custom fetch wrapper opts every request out of Next's server fetch cache) plus getArcMeta(slug) (added Session 24 — selects `title, episode_start, episode_end, anilist_series_id` from the arc's own row; returns null for an unseeded slug, same convention as the two below; this is what lets the arc page derive a real header/AniList id per slug instead of always assuming Shibuya/JJK), getArcsBySeries(anilistSeriesId) (added Session 25 — selects `slug, title, episode_start, episode_end, order_index` for every arc row matching a given AniList series id, ordered by order_index; always returns an array, `[]` on no match or query error, never null, unlike the slug-keyed lookups below — used by the arc page's nav strip and the series page's arc list; as of Session 30 also checks a small hardcoded `ANILIST_ID_ALIASES` map — currently just `{145064: [113415]}`, since AniList gives Jujutsu Kaisen Season 2 its own separate id (145064) from the one this project's real arcs are actually seeded under (Season 1's 113415, confirmed live against AniList's API), so a user who searches "JJK Season 2" specifically would otherwise see zero real arcs on the series page), getArcBeats(slug), getArcContent(slug) (both return null for an unseeded slug, an array otherwise; getArcContent's select list includes submitted_by; its `.in('status', ['confirmed','pending'])` allowlist is also what excludes flagged items, with no separate filtering step needed), confirmContentItem(id), flagContentItem(id), and getTrendingArcs(limit=6) (added Session 37 — fetches the most recent visible content_items, embedding each item's arc/series, and collapses to one entry per arc_id in JS (a Map preserves the newest-first insertion order, so no separate aggregate query is needed), then a second query for those arcs' real beats to build a genuine sparkline/peak-label; always returns an array, `[]` on a query error or when nothing has content yet — no fake data ever padded in, that's the home page's own job via its empty-state placeholder). As of Session 25, the internal `getArcRowBySlug` helper (used by getArcBeats/getArcContent) and getArcMeta both use `.limit(1).maybeSingle()` instead of `.single()` — defends against a duplicate-slug row (this table is seeded entirely by hand via the SQL editor) making `.single()` throw and taking every caller down with it, rather than degrading to "use the first match." getArcMeta's Session 25 temporary diagnostic `console.log` (added to chase a missing-beats bug on `/arc/control-devil-arc`) was removed in Session 27 once that bug was confirmed fixed live. confirmContentItem: select-then-update, no-ops if the row isn't currently 'pending', chains `.select().maybeSingle()` onto its update and throws + console.errors if the result is null (an RLS-blocked UPDATE matches zero rows silently — this is what let Session 18's original version report false success). flagContentItem (rewritten in Session 21): does an initial select to confirm the id exists/is readable, then performs the update and trusts its own `{ error }` result alone — no post-update verification select, specifically because that verification technique (tried two different ways across Sessions 19–20) kept hitting a genuine Postgres `42501` permission error on a row whose new status ('flagged') isn't covered by the read policy. Logs the resolved Supabase URL/key-presence once at module load (safe — never logs the actual key). As of Session 39 (Phase 7), also exports searchSeries(query) (case-insensitive `ilike` partial match on `series.title`, up to 10 rows, blank query short-circuits to `[]` without querying; never throws, same best-effort convention as getArcsBySeries/getTrendingArcs) and getAllArcsForSeries(seriesId) (every `arcs` row for a given `series.id` foreign key, ordered by order_index; always an array, `[]` on no match or error) — both added for `/submit`'s new manual series/arc picker. As of Session 42, also exports getSeriesByAnilistId(anilistId) (resolves a `series` row from its AniList numeric id, `.limit(1).maybeSingle()`, same duplicate-row defense as getArcRowBySlug/getArcMeta; returns null when unseeded — used by the search page as the first step before getAllArcsForSeries, since a search result only ever carries an AniList id, not the internal `series.id` that function needs) and getArcSparkline(arcId) (an arc's own beats ordered by order_index, shaped directly as Sparkline bars — `{heightPct, tier}`, same intensity/is_peak-derived tier logic getTrendingArcs already uses — keyed by the arc's own row id rather than its slug, since every caller already has a real `arcs` row in hand; always an array, `[]` on no beats seeded yet or a query error, with no fallback baked in — the search page decides what to render instead). **Naming collision worth knowing about**: `lib/anilist.js` has its own, unrelated `searchSeries(query, {perPage})` (a live AniList GraphQL search, unchanged since Session 6) — same function name, different module, different backing data (AniList's catalog vs. this project's own seeded `series` table). No file imports both today (`app/search/page.jsx` imports AniList's; `app/submit/page.jsx` imports this one), so there's no runtime clash, but a future session adding a new call site should double-check which `searchSeries` it's importing from `@/lib/anilist` vs. `@/lib/supabase` — the two are not interchangeable.
  auth.js                         signInWithEmail(email) — supabase.auth.signInWithOtp with emailRedirectTo pointed at /auth/callback (a genuine magic link, see the Session 15/16 history for why not a code). signOut() and getSession() — thin wrappers, getSession() swallows its own error and returns null rather than throwing. All three exported; no other functions in this file.
components/
  ArcContent.jsx                  Added Session 28. Client component (`"use client"`) that owns the arc page's content-tab filter state and renders everything from the tab bar (`ContentTabs`) through `IntensityChart`, the beat-section list, and the index note — moved out of `app/arc/[slug]/page.jsx` (a Server Component, can't hold state) since `ContentTabs` and the beat sections aren't parent/child in the markup but both need to react to the same "which tab is active" state. Props: { tabs, intensityBeats, beatSections } — all three passed through unchanged from the arc page's existing consts/real-data computation. Owns `activeLabel` state (defaults to whichever tab has `active: true`, i.e. "All"); maps each tab label to a content-type "bucket" (`edit`/`fanart`/`discussion`/`ost`/`null` for All) and classifies each item's `contentType` tag(s) into a bucket via keyword matching (`classifyTag` — handles both real Supabase `content_type` strings like `"Edit / AMV"` and the hardcoded fallback data's more varied tag vocabulary like `"AMV"`/`"Tribute"`, since content_type has never been a real enum). On "All," every beat section renders unfiltered, including ones with zero items (preserves the pre-existing "empty beat still shows its header" behavior). On any other tab, each beat's items are filtered to matches and the whole beat section is dropped if none match, rather than showing an empty header. As of Session 29: if a non-"All" filter matches zero items across every beat (not just one), the beat-section list is replaced with a single `.tab-empty-state` message ("No {tab label} content yet for this arc — be the first to submit some.", linking to `/submit`) instead of rendering nothing — the individual per-beat hiding from Session 28 already worked, but there was no explanation shown for a filter matching nothing anywhere. `IntensityChart` itself is not filtered — only content cards/beat sections, per the task's scope. As of Session 40 (bug fix), also owns a `confirmedIds` Set (state) — the confirm-optimism tracking moved here from ContentCard's own local state, since ContentCard/BeatSection can be unmounted and remounted by this component's own tab filtering (an item that doesn't match the active tab's bucket has its ContentCard removed from the tree entirely), which was silently resetting a just-confirmed item's local "confirmed" flag back to "pending" the moment the user switched tabs away and back. `confirmedIds` and a new `onItemConfirmed(id)` handler are threaded down through `BeatSection` to each `ContentCard` as `confirmedIds`/`onItemConfirmed` (Beat­Section) and `locallyConfirmed`/`onConfirmed` (ContentCard) — see those two files' own entries below.
  ArcNav.jsx                      Horizontal arc-chip strip (the row under the top nav on the arc page). Props: { arcs: [{ slug, name, count?, active? }] }. No props default; `arcs` is required. As of Session 25: each chip is a real `next/link` to `/arc/${slug}` (previously a plain, unclickable `<div>` — the actual root cause of a "nav chips aren't clickable" bug report, independent of whether the strip's data was hardcoded or real); `count` is optional (renders no badge when omitted, since real Supabase arc rows have no fan-item-count equivalent) rather than the old unconditional `.toLocaleString()` call, which would have thrown on a real arc's missing `count`.
  ArcHero.jsx                     Breadcrumb / <h1> / meta row (episodes, season, dates, badges) / description / character chips (via CharacterChips) / 4-stat row. Props: { arc: { breadcrumb: string[], name, episodes, seasonPart?, dateRange?, badges?: [{type, label}], description, characters: [...CharacterChips props], stats: [{value, label}] } }. As of Session 44, `seasonPart`/`dateRange` are optional (only rendered, with their own `·` separator, when truthy) and `badges` defaults to `[]` when absent — the arc page now omits all three for any real seeded arc rather than always passing Shibuya's hardcoded values regardless of which arc is being viewed; the hardcoded-fallback path still passes all three, so this component renders identically for that path as before.
  ArcList.jsx                     Arc-row list with sparklines; imports search.module.css directly (not its own CSS Module). Props: { arcs: [{ slug, num, name, count?, peak?, spark?: [{heightPct, tier}], dividerAfter? }], moreLabel? }. Used by both the search page (still 100% hardcoded arcs) and the series page (real arcs as of Session 25 when seeded). Each row is a next/link to /arc/${slug} — this was already true before Session 25, so arc-row navigation itself was never the bug on the series page; the bug was that no real arcs reached this component at all. `count`/`spark` are optional as of Session 25 (real Supabase arc rows have neither a fan-item count nor per-beat intensity data yet) — omitted rather than fabricated, matching this codebase's existing convention elsewhere (e.g. YoursBadge).
  BeatSection.jsx                 One story-beat block: heading, item count, optional peak pill, and a grid of ContentCards. Props: { beat: { title, peakLabel, items: [...spread directly into ContentCard] } }, plus (Session 40) `confirmedIds`/`onItemConfirmed` — passed straight through, unowned by this component, to each ContentCard as `locallyConfirmed={confirmedIds?.has(item.id)}`/`onConfirmed={() => onItemConfirmed?.(item.id)}` (see ArcContent.jsx's own entry for why this state lives there instead of here or in ContentCard). `beat.count` (server-computed) is no longer read; the displayed count is `visibleItems.length`, computed client-side from the actually-rendered list. Client component (`"use client"`, since Session 20) that owns a `flaggedIds` Set (state), passes `onFlagged` down to each ContentCard, and filters `beat.items` to exclude any id already flagged before rendering — this is what makes a successful flag remove a card from the page immediately, with no reload, and keeps the "N items" count in sync. Keys are `item.id ?? i` (not array index) — required once the list can shrink from the middle, otherwise React can misattribute a removed item's in-progress button state to whichever card next slides into that index. Note: `flaggedIds` itself is *not* lifted to ArcContent the way confirmedIds was — this component can also be unmounted/remounted by ArcContent's tab filtering (when every one of its items is filtered out under some tab), which would reset `flaggedIds` the same way the confirm bug worked. Out of scope for the Session 40 fix (only asked about confirm), and lower-stakes in practice: a flagged item is also excluded server-side on the *next real fetch* via getArcContent's status allowlist, so the worst case is a flagged item briefly reappearing client-side after this exact remount sequence, not a permanent inconsistency. Worth fixing the same way if reported.
  CharacterChips.jsx              Character chip list (real photo via backgroundImage, or a colored-initials circle fallback; optional mention-count badge). Props: { characters: [{ id?, name, image?, color?, initials?, count? }] }. Used by ArcHero and the series page.
  ConfirmButton.jsx               Client component nested inside ContentCard's default (tall) render path, shown only on a real, pending item (`id` present && `status === "pending"` && not locally confirmed). Props: `{ id, onConfirmed? }` — logic unchanged since Session 20 despite a Session 40 bug fix elsewhere in this same flow (see ArcContent.jsx/ContentCard.jsx): sets its own `loading` state and disables itself synchronously on click, then POSTs `{ id }` to /api/confirm, and only calls `onConfirmed?.()` after `await`ing the response and confirming `res.ok` — the ordering a Session 40 bug report asked for was already correct here; the actual bug was one level up (see below), not in this component's own click-to-API ordering. On success, calls `onConfirmed?.()` — as of Session 40 this bubbles up to ArcContent (previously ContentCard's own local state), which unmounts this component on the next render before its own "✓ Confirmed" render branch would ever paint; that branch is a defensive fallback for a caller that doesn't wire up `onConfirmed`, not something the arc page actually shows. Stops the click from bubbling into the card's own enclosing `<a>`.
  ContentCard.jsx                 Single fan-content link card — default tall mode (globals.css classes) or compact horizontal mode (its own CSS Module). **Client component** (`"use client"`, since Session 20 — kept as one post-Session-40 since it renders ConfirmButton/FlagButton, both client components, and is imported directly by app/submit/page.jsx, a client component; also imported by app/search/page.jsx, a Server Component rendering it as a normal Client Component descendant). Props: { id?, title, creator, platform, thumbnailUrl, contentType, characterTags, sourceUrl, beatLabel, compact = false, submittedBy?, status?, onFlagged?, locallyConfirmed? = false, onConfirmed? }. Also exports the named function getThumbnailStyle(thumbnailUrl), used by this component and independently by app/submit/page.jsx's step-1 preview thumbnail. As of Session 40 (bug fix), no longer owns local `status` state at all — `isPending` is computed directly as `Boolean(id) && status === "pending" && !locallyConfirmed`, and `onConfirmed` is passed straight to ConfirmButton unmodified rather than flipping an internal useState. This replaced a real bug: the old local-state version reseeded itself from the (unchanged) `status` prop every time this exact component instance was unmounted and remounted, which happened routinely whenever the arc page's own content-tab filter (ArcContent.jsx) hid and re-showed this item — so a genuinely-confirmed-by-this-browser item's pending badge/button could silently reappear just from switching tabs and back. `locallyConfirmed` is now owned by ArcContent (see its own entry) specifically because that component is the one thing in this chain that survives every tab switch. When `id` is set and `isPending` is true, a "⏳ Pending review" badge renders in the Yours-badge slot instead of YoursBadge (no auth check — any viewer sees it), and a `.card-actions` row appears under the tags with a ConfirmButton (pending items only) and a FlagButton (any item with an `id`, passed `onFlagged` straight through unmodified — BeatSection is what actually owns that state). Compact mode and the submit wizard's live preview never pass an `id`, so none of this UI renders there — same "omit rather than fabricate" convention as YoursBadge.
  ContentCard.module.css          Colocated styles for ContentCard's compact mode only (the default/tall mode uses globals.css's shared .card/.thumb/.cbody/.tag-* classes, plus .pending-badge/.card-actions/.confirm-btn/.flag-btn). Includes .compactYours for the compact mode's own "Yours" badge position (top-left of the 80×52px thumbnail). As of Session 30: `.compactTitle`/`.compactMeta` also have `overflow-wrap: break-word`, same reasoning as globals.css's `.ctitle`/`.ccreator`.
  ContentTabs.jsx                 Sticky tab bar (All / Edits & Video / Fan Art / Discussion / OST & Music on the arc page). Props: { tabs: [{ label, count, active? }], onSelect? }. As of Session 28, each tab is a real `<button>` (was a plain unclickable `<div>`) that calls `onSelect(tab.label)` on click — purely presentational otherwise; `ArcContent.jsx` (below) owns which tab is actually active and passes it back in via `tabs[].active`.
  FlagButton.jsx                  Client component nested inside ContentCard's default (tall) render path, shown on any real item (`id` present, any status). Props: `{ id, onFlagged? }`. POSTs `{ id }` to /api/flag on click, same `idle | loading | done | error` local-state pattern as ConfirmButton. On success, calls `onFlagged?.(id)` — threaded from BeatSection through ContentCard unmodified — which is what actually removes the card from the page (BeatSection unmounts it before this component's own "🚩 Flagged" done-state render would ever paint; that branch, like ConfirmButton's, is a defensive fallback only). On error, renders a distinct "⚠" glyph with its own `title`/`aria-label` (fixed in Session 19 — previously fell through to the same plain 🚩 icon as idle, making a real failure indistinguishable from nothing happening).
  HeroSearch.jsx                  Client component — home page's hero search input + "Try:" quick-search chips. No props; owns its own input state. Enter or a chip click navigates to /search?q=....
  IntensityChart.jsx              Ten-beat bar chart ("community response by story beat"). Props: { beats: [{ label, heightPct, tier: "normal"|"high"|"peak" }] }. Peak-tier bars get a small accent dot above them.
  NavAuth.jsx                     Client component — the signed-in/signed-out slice of a page's nav-right. Reads the session via lib/auth's getSession() on mount and subscribes to supabase.auth.onAuthStateChange to stay live; renders nothing until the initial check resolves (no flash of the wrong state). Props: { signInClassName? } (defaults to "btn btn-ghost"; the arc page passes "btn btn-primary"). Signed out: a next/link to /auth reading "Sign in". Signed in: the real email (.nav-auth-email, ellipsis-truncated past 180px) + a "Sign out" button that calls signOut(). Used by app/page.jsx, app/arc/[slug]/page.jsx, and SearchNav.jsx. NOT used by app/submit/page.jsx's nav, which has never had a Sign in button.
  SearchNav.jsx                   Client component — the search and series pages' shared nav (logo, search input, icon, clear button, NavAuth, "Submit content" link). Props: { query: string }. Seeded from `query`, remounted via `key={query}` on the search page so client-side re-searches re-sync the input. (Session 35) The "Submit content" link is now split into a `.nav-submit-icon` (+) span and a `.nav-submit-text` span, with `aria-label="Submit content"` on the link itself — CSS collapses it to icon-only below 640px to fix mobile overflow on this shared nav.
  Sparkline.jsx                   Small bar-chart sparkline. Props: { bars: [{ heightPct, tier }], width = "34px", height = "20px", gap = "1.5px" }. Used at 34×20px/5-bar on the search page's arc list and 100%×36px/9-bar on the home page's trending arc cards.
  Sparkline.module.css            Colocated styles for Sparkline's bars.
  YoursBadge.jsx                  Client component nested inside ContentCard. Props: { submittedBy, className }. Calls getSession() once on mount; renders a "✦ Yours" <span> only if session.user.id === submittedBy, else renders null — including for the entire window before the check resolves, so it can never flash an incorrect badge. ContentCard only renders this when the item isn't pending — a pending item shows the pending badge in this same slot instead, regardless of who submitted it. (Its own comment still frames ContentCard/the arc page as "server components" for why this is a separately-nested client piece — accurate for the arc page, now slightly dated for ContentCard itself now that it's a client component too, though the actual behavior described is unaffected either way.)
next.config.mjs                   images.remotePatterns allowlists i.ytimg.com and s4.anilist.co for next/image — configured but next/image isn't used anywhere in the codebase yet (see "Known issues"); every image renders via plain CSS background/backgroundImage or a raw <img> tag instead.
jsconfig.json                     Configures the "@/*" import alias (maps to the repo root) used throughout app/components/lib.
package.json                      Dependencies: next (14.2.35), react (^18.3.1), react-dom (^18.3.1), @supabase/supabase-js (^2.110.5). Scripts: dev/build/start/lint (all standard `next` CLI passthroughs). Confirmed no stray dependencies from either session's temporary Playwright install.
.gitignore                        node_modules, .next, out, .env*.local, npm-debug.log*, .DS_Store.
```

**No files exist outside this list** beyond the two lockfiles
(`package-lock.json`, tracked) and this `PROJECT.md` itself — no README,
no test directory, no CI config, no `.env.example`. `.env.local` (real
Supabase URL + anon key) exists locally in any environment that's actually
been configured against the live project, but is gitignored and was never
committed. **Zero `console.log`/`TODO`/`FIXME` sweep, run fresh this
session**: every remaining `console.*` call in the codebase is intentional
operational logging with a clear comment explaining why it's permanent —
one module-load log in `lib/supabase.js` (URL/key presence, never the key
itself), and per-failure `console.error`s in `lib/auth.js`'s `getSession`,
`lib/supabase.js`'s `getArcsBySeries`/`getTrendingArcs`/
`confirmContentItem`/`flagContentItem`, both API routes' catch blocks
(`/api/confirm`, `/api/flag`), and `NavAuth`'s sign-out failure handler —
no leftover temporary debug logging exists anywhere. **Zero `TODO`
comments remain**, as of Session 42 — the one that used to sit in
`app/search/page.jsx` (the hardcoded-arc-list note) was resolved along
with the code it was describing, not just deleted; worth knowing if a
future session runs the same sweep and expects the "one `TODO`" count
this section stated through Session 38's own audit.

### Design tokens (globals.css `:root`)

`--bg` `#0C0C12`, `--surface` `#14141C`, `--surface-2` `#1C1C26`,
`--surface-3` `#232330`, `--border` `rgba(255,255,255,0.07)`,
`--border-mid` `rgba(255,255,255,0.12)`, `--accent` `#7B6CF6`,
`--accent-soft` `rgba(123,108,246,0.14)`, `--red` `#F0706A`, `--amber`
`#F0A96A`, `--green` `#6AF0A8`, `--green-soft` `rgba(106,240,168,0.14)`,
`--t1`/`--t2`/`--t3` (text, high→low emphasis)
`#EEEEF5`/`#8A8AA8`/`#50505E`, `--display` `'Syne', sans-serif`, `--body`
`'Inter', sans-serif`, `--r` `10px`, `--r-sm` `6px`. All 15 tokens
confirmed defined and in active use this session — no undefined
custom-property gaps remain (the `--green`/`--green-soft` gap that existed
from Session 13 through Session 17 was closed in Session 18).

### Supabase — full schema, RLS, and seed data

Four tables, created and seeded manually via the Supabase SQL editor (never
through a migration tool in this repo). Full current-state SQL, in the
order it was actually written across sessions:

```sql
-- Tables (Session 9)
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

-- RLS (Sessions 9-11, final state after two follow-up fixes)
alter table series enable row level security;
alter table arcs enable row level security;
alter table beats enable row level security;
alter table content_items enable row level security;

create policy "Public read access on series" on series for select using (true);
create policy "Public read access on arcs" on arcs for select using (true);
create policy "Public read access on beats" on beats for select using (true);
create policy "Public insert access on content_items" on content_items for insert with check (true);
create policy "Public read access on content_items" on content_items for select using (status in ('pending', 'confirmed'));

-- Session 14 — status: likely not yet run (no feature depends on it yet,
-- so there's no behavioral signal either way; see "Partially working").
-- Lets a signed-in user read their own submissions regardless of status,
-- on top of the public policy above — Postgres RLS ORs multiple
-- permissive policies for the same command together, so this is
-- additive, not a replacement. Deliberately scoped `to authenticated`
-- (not `PUBLIC`, unlike every policy above it): `auth.uid()` returns
-- `null` for an anonymous request, and `submitted_by = null::text` is
-- never true, so scoping this specific policy is what makes "only the
-- actual owner" mean anything.
create policy "Users can read their own submissions"
  on content_items for select
  to authenticated
  using (submitted_by = auth.uid()::text);

-- Session 18 — status: strong behavioral evidence this IS applied live.
-- Real production bug reports across Sessions 19 and 21 showed both
-- confirm and flag writes genuinely persisting to content_items (visible
-- on refresh), which is only possible if this grant + policy are live —
-- this repo/sandbox still can't run the diagnostic query below directly
-- to confirm it, but the behavioral evidence is about as strong as this
-- project's "verify without live access" convention gets. Lets
-- app/api/confirm and app/api/flag's real writes succeed for anon/public.
-- RLS policies can't restrict *which columns* a statement touches, only
-- *which rows* — the actual column restriction comes from the GRANT,
-- which limits anon/authenticated to setting only confirmation_count and
-- status, nothing else on the row. The `using (true)` on the policy below
-- is intentional, not a careless widening — the task this policy exists
-- for explicitly requires no auth for both confirming and flagging.
grant update (confirmation_count, status) on content_items to anon, authenticated;

create policy "Public can confirm or flag content_items"
  on content_items for update
  using (true)
  with check (true);
```

**A Session 19 `alter policy "Public read access on content_items" ...
using (status in ('pending', 'confirmed', 'flagged'))` was written, then
retracted in Session 20** — not part of this file's current "SQL to run"
set, worth knowing only if it shows up in Supabase's own migration/query
history. It would have widened the read policy so `flagContentItem`'s
(then-current) `UPDATE ... RETURNING` could see a flagged row; Session 20
removed the dependency on this widening entirely instead of keeping the
SQL, since permanently widening the public read policy is a bigger,
longer-lived change than that one bug fix needed, and it would work
*against* a legitimate future need (a moderation view that specifically
wants to query flagged rows — see "Phase 7 roadmap"). If it was already
run against the live project, it's harmless to leave in place.

**No new RLS is needed for `getTrendingArcs` (added Session 37)** — it
only ever performs `SELECT`s (on `content_items`, embedding `arcs` and
`series`), all already covered by the existing public read policies
above; it never touches `beats`' or any table's write path.

**No `UPDATE`/`DELETE` policy existed on any table before Session 18** —
blocked for the anon/public role everywhere by omission (Postgres RLS: no
matching policy = denied). None of the original policies are scoped `to
anon` specifically — they're `PUBLIC`, a deliberate choice made after
Session 10's investigation into whether the newer `sb_publishable_...`
key format maps to the `anon` role the way a legacy anon JWT does.
Session 18's `UPDATE` policy is the first genuinely `PUBLIC` write path
this project has added, and is intentional for the same "no auth"
reason as above — the actual safety net is the column-level `grant`, not
the policy: even with `using (true)`, Postgres rejects any `UPDATE`
naming a column outside `(confirmation_count, status)` before RLS is even
evaluated.

**Diagnostic — run this in the Supabase SQL editor to directly confirm
whether the Session 18 grant + policy have taken effect**, since neither
this sandbox nor any session working from it can query the live project:

```sql
select grantee, privilege_type, column_name
from information_schema.column_privileges
where table_name = 'content_items'
  and column_name in ('confirmation_count', 'status');

select policyname, cmd, roles, qual, with_check
from pg_policies
where tablename = 'content_items';
```

The first query should return rows granting `UPDATE` on
`confirmation_count` and `status` to `anon` (and `authenticated`); the
second should include `"Public can confirm or flag content_items"` (`cmd
= UPDATE`, `qual = true`). Given both confirm and flag are reported
working in production as of Session 21, this SQL is presumed applied —
but nobody has actually run this query and reported the result back, so
it remains formally unconfirmed by this file's own standard.

**`content_items.status` values in use**: `'pending'` (the insert
default), `'confirmed'` (reached when `confirmation_count` hits 2 via
`/api/confirm`), and `'flagged'` (set unconditionally, no threshold, via
`/api/flag`). `'pending'`/`'confirmed'` are covered by every read-side
allowlist above; `'flagged'` is deliberately excluded from all of them —
`getArcContent`'s own `.in('status', ['confirmed', 'pending'])` filter
(`lib/supabase.js`) is what keeps a flagged row off the arc page, and RLS's
own read policy allowlist independently makes a flagged row unselectable
at all (which `flagContentItem` no longer depends on or reads back from,
per the Session 21 fix above). There's no `'rejected'`/other status value
and no way to un-flag an item.

**Seed data** — as of Session 23 (one field pending correction, see below):
- `series`: 3 rows — Jujutsu Kaisen (`anilist_id: 113415`, `slug: 'jujutsu-kaisen'`), Attack on Titan (`anilist_id: 16498`, added Session 23), Chainsaw Man (`anilist_id: 127230`, corrected Session 27 — was seeded as `146065` in Session 23, an unrelated show; see Session 26/27's log entries for the full story).
- `arcs`: 5 rows — Shibuya Incident Arc (`slug: 'shibuya-incident-arc'`, JJK, `episode_start: 38`, `episode_end: 47`, `order_index: 6`, the original Session 9 seed); Vs. Mahito Arc (`slug: 'vs-mahito-arc'`, JJK, episodes 14–20, Session 23); Control Devil Arc (`slug: 'control-devil-arc'`, Chainsaw Man, episodes 10–12, Session 23); The Rumbling Arc (`slug: 'the-rumbling-arc'`, Attack on Titan, episodes 88–96, Session 23); Marley Arc (`slug: 'marley-arc'`, Attack on Titan, episodes 64–75, Session 23).
- `beats`: 10 rows for the Shibuya arc, `order_index` 1–10: Curtain falls (28), Shibuya station (35), Gojo arrives (54), Domain battle (63), **The Sealing (87, is_peak)**, Nanami (70), **Yuji breaks (100, is_peak)**, Nobara (77), Aftermath (42), Fallout (30). Beats also now exist for the four Session 23 arcs — reported verified with correct per-arc counts, but their individual titles/order/intensity values were never reported back to this file; check Supabase's Table Editor directly.
- `content_items`: through Session 38, real rows existed only against the Shibuya arc, since `/submit`'s hardcoded `ARC_SLUG` meant the app itself had never written a `content_items` row for any of the four Session 23 arcs. **As of Session 39, `/submit` can insert against any seeded arc** (see below) — this file's own seed-data snapshot hasn't been re-checked against live Supabase since that change shipped, so whether any of the four Session 23 arcs actually have real rows yet depends on what's been submitted through the app since. Check `select count(*), arc_id from content_items group by arc_id;` for the current real distribution. `status` values among real rows include `'pending'`, `'confirmed'`, and `'flagged'`.

**Five arcs across three series now have real beats seeded** (up from
one arc/one series through Session 22). As of Session 24, the arc page's
header and AniList series lookup are also real per-slug — see below.
**As of Session 39 (Phase 7), `/submit` is no longer locked to one
hardcoded arc** — a submission can target any seeded series/arc via the
new manual picker (see below and "What's real vs. hardcoded, per page").
`ARC_NAV` (the arc page's own chip strip) is still fully hardcoded
(Session 18 work, per the Session 24 task scope) — see "Known issues"
below; that's a separate component from `/submit`'s own arc picker and
wasn't touched by Session 39.

### What's real vs. hardcoded, per page

- **`/` (home)** — 100% hardcoded (`NAV_LINKS`, `HERO_STATS`, `TRENDING_ARCS`, `POPULAR_SERIES`, `TRENDING_MOMENTS`, `FEATURES`). `HeroSearch` navigation (Enter / chip click → `/search?q=...`) is real and works. `TRENDING_ARCS`' Attack on Titan card slug was fixed in Session 24 (`"rumbling-arc"` → `"the-rumbling-arc"`, matching the seeded slug) — its link, and `shibuya-incident-arc`'s, now both land on real arc-page data. The other four `TRENDING_ARCS` cards (`bomb-girl-arc`/Chainsaw Man, `swordsmith-village-arc`/Demon Slayer, `onigashima-raid`/One Piece, `chimera-ant-arc`/Hunter × Hunter) still point at unseeded slugs — none matches `control-devil-arc`, `vs-mahito-arc`, or `marley-arc`. (Separately, the arc page's own `ARC_NAV` chip strip already happened to hardcode a `"vs-mahito-arc"` slug before Session 23 — that one also lands on real data; see the arc page bullet below.)
- **`/arc/[slug]`** — As of Session 24, real for any of the 5 seeded arc slugs (`shibuya-incident-arc`, `vs-mahito-arc`, `control-devil-arc`, `the-rumbling-arc`, `marley-arc`): the page header's name and episode range (via a new `getArcMeta(params.slug)` lookup against the `arcs` table) and the AniList series description/characters (via that row's own real `anilist_series_id`, not a hardcoded constant) are correct per slug — `/arc/control-devil-arc` shows Chainsaw Man's real AniList data as of Session 27 (its `anilist_series_id` was wrong, `146065`, through Session 26; corrected to `127230` and confirmed live), `/arc/the-rumbling-arc` and `/arc/marley-arc` show Attack on Titan's, each under its own real Supabase beats/content — confirmed live as of Session 27 for `control-devil-arc` specifically (previously an open bug, see the Session 25/26/27 log entries). As of Session 25, `ArcNav` (the chip strip) is also real: it shows every other seeded arc for the current arc's own series (via `getArcsBySeries`), each chip a working link to `/arc/[slug]`, falling back to the hardcoded `ARC_NAV` placeholder strip only when the series has no other seeded arcs. `ARC`'s remaining fields (badges, seasonPart, dateRange) were hardcoded regardless of slug through Session 43; **as of Session 44, all three are omitted for any real seeded arc** rather than shown wrong (no real per-arc data source exists for any of them — see the file inventory entry above for why "derive" wasn't possible here) — still hardcoded, unchanged, on the fallback path for an unseeded slug. As of Session 37, the hero stats bar's "Fan items" number is real (a genuine `content_items` count for the current arc), not a hardcoded mockup figure; Saves/This week/Contributors show a dash, not a fake number, since nothing tracks them yet. `TABS`' own label/count text is still hardcoded, but as of Session 28 the tabs are real and functional: clicking one client-side filters the beat sections below to matching `content_type`s (via `ArcContent.jsx`), updates each visible beat's item count, and hides any beat section with zero matches for the active tab — real for both Supabase-backed and hardcoded-fallback content alike, since it operates on whatever `beatSections` the page already computed either way. Any slug outside the 5 seeded ones falls back entirely to the original hardcoded `ARC`/`INTENSITY_BEATS`/`BEATS`/`ARC_NAV`/`FALLBACK_ANILIST_SERIES_ID` (113415, JJK) mockup data — the page never breaks, it just isn't real for that slug. Real content cards additionally show: a "✦ Yours" badge (own submissions, signed in), a "⏳ Pending review" badge + "Confirm placement" button (pending items, no auth needed), and a flag button (any real item) — confirming and flagging both write genuinely to Supabase and update the page instantly, client-side, no reload.
- **`/search`** — Real: the series panel (title, format, genres, score, popularity, episodes, poster), driven by `?q=`. As of Session 42, the arc list is also real when the matched series has seeded arcs (real slug/title/order + a real per-arc beat-intensity sparkline, falling back to a flat sparkline only for an individual beat-less arc), each row linking to `/arc/[slug]`; shows "No arcs indexed yet for this series." instead of a fake list when nothing's seeded for that series. As of Session 44, the Characters column is also real — real AniList characters (portrait or colored-initials fallback) for the matched series, via `getSeriesCharacters`; shows "No characters listed for this series." when AniList has none. Hardcoded regardless of query: `TOP_CONTENT`, `FILTERS`, `ALSO_FOUND`, `RESULTS_SUMMARY`.
- **`/series/[slug]`** — Real: everything about the series itself (title, description, genres, score, format/year/episodes/status, banner/poster) and the top-10 character cast, both keyed directly by the numeric AniList id in the URL — the only page where the URL's dynamic segment drives every real value shown. As of Session 25, the arc list is also real when the series has any seeded arcs (via `getArcsBySeries(anilistId)`) — real slug/name/order per row, each linking to `/arc/[slug]`; no real fan-item-count or intensity-sparkline data exists yet, so those are simply omitted from real rows rather than fabricated. Falls back to the hardcoded `ARCS` placeholder list (same one the search page uses, originally authored for Chainsaw Man) for any series with nothing seeded.
- **`/submit`** — Real: step 1's link detection (`/api/og-fetch` — title/thumbnail/platform/creator, debounced 500ms); as of Session 39, step 2's series/arc placement is also real and manual — a debounced series search (searchSeries) rendered as selectable chips, then that series' real arcs (getAllArcsForSeries) as a selectable list, then that arc's real beat-selector chart (getArcBeats, unchanged chart itself, now keyed to whichever arc was picked); and the final submission (a real `content_items` insert against the actually-selected arc_id/beat_id, with a real `submitted_by` — the signed-in user's id, or `"anonymous"` when signed out). No longer structurally locked to one hardcoded arc — any seeded series/arc can receive a real submission through the app itself now. As of Session 40, character tags are also real free-text — no more hardcoded "Gojo Satoru" chip; the user types names and Enter/comma commits each as a removable chip, and those are exactly what's saved to `character_tags`. Step 3's success screen now also links directly to the arc page the submission just landed on. Hardcoded: `CONTENT_TYPE_OPTIONS` (just labels). There's still no manual title/creator correction UI (unchanged, see "Explicitly not built").
- **`/auth`** — Real end to end, single-step: email input → `signInWithOtp` → success screen ("Check your email — we sent you a sign in link"), a same-device note, and a "← Back to home" link. Loading/error states are real, not simulated.
- **`/auth/callback`** — Real and load-bearing: exchanges the URL's `code` for a session (or falls back to checking for an already-parsed hash-based session), redirects to `/` or shows an error. Every real magic-link click passes through this page.
- **Nav (all pages except `/submit`)** — Real: `NavAuth` reads the actual Supabase session client-side and shows "Sign in" (linking to `/auth`) when signed out, or the real signed-in email + a working "Sign out" button when signed in. `/submit`'s nav has never had a Sign in button.

### Fully working end-to-end

Verified this session (re-confirmed by direct code reading) or in prior
sessions (verified by mock/browser-driven testing, as noted):

1. Home → arc card / quick-search chip / hero search → correct navigation.
2. `/search?q=<title>` → real AniList series panel for any real anime title; as of Session 42, a matched series with real seeded arcs also shows a real arc list (real sparklines, each row linking to `/arc/[slug]`), and a matched series with nothing seeded shows an honest "No arcs indexed yet for this series." message instead of a fake list. Verified this session via a local mock PostgREST server (this sandbox's standing convention for Supabase calls that run server-side during SSR, which browser-only route interception can't reach) plus a real AniList search (this environment can reach AniList directly, per Session 26's finding): a real seeded arc with real beats rendered its real intensity sparkline, a real seeded arc with zero beats rendered the flat fallback sparkline instead, and a real AniList match with nothing in the mock `series` table rendered the empty-state message — all three states screenshot-confirmed, plus a real click-through from an arc row to its `/arc/[slug]` page.
3. `/series/<anilist-id>` → real series detail + real top-10 cast for any real AniList id; "Browse arcs" from a search result correctly threads the real id through.
4. Any of the 5 seeded `/arc/<slug>`s (`shibuya-incident-arc`, `vs-mahito-arc`, `control-devil-arc`, `the-rumbling-arc`, `marley-arc`) → since Session 24, a correct real page header (name, episode range) and correct real AniList series description/characters for that specific arc's series, plus real Supabase beats/intensity chart/content cards, with real submitted items appearing under their correct beat. Verified by direct code reading this session (`getArcMeta` → `anilist_series_id` → `getSeriesById`/`getSeriesCharacters`), not yet click-tested against the live Supabase project from this sandbox (see "Known issues" for this project's standing verification caveat).
5. Any `/arc/<slug>` outside the 5 seeded arcs → clean fallback to the original hardcoded Shibuya mockup, no crash, no partial/mixed state.
6. `/submit` full wizard: paste a URL → real title/thumbnail/platform/creator auto-detected → search and pick a real series (Session 39) → pick one of that series' real arcs (Session 39) → pick a real story beat for that arc → review (real `ContentCard` preview) → submit → real row lands in `content_items` against the actually-selected arc/beat → visible on the arc page under the correct beat on the next load. Verified this session by direct code reading plus Playwright browser-driven testing against a mocked Supabase REST endpoint (real Supabase credentials aren't available to this sandbox — same standing limitation as every other Supabase-touching session) — series search returning matching chips, picking one loading that series' real arcs, picking an arc loading its real beats and defaulting to index 0, Continue disabling until series+arc+beat are all chosen, and the review step's summary line and final insert payload all reflecting the actual selection, not a hardcoded one.
7. Every page's nav "Sign in" link genuinely navigates to `/auth`; with a real or injected session, the nav correctly shows the signed-in email + a working "Sign out" button, persisted across a full page reload.
8. `/submit`'s real `submitted_by` (signed-in user id, or `"anonymous"` signed out) and the arc page's "✦ Yours" badge, both verified against injected/mocked sessions in prior sessions.
9. `/auth`'s single-step magic-link flow: submitting an email produces the exact success message, no code input anywhere, a working "← Back to home" link; the real `signInWithOtp` request body confirmed correct (verified against mocked Supabase responses in Session 16 — see "Partially working" for what's still never been tried against a real inbox).
10. **The full Phase 5 quality-control loop, confirmed working in production as of Session 21**: a pending item shows a "⏳ Pending review" badge and a "Confirm placement" button (no auth needed); clicking it writes a real confirmation to Supabase (verified: confirming twice flips a real row to `'confirmed'`) and, as of Session 20, the badge and button disappear from the page instantly, with no reload — optimistically, ahead of the real two-confirmation threshold being met (see "Partially working" for the precise, intentional gap this creates). Any real card's flag button writes a real flag to Supabase and, as of Session 20, removes the card from the page instantly, with no reload; getArcContent's status allowlist independently keeps a flagged row from ever appearing again on a future load. Both routes' error paths are real and visibly distinct from success in the UI (Session 19's fix to `FlagButton`'s error state). This was reached only after three rounds of real production bug reports and fixes (Sessions 19–21) — see the session log for the full diagnostic history of each.
11. Extensive mock-PostgREST-server and browser-driven (Playwright) verification across Sessions 18–21 of the above — not repeated in detail here since it's thoroughly documented in each session's own log entry and this section would otherwise just duplicate it; see Sessions 18, 19, 20, and 21 below for exactly what was tested and how.
12. **Mobile layout at 390px (iPhone-class) width, confirmed zero-overflow on all 6 pages** (`/`, `/arc/[slug]`, `/search`, `/series/[slug]`, `/submit`, `/auth`) as of Session 29 — verified via direct Playwright measurement (`document.documentElement.scrollWidth` equals viewport width on every page, not just visual inspection), plus the search page's two-column stack and the series page's hero re-stack confirmed via screenshot. See Session 29's own log entry for the full list of what was actually broken versus already fine, and "Known issues" for what this pass didn't cover (tablet-range widths beyond the 768px/480px breakpoints themselves, landscape orientation, real device testing).

### Partially working / needs attention

- **Submitted content only shows up if the read-side RLS SQL has actually been run** — historically the source of multiple "it's not working" reports (missing `SELECT` on `content_items`, missing policies entirely); check `pg_policies` before assuming a code bug.
- **`/submit`'s auto-detection can fail or be slow**, and the wizard lets the user proceed anyway with honest placeholders (`"Untitled link"`, a generic gradient, `platform: "other"`, `"Unknown creator"`) — but there's no way to *manually* correct a wrong or missing title/creator/thumbnail.
- **YouTube's oEmbed integration depends on YouTube's public endpoint staying free/unauthenticated** — an external dependency this project doesn't control.
- ~~`character_tags`/character detection on `/submit` never reflects the real pasted content — always the one hardcoded Gojo Satoru chip~~ — **fixed, Session 40**. There was never real *detection* to begin with (no session has attempted parsing character names out of a pasted link/caption) and still isn't — but the field is no longer hardcoded, either: it's real free-text now, the user types whatever names actually apply and those are exactly what get saved.
- **Auth has never completed a real magic-link round trip from this sandbox.** Every piece was verified individually against mocked Supabase responses — the real `signInWithOtp` call, the error/retry path, the signed-in nav state (verified with an injected fake session) — but no session has clicked a real emailed magic link end to end, since this sandbox can't reach `*.supabase.co` or send/receive real email. Whoever picks this up next, outside this sandbox: submit a real email on `/auth`, click the link, confirm it lands on `/auth/callback` and then `/` with the nav showing the signed-in state. This is also the one remaining gap for confirming a genuine (not mocked/injected) `auth.uid()`-shaped UUID landing in `content_items.submitted_by`.
- **A 6-digit-code sign-in email was tried (Session 15) and reverted (Session 16)** — needs a Supabase-project setting (a paid-plan-only email-template editor, or custom SMTP) this app's code has no control over. Revisit only if the project moves off the free plan.
- **Session 14's `"Users can read their own submissions"` RLS policy is presumed not yet run** — no feature has ever depended on it (there's no "my submissions" view yet — see "Phase 7 roadmap"), so there's no behavioral signal either way, unlike the Session 18 grant/policy. Harmless either way today, since every row is currently `'pending'`/`'confirmed'`/`'flagged'` and none of those states need this policy to be visible.
- **Nothing beyond `/submit` and the arc page's cards reads/uses the signed-in identity.** No "my submissions" list, no way to edit or delete your own submission, no moderation view of any kind.
- **The Session 18 grant + update policy SQL is presumed (not formally confirmed) applied to the live Supabase project** — see the Database schema section above for the behavioral evidence and the diagnostic query nobody has run and reported back yet. If `/api/confirm`/`/api/flag` ever appear broken again, check Vercel's function logs for `[confirmContentItem]`/`[flagContentItem]`/`[api/confirm]`/`[api/flag]` lines before assuming a new code bug — this exact SQL is the first thing to rule out.
- **Confirming isn't atomic and has no per-visitor ledger.** `confirmContentItem` does a plain select-then-update, not a single atomic statement — a real (if narrow) race exists if two confirms land on the exact same row at the same instant. More importantly, nothing stops the same browser confirming the same item twice and single-handedly promoting it to `confirmed` — there's no auth requirement (by design) and no ledger tracking who confirmed what.
- **The optimistic confirm UI can show a card as "not pending" to the browser that just clicked it, while it's genuinely still `'pending'` in the database** for everyone else, until a second, distinct confirmation lands. Intentional and narrow (doesn't affect what's stored or shown to anyone else), but means "the badge is gone" is not a reliable signal of the row's true server-side status for the person who just clicked. **This is a real, intended trade-off, distinct from a Session 40 bug fix** (see that session's log entry): a *separate* issue used to make even the same-browser-same-session case unreliable — switching the arc page's own content tabs away from and back to a confirmed item's tab used to revert its badge/button to "pending" client-side (a stale-remount bug in `ContentCard`'s own local state, not a server round trip), which could look identical to "my confirmation didn't save" even though the write had genuinely succeeded. That specific bug is fixed; this bullet's own two-distinct-confirmations trade-off is not a bug and remains unchanged.
- **Flagging is one-way with no moderation surface.** `/api/flag` always sets `status: 'flagged'` unconditionally, with no threshold, no auth, and no record of who flagged an item or why. Once flagged, an item is gone from the arc page for good — no admin/mod view listing flagged items, no way to review or reverse a flag, and nothing stops one visitor flagging any item they don't like off the page entirely.
- **`flagContentItem` no longer independently verifies that its write actually took effect** — it trusts `update()`'s own `{ error }` result alone (Session 21). This is a deliberate, accepted trade-off: if a future RLS misconfiguration silently blocks the flag `UPDATE` (the exact Session 19 failure mode), this function will report success anyway, and the client will optimistically remove a card that was never actually flagged. Traded deliberately for fixing a confirmed, reproducible bug (a genuine `42501` error on the old verification step) in exchange for reintroducing a narrower, currently-hypothetical one.
- **Whether a Postgres RLS-blocked write/read fails silently or with a real permission error is genuinely inconsistent across the different queries this project has tried** — Session 19 found a blocked `UPDATE` fails silently (zero rows, no error); Session 21 found a `SELECT` against a row outside a read policy's allowlist raises a real `42501` error. Building detection logic around the first finding is exactly what caused the second bug. Any future write added to this codebase should not assume either failure mode without hitting it in production and checking.

### Known issues / cleanup needed

- **Mobile responsiveness took eight sessions (29–36) before every real cause was found and fixed — including one case (Session 36) where an earlier session's own stated cause turned out to be wrong.** Every fix across all eight was verified via Playwright/Chromium viewport emulation (`scrollWidth`/`clientWidth` measurement, element bounding-rect checks, and — after Session 30's own regression — before/after-scroll sticky-position checks), never a real phone. Sessions 29–32 each found something the previous one's emulation-based verification missed; Session 33 came up empty on new findings; Session 34 found and fixed the arc page's signed-in-nav overflow; Session 35 found the same class of bug in the separate `SearchNav.jsx` component at narrower widths Session 34 didn't sweep; **Session 36 found that Session 35's own guess at the home page's remaining 8px overflow was incorrect, and traced it to a completely unrelated grid** — see each session's own bullet below.
  - Session 29 added `@media (max-width: ...)` rules that tested clean under emulation but (per Session 30's finding) likely never matched on a real device at all, because the root layout had no viewport meta tag — without it, a real mobile browser assumes an ~980px desktop-sized layout viewport and zooms the page to fit, while emulation sets the rendering viewport directly and never depended on that tag being present.
  - Session 30 added the viewport meta tag, plus `overflow-wrap` on real-content text fields (a long unbroken creator handle can visually spill past its box, a failure mode this app's own short mock test strings never trigger) — and its own first two attempts at an `overflow-x: hidden` fix each broke `nav`'s `position: sticky`, an interaction bug a simple `scrollWidth` check can't reveal at all, only caught by directly measuring nav's position across a scroll before pushing.
  - Session 31, reported still broken after all of that: fixed two missing `min-width: 0`/`width: 100%` flexbox gaps on the search page (content clipped by an already-existing `overflow: hidden` rather than reflowing), and — the more structural fix — replaced the arc page's content-tabs horizontal-scroll with `flex-wrap: wrap`, removing a nested-scrollable-region-inside-a-`position:sticky`-element pattern entirely rather than continuing to harden it, since a real touch device's gesture handling for exactly that pattern is something this sandbox has no way to test directly and is the most likely explanation for "the page sliding sideways" that a pure CSS-overflow check would never surface. Also added `overscroll-behavior-x: contain` to both horizontal-scroll rows (`.arc-strip-wrap`, `.tabs-wrap`) — the CSS property specifically designed to stop a nested scrollable region's touch/scroll gesture from chaining out to the whole page.
  - Session 32, reported broken a fourth time: a requested "reset" pass — `max-width: 100%` on the universal selector, `max-width: 100vw` on `html`/`body`. One part of the request was deliberately not implemented as specified: `overflow-x: hidden` on `html` was **not** added despite being explicitly asked for, because Session 30 had already proven (not guessed) that combining it with `body`'s own `overflow-x: hidden` breaks `nav`'s sticky positioning — re-litigated and re-confirmed this session via the same isolated-test-page technique rather than just citing the old finding. Also confirmed the universal `max-width: 100%` doesn't neuter `.arc-strip`'s intentional wider-than-container scroll strip — its flex children's own default refusal to shrink below their natural content size (unrelated `min-width: auto` flexbox behavior) keeps `scrollWidth` reporting the full content extent regardless of the parent's own capped `width`.
  
  - Session 33, reported broken a fifth time, now specifically described as "background bleeding," with an explicit instruction to compare the home page's wrapper structure against arc/search's to find a wrapper div with an explicit width. Did that comparison thoroughly — re-read every page's full JSX return, grepped every `background:` declaration in `globals.css`, checked every relevant component for inline `style={{width...}}` — and **found no wrapper-div width bug**. Every page (home included) uses the identical structure: a bare `<>` Fragment with `<nav>` followed by flat sibling sections, no extra wrapping div anywhere, no explicit `width`/`min-width` on any container beyond what Sessions 29–32 already addressed. The one real, if minor, gap found: `.tabs-wrap`'s `overflow-x: hidden` (Session 31) was only inside the `max-width: 768px` media query, not unconditional — made it unconditional (harmless on desktop, closes a gap for viewports just over that boundary). Re-confirmed via direct measurement that this didn't affect `.tabs-wrap`'s own `position: sticky` (a scroll-distance-corrected test: `.tabs-wrap.top === 56` once scrolled far enough to actually engage it — an initial 500px-scroll check falsely read "not pinned" because 500px wasn't enough scroll distance to reach this element's sticky engagement point at all, a test methodology gap, not a regression). This was reported as an honest non-finding, not dressed up as a fix — see this session's own log entry for the full reasoning on why a stale/cached deployment is now the more likely remaining explanation than an undiscovered CSS rule.

  - **Session 34 found the actual root cause: `NavAuth.jsx`'s signed-in state was never once exercised by any of the previous five sessions' testing.** The user pinpointed it directly — a real signed-in user's nav renders the email address (`.nav-auth-email`) plus a "Sign out" button alongside the existing logo/search-bar/other nav-right content, and `nav` has no `flex-wrap` while every `.nav-right` child keeps its default `flex-shrink: 0`. This sandbox has no live Supabase credentials (`lib/supabase.js` always falls back to the `placeholder.supabase.co` URL), so `getSession()` always resolves to `null` and every single prior Playwright/DevTools test run — Sessions 29 through 33, all of them — only ever rendered the signed-out "Sign in" link. Nobody was testing the actual state a real logged-in mobile user sees. Confirmed by temporarily hardcoding a fake session into `NavAuth.jsx` (reverted before commit, `git diff` confirmed byte-identical after) and measuring `document.documentElement.scrollWidth` at a 375px viewport: **signed in and un-fixed, the arc page overflowed to 552px, search to 518px, and even the home page — previously believed unaffected — overflowed to 428px**, all against a 375px viewport. This is the first session in the whole saga to reproduce the bug directly rather than inferring a cause from static-code review. Fix: added a `@media (max-width: 640px)` block hiding `.nav-auth-email` (Sign out button alone remains, per the task's own "Sign out or a small avatar" allowance) and a new `.nav-browse-btn` class on the arc page's decorative, non-functional "Browse" button (also hidden at this breakpoint; the home page's own Browse link was already hidden below 768px since Session 29, and the search page has no Browse button at all). Re-ran the same signed-in-session measurement after the fix: all three pages back to `scrollWidth === clientWidth === 375`. Also re-confirmed `nav`'s `position: sticky` is unaffected (`nav.top === 0` before and after a 2000px scroll, signed-in state).

  - **Session 35, reported still broken specifically on the search and series pages, correctly attributed to the "Submit content" button.** Confirmed `app/series/[slug]/page.jsx` renders `SearchNav.jsx` directly — the exact same component and file `app/search/page.jsx` uses — a separate nav implementation from the arc page's own inline `<nav>` fixed in Session 34. Swept a full width range (320–639px, signed in, same hardcoded-fake-session technique as Session 34) rather than checking one viewport: both pages were already clean at 375px thanks to Session 34's `.nav-auth-email` fix, but overflowed by 16px at 320px (the narrowest realistic phone width) — `.searchWrap`'s real `<input>`-backed search bar leaves less spare room than the arc page's static decorative one, so the same signed-in "Sign out + other nav-right content" pattern resurfaces at the low end of the range Session 34 didn't test. (Also found, out of this session's requested scope and left as-is: the home page shows a smaller, related-*looking* 8px overflow at 320px, guessed at the time to be its own separate "Submit content" button — **that guess turned out to be wrong, see Session 36's bullet below**.) Fix: rather than hiding "Submit content" outright, collapsed it to an icon-only `+` button below 640px (`.nav-submit-icon`/`.nav-submit-text` in `globals.css`, added to the existing Session 34 media query) — a deliberate difference from the arc page's Browse button, which was removed entirely because it's decorative; this is a real, functional CTA every visitor can use. Verified `scrollWidth === clientWidth` across nine widths (320 through 1024px) and confirmed the icon/text swap lands exactly at the 640px boundary; also re-confirmed `nav`'s `position: sticky` on the search page's own nav instance, not just the arc page's.

  - **Session 36, a direct follow-up asking to fix the home page's 8px overflow "caused by the Submit content button," using the same icon collapse.** Applied that fix first — `app/page.jsx`'s "Submit content" now uses the same `.nav-submit-icon`/`.nav-submit-text` split as `SearchNav.jsx` (the classes are global, not CSS-module-scoped, so no new CSS was needed for this part). **Then measured instead of assuming the requested fix had worked, and found it hadn't**: the 320px overflow was completely unchanged (`scrollWidth` still 328 vs `clientWidth` 320) even with the icon collapse correctly applied and confirmed. Session 35's own attribution of this 8px to "Submit content" — stated as a passing note, not something it had actually isolated — was wrong. Walked down from `document.body`'s direct children to find the real source: `nav` itself measured a clean 320×320, so the overflow was never in the nav at all; it traced three levels down to `.arcGrid` (the "Trending arcs" section), whose `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` forces a 300px-minimum column irrespective of available width — at 320px, `.container`'s padding leaves only 264px, so the grid overflowed its own parent by 36px. This was invisible on screen (clipped by an ancestor) but still counted toward the document's total `scrollWidth`, which is the only thing every prior session's `scrollWidth`-vs-`clientWidth` check was ever measuring — a real, previously undiscovered gap in a section none of Sessions 29–35 had reason to look at, since all of them were specifically chasing nav-related causes. Fixed with the same single-column-below-480px pattern already used for `.cards` and the content-card grid: `.arcGrid { grid-template-columns: 1fr; }` in `page.module.css`'s existing `@media (max-width: 480px)` block. Re-swept 320–1024px after both changes: clean at every width, icon/text swap still correct at 640px, sticky nav unaffected.

  No session has tested landscape orientation or phablets — those remain open. But the core "page slides sideways on mobile" report across Sessions 29–36 is now believed genuinely fixed on every page this app has, not just re-investigated: the earlier sessions' CSS hardening (viewport meta tag, `overflow-wrap`, flex `min-width: 0` fixes, the Session 32 universal `max-width: 100%` reset) were all real, necessary fixes for real gaps, Sessions 34–35 closed the two remaining signed-in-nav gaps across both of this app's separate nav implementations, and Session 36 closed an entirely unrelated grid-overflow gap that had been hiding underneath a wrong guess. If this is reported broken again, the priority is confirming which auth state, which exact page, and which exact width the tester is on, and getting a real-device screen recording — this sandbox still cannot test actual touch input or real Supabase auth end to end. Also worth remembering for future sessions specifically: a session's own stated cause for a measured number should be treated as a hypothesis, not a fact, until something has actually isolated it — Session 35 stated one as fact and Session 36 had to correct it.
- ~~The arc page's header still has hardcoded fields Session 24 deliberately left out of scope~~ — **fixed, Session 44**: `badges`/`seasonPart`/`dateRange` (and the breadcrumb's fake `"Season 2"` segment) are omitted entirely for any real seeded arc now, rather than always showing Shibuya's own values. (`stats` was fixed in Session 37 — see its own bullet below.)
- **Real arc chips/rows (`ArcNav`, `ArcList` on the series page) show no fan-item count or intensity sparkline** — Session 25 deliberately omitted these rather than fabricate them, since no per-arc content-count or beat-intensity rollup query exists yet. The hardcoded placeholder data these replace did have those numbers (fake), so real arc chips/rows look slightly sparser than the mockup ones next to them. (The home page's own trending-arc cards got real versions of both in Session 37 — see that session's bullet — but `ArcNav`/`ArcList` specifically are unchanged.)
- **Session 37's arc-page hero stats fix only made "Fan items" real; Saves/This week/Contributors are dashes, not real numbers, because nothing in this schema tracks any of them.** No "save" action exists anywhere in this app. "This week" would need a `created_at`-windowed count and "Contributors" a distinct-`submitted_by` count — both queryable in principle, but neither has a query, view, or RPC written for it yet. A dash was chosen deliberately over inventing a number, matching this project's established convention (see the arc-chip bullet above, and Session 25's identical choice there).
- **Session 37's home page "Trending arcs" is real but is "most recently active," not a genuine trending/ranking metric.** `getTrendingArcs` orders arcs by their most recent content_items row, pulled from a 500-row-max recent-content window — for this project's current real data volume that's effectively exhaustive, but it isn't a true 7-day-windowed activity score (the section's old subtitle, "Most active in the last 7 days," was changed to "Most recently added content" for this reason, rather than leaving copy that implies a metric this function doesn't actually compute). A real trending/ranking algorithm (e.g. weighted by *recent* item velocity, not just recency of the single newest item) remains unbuilt.
- **`next.config.mjs`'s `images.remotePatterns`** allowlists `i.ytimg.com`/`s4.anilist.co` for `next/image`, but `next/image` isn't used anywhere — all images render via plain CSS `background`/`backgroundImage`. Inert until a future session adopts `next/image`.
- **`og-fetch`'s SSRF protection is a hostname-literal blocklist**, not DNS-resolution-aware — doesn't defend against a public domain that resolves to a private IP (DNS rebinding). An accepted, explicit trade-off, not an oversight.
- **`og-fetch` has no response-size cap**, only an 8-second timeout.
- **Confirming/flagging have no rate-limiting, no per-visitor ledger, and no atomicity** — see "Partially working" above.
- **Whether "this sandbox" can reach the open internet is environment-dependent, not a fixed fact about this project** — Sessions through 25 stated flatly that it couldn't reach `*.supabase.co` or general internet hosts, and every Supabase/OG-fetch-related change was verified either via mocked local servers (Playwright route interception, a local mock PostgREST/oEmbed server) or via SQL handed to the user to run and report back. **Session 26 found this was no longer true for its own environment**: `curl`/live GraphQL calls to `graphql.anilist.co` succeeded directly (used to catch the Chainsaw Man `anilist_id` bug below — see "Explicitly not built"/roadmap for a session that never had to happen if this had been checked sooner). Supabase itself is still unverifiable from any session, but for a different reason now — no session has ever had this project's real `NEXT_PUBLIC_SUPABASE_URL`/anon key available to it (`.env.local` is gitignored and never committed), independent of network reachability. **Takeaway for future sessions**: don't assume "no internet access" — test it (a plain `curl` to a public API costs nothing to check) before falling back to a mock or asking the human to run something manually. "Verified" in this file means "verified against a faithful mock" or "verified live" — a session note should now say which, since both are genuinely possible depending on the environment. Even a faithful mock can encode a wrong assumption about real Postgres/RLS behavior, as Sessions 19–21 each discovered in turn.
- **`next lint` has never been run successfully in this repo** — no ESLint config exists; the command prompts for first-time setup, which no session has completed. `next build`'s own compile step is the only static check every session has relied on.

### Explicitly not built

- **No "my submissions" view, no way to edit/delete your own submission.** The signed-in identity is wired into exactly two places (the `content_items` insert, and the "Yours" badge) — nothing lets a user *act* on "this is mine" beyond seeing it.
- **No admin/moderation queue view.** `content_items.status` now genuinely moves between `'pending'`/`'confirmed'`/`'flagged'`, and the arc page visually distinguishes pending from confirmed (flagged items don't render at all) — but nothing lists flagged items for review, there's no permissions model for who's allowed to moderate, and there's no way to un-flag or un-confirm anything once it happens. A mistaken flag is permanent today.
- **No tab/filter-pill filtering outside the arc page** — the search page's `FILTERS` pills ("All"/"Arcs"/"Characters"/"Edits & video"/"Fan art"/"Discussion") still do nothing when clicked. (The arc page's own content tabs are real as of Session 28 — see "What's real vs. hardcoded" and `ArcContent.jsx` in the file inventory — this bullet is specifically about everywhere else.)
- **No pagination or "+N more" expansion** — every "+N more" affordance is static text.
- ~~The search page's arc list is still fully hardcoded~~ — **fixed, Session 42**: real per-series arcs (with real sparklines) or an honest empty-state message, matching the arc page's nav strip and the series page's arc list (both real since Session 25).
- **No manual correction UI on `/submit`** — no way to edit a wrong auto-detected title/creator/thumbnail. (Series/arc are a real manual picker as of Session 39, and character tags are real free-text as of Session 40 — this bullet is narrower than it used to be, specifically about the OG-detected link fields now.)
- **No thumbnail images anywhere except real submitted content** — every hardcoded card still uses a CSS gradient placeholder.
- **No per-visitor confirmation/flag ledger** — nothing stops the same browser confirming or flagging the same item repeatedly.

### Phase 7 roadmap

Phases 1–4 are closed. Phase 5 (quality control) is stable — confirming
and flagging both work end to end in production. Phase 6 (Sessions
22–37 — real multi-arc/multi-series data, real tab filtering, a full
mobile-responsive layout, real arc-page/home-page stats) is closed as of
this audit; see "What's changed since Session 22's audit" above for the
summary. **Nothing under Phase 7 has been started yet** — this section
is a full roadmap, not a partial one. Roughly in order of "unblocks the
most other things":

1. **Formally confirm the Session 18 grant + policy SQL is applied**, using the diagnostic query in the Database schema section above, rather than relying on behavioral inference from bug reports — cheap to do, and removes the last piece of "presumed" from this file's Supabase state.
2. **A real moderation/flagged-items view** — even a minimal one (a `/admin` or `?status=flagged` view listing flagged `content_items`, with a button to un-flag or genuinely delete) closes the biggest gap Phase 5 left open: flagging is currently permanent and unreviewable. This is also where a permissions model (who's allowed to moderate) needs to get decided.
3. **A per-visitor confirmation/flag ledger** (or, short of that, at least a same-visitor guard) — nothing stops one browser confirming or flagging the same item repeatedly today. Worth prioritizing once this app has real, potentially adversarial traffic.
4. **A "my submissions" view** — `content_items.submitted_by` already holds a real user id for signed-in submitters; a page listing "content I've submitted" is a small, natural next step (the Session 14 RLS policy, once confirmed run, already supports the query this would need).
5. ~~`ARC`'s remaining hardcoded header fields (badges, seasonPart, dateRange)~~ — **done, Session 44**: omitted entirely for any real seeded arc, rather than always showing Shibuya's own values. `ARC_NAV`'s fallback content (used only when a series has zero other seeded arcs) remains hardcoded — not addressed by this fix, and not a wrong-series bug the way the header fields were.
6. ~~The search page's `ARCS` (an unrelated Chainsaw Man placeholder list) still isn't connected to whatever series is actually being searched~~ — **done, Session 42**: real arcs + real sparklines, or an honest empty-state message.
7. **Manual correction on `/submit`** — at minimum, editable title/creator text fields that pre-fill from OG detection but can be overridden.
8. ~~Extend `/submit` beyond its single hardcoded `ARC_SLUG`~~ — **done, Session 39**: a manual series-search + arc-list picker replaced the hardcoded arc/series, so a submission can now target any seeded series/arc, not just Shibuya. (Manual title/creator correction, item 7 above, is still unbuilt — a separate gap.)
9. **Confirm a real magic-link round trip against the live Supabase project** from outside this sandbox — the one piece of the auth/identity chain never verified against anything other than a mock or an injected session.
10. **If this project ever moves off the Supabase free plan (or sets up custom SMTP), revisit the email-OTP flow** — Session 15's application code is reconstructable from git history; the only blocker was ever the dashboard-side email template.
11. **`next/image` adoption**, now that the `remotePatterns` config exists for it.
12. **The search page's `FILTERS` pills still do nothing** — the arc page's own content tabs are real and functional (Session 28), but nothing outside it. A real `content_type` taxonomy decision (enum/id instead of the current free-text column) would let both this and the arc page's own keyword-based tab filtering be more precise.
13. **Give the home page's "Trending arcs" a real trending/ranking metric** — `getTrendingArcs` (Session 37) orders by most-recently-active, not a genuine weighted-by-recent-velocity ranking; see "Known issues" for the distinction. Would need either a scheduled rollup or a heavier query than this app currently runs on every home page request.
14. **Track something real for the arc page's Saves/This week/Contributors stats** — Session 37 made "Fan items" real and deliberately left the other three as a dash rather than inventing numbers, since nothing in this schema tracks a save action, a time-windowed count, or a distinct-contributor count. Needs actual feature/schema decisions (does "saving" become a real feature at all?), not just a query.

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

## Session 10

Wired `/submit` to Supabase, so the wizard's final step now performs a
real database write instead of ending on a disabled "Coming soon" button.
Two parts:

- **Part 1: seeded reference data.** The `content_items` table needs a
  real `arc_id` (and, ideally, real `beat_id`s) to insert against, so this
  session seeded exactly one series/arc/beat set — Jujutsu Kaisen's
  Shibuya Incident Arc — via SQL handed to the user to run manually in
  the Supabase SQL editor (same "give SQL, don't execute it from a tool"
  pattern as Session 9's table creation). One `series` row
  (`anilist_id: 113415`, `slug: 'jujutsu-kaisen'`), one `arcs` row
  (`slug: 'shibuya-incident-arc'`, `episode_start: 38`, `episode_end: 47`,
  `order_index: 6`, `series_id` resolved via a `select` against the
  just-inserted series row rather than a hardcoded id), and ten `beats`
  rows in order (`order_index` 1–10), with `is_peak: true` on "The
  Sealing" and "Yuji breaks" — see "Database schema" below for the exact
  SQL. **This is the only arc real submissions can currently be saved
  against** — the seed data intentionally uses the canonical beat titles
  ("Shibuya station", "Domain battle") rather than the shorter labels
  `/submit`'s own hardcoded `BEATS` array uses for its chart ("Station",
  "Domain"); the wiring code (below) matches beats by array *position*
  (`order_index`), not by title text, specifically so this naming
  mismatch can't break the lookup.
- **Part 2: real inserts from the wizard.** `app/submit/page.jsx` gained:
  - An import of the shared `supabase` client from `lib/supabase.js`
    (Session 9) — the first page to actually use it.
  - `handleSubmit`, an async function that: looks up the seeded arc's id
    by `slug = 'shibuya-incident-arc'`; fetches that arc's `beats`
    ordered by `order_index` and reads `beats[selectedBeatIndex].id` to
    get the real `beat_id` matching whichever bar the user clicked in
    step 2; then inserts one `content_items` row with `source_url` (the
    URL the user actually typed in step 1 — not a hardcoded stand-in),
    `title`/`creator`/`platform`/`thumbnail_url` from `RESOLVED_LINK`,
    `content_type` from step 2's selected pill, `character_tags` from
    step 2's character chip list, `status: 'pending'`, and
    `submitted_by: 'anonymous'`. Three new pieces of `useState`
    (`submitStatus`: `idle`/`submitting`/`success`/`error`, plus
    `submitError`) drive the UI through the request.
  - The step 3 submit button (`.btnComingSoon`, permanently disabled,
    "Coming soon — backend not connected yet") was replaced with an
    enabled button reading **"Add to aniindex"** (reusing the existing
    `.btnContinue` style), showing "Adding…" while the request is in
    flight and "Added ✓" (disabled, to prevent a duplicate insert) after
    a successful one. The now-unused `.btnComingSoon` rule was deleted
    from `submit.module.css` rather than left as dead CSS.
  - Two new message states render above the footer: a green
    `.submitSuccess` banner ("✓ Submitted — this content is now pending
    review.") on success, or a red `.submitErrorMsg` banner ("Couldn't
    submit: `<message>`") on failure — covering both a failed arc/beat
    lookup and a failed insert (e.g. an RLS rejection or a network error)
    with the underlying error's message, never a silent failure or a raw
    stack trace.
- **Verified with two different tests, since this sandbox's network
  policy blocks `*.supabase.co` outbound** (confirmed via the proxy's own
  status endpoint, the same class of restriction as the AniList image CDN
  noted in Sessions 6–8) — a live end-to-end insert isn't possible from
  inside this environment:
  1. **Real request, sandbox network block** — drove the actual wizard in
     a headless browser against the real `lib/supabase.js` client with no
     mocking. The request genuinely leaves the browser, the sandbox's
     network policy kills it, and — after the browser's own retry/timeout
     behavior plays out (~20s) — `handleSubmit`'s `catch` block correctly
     converts that into the red error banner ("Couldn't submit: Couldn't
     find the Shibuya Incident Arc in the database.") and re-enables the
     button rather than hanging forever or throwing an unhandled
     rejection. This is genuine proof the error path is wired correctly,
     not just code review.
  2. **Mocked Supabase REST responses** — intercepted the three
     `/rest/v1/...` calls (`arcs` select, `beats` select, `content_items`
     insert) in the same headless browser and returned crafted successful
     responses, to verify the success path and the exact row shape
     without needing real network access. Selecting beat index 6 ("Yuji
     breaks") and submitting produced an insert body of `{ arc_id: 42,
     beat_id: 106, source_url: "https://www.tiktok.com/@jjkmoments_/...",
     title: "...", creator: "...", platform: "tt", thumbnail_url: "...",
     content_type: "Edit / AMV", character_tags: ["Gojo Satoru"], status:
     "pending", submitted_by: "anonymous" }` — confirming the beat-index-
     to-`beat_id` mapping is correct (index 6 of the mocked 10-beat array)
     and every field matches the task's spec — and the UI correctly
     showed the green success banner and a disabled "Added ✓" button.
  3. **Not verified in this session, needs the user to confirm**: an
     actual row landing in the real Supabase `content_items` table from a
     real browser outside this sandbox. Once the Part 1 seed SQL has been
     run, submitting a real link through `/submit` in a normal browser
     (not this sandboxed environment) should produce exactly the insert
     shape confirmed in test 2 above, and the row should be visible in
     Supabase's Table Editor.
- `next build` passes with no new errors or warnings after these changes.

### Session 10 follow-up: fix Vercel build crash (`supabaseUrl is required`)

The Vercel deploy failed prerendering `/submit` with `Error: supabaseUrl
is required.` — `next build` statically prerenders `/submit` (it's a
static route with no per-request data needs), which runs every module it
imports, including `lib/supabase.js`, once in Node during the build.
`lib/supabase.js` called `createClient(supabaseUrl, supabaseAnonKey)` at
module scope with no fallback, and `createClient` throws synchronously if
either argument is empty — so on Vercel, where `NEXT_PUBLIC_SUPABASE_URL`
/ `NEXT_PUBLIC_SUPABASE_ANON_KEY` weren't set as project environment
variables (`.env.local` is gitignored on purpose, per Session 9, so it
never reached Vercel), just *importing* the module crashed the whole
build — even though `/submit` never actually calls Supabase until a user
clicks "Add to aniindex" in the browser, long after the page has loaded.

Fixed by giving `lib/supabase.js` placeholder fallback values instead of
letting `createClient` throw:

```js
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
```

Now the module always loads successfully; if the real env vars are
genuinely missing, `supabase.from(...)` calls simply fail at the point
they're used (a normal network/DNS error against the placeholder host)
and surface through `/submit`'s existing try/catch as the red "Couldn't
submit" banner, instead of taking down the entire build. Verified both
ways locally: `next build` with `.env.local` temporarily removed (to
reproduce Vercel's likely misconfigured state) now succeeds, and `next
build` with the real values present still succeeds and behaves exactly
as before.

**This fixes the build, not the underlying missing configuration** — for
`/submit` to actually work on the deployed Vercel site, `NEXT_PUBLIC_
SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` still need to be added
as real environment variables in the Vercel project's settings (Project
→ Settings → Environment Variables), then redeployed. Without that,
the deploy will succeed but every submission will fail with the "Couldn't
submit" error, since the client falls back to the non-existent
placeholder host.

### Session 10 follow-up: RLS policies for anonymous access

Once the build/env-var issues above were resolved, `/submit` reached
Supabase successfully but every submission still failed with "Couldn't
submit: Couldn't find the Shibuya Incident Arc in the database." — the
`arcs` select-by-slug query was returning zero rows even though the
Session 10 seed data exists. Cause: the four tables were created with
plain `create table` statements (no RLS was ever enabled or configured),
and Supabase projects created after mid-2023 default to Postgres's own
RLS-friendly stance where a table with RLS *not explicitly enabled* still
behaves permissively via the anon key **only if RLS is off** — but this
project's Supabase instance had RLS already on (Supabase's dashboard
enables it by default for new tables in newer projects), so with zero
policies defined, every request — reads and writes alike — was silently
denied, returning an empty result set rather than an error. That reads
identically to "the row doesn't exist," which is what made this look like
a missing-seed-data bug at first rather than a permissions bug.

Fixed with a real Supabase auth model — RLS stays **on** for all four
tables (not disabled), with narrow policies matching the app's actual
access pattern: `series`/`arcs`/`beats` are public reference data (open
`SELECT`, no writes at all — the app itself never writes to these three
outside the manual seed SQL), and `content_items` is open for anonymous
`INSERT` (submissions) but has no `UPDATE`/`DELETE` policy, so no
anonymous request can alter or remove a row once submitted — only Supabase
service-role access (not used anywhere in this app) could.

```sql
alter table series enable row level security;
alter table arcs enable row level security;
alter table beats enable row level security;
alter table content_items enable row level security;

create policy "Public read access on series"
  on series for select
  to anon
  using (true);

create policy "Public read access on arcs"
  on arcs for select
  to anon
  using (true);

create policy "Public read access on beats"
  on beats for select
  to anon
  using (true);

create policy "Public insert access on content_items"
  on content_items for insert
  to anon
  with check (true);
```

No `UPDATE`/`DELETE` policies were added for any table, and no `SELECT`
policy for `content_items` — RLS denies by default, so those operations
stay blocked for the `anon` role without needing an explicit deny rule.
`content_items` will need a `SELECT` policy in a future session once some
page actually reads submitted content back out (nothing does yet).

### Session 10 follow-up: still failing after the RLS fix — diagnostics + a more defensive policy set

After applying the RLS policies above, submissions still failed with the
same "Couldn't find the Shibuya Incident Arc in the database" message,
even with the row confirmed present by a direct SQL query. Three things
were checked, since the generic error message couldn't distinguish
between them:

1. **Slug mismatch** — ruled out by direct comparison: `ARC_SLUG` in
   `app/submit/page.jsx` is the literal string `"shibuya-incident-arc"`,
   character-for-character identical to the seed SQL's
   `where arcs.slug = 'shibuya-incident-arc'`. No typo, no case mismatch,
   confirmed by `grep`, not by inspection alone.
2. **Client falling back to the placeholder URL** — `lib/supabase.js` now
   logs `supabaseUrl`, whether an anon key is present, and whether the
   placeholder fallback is active, at module load. This runs both during
   `next build`'s static prerender of `/submit` (so it's visible in
   Vercel's build log — confirmed locally: `[lib/supabase] url:
   https://trpikvadorxrhvhreyyy.supabase.co | anon key present: true |
   using placeholder fallback: false`) and in the browser console when
   the page loads client-side. This doesn't run "on the server" in the
   sense of a server-side request handler — `/submit` is a fully client
   component, so there's no server-side code path at submit time to log
   from; the build-time log is the closest equivalent, and the browser
   console covers the runtime path.
3. **RLS still not actually taking effect** — this is the most likely
   remaining cause, and the previous fix's policies were narrowed to
   `to anon` specifically. This project's Supabase anon key is the
   *newer* `sb_publishable_...`-format key rather than a legacy anon JWT;
   while Supabase documents this as mapping to the same Postgres `anon`
   role for RLS purposes, there was no way to confirm that mapping from
   this sandbox (outbound network access to `*.supabase.co` is blocked
   here, same as every prior session's Supabase/AniList caveats). Rather
   than guess, two things were done: a read-only query to directly
   inspect the *actual* policy/RLS state in Supabase (so this can be
   confirmed instead of assumed), and a reissued policy set that drops
   the `to anon` restriction — defaulting to `PUBLIC` (all roles) removes
   any possible role-name mismatch as a variable. This is no less secure
   for this app specifically, since there's no authenticated-user role in
   use anywhere yet — `PUBLIC` and `anon` are equivalent in practice here.

Also made the arc/beats/insert error paths surface the *real* underlying
Supabase error (message + Postgres/PostgREST error code, e.g. `PGRST116`
for "no rows returned by `.single()`") instead of one generic string for
every possible failure — the red error banner on `/submit` itself is now
diagnostic, so the actual cause shows up in the UI without needing
devtools. Also added `console.log`s around both queries (`arcs`, `beats`)
and the `content_items` insert, logging the query being made and its raw
result/error.

**Step 1 — inspect the real state** (run in the Supabase SQL editor, read
the output, no changes made):

```sql
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relname in ('series', 'arcs', 'beats', 'content_items');

select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename in ('series', 'arcs', 'beats', 'content_items');
```

If `rls_enabled` is `false` for `arcs`, the earlier `alter table ... enable
row level security` never ran. If the second query returns zero rows (or
is missing a `select` policy on `arcs`), the policies from the previous
fix were never created — likely because that whole script wasn't actually
run, or a later statement in the same script errored out and Supabase's
SQL editor stopped executing before reaching the `arcs` policy.

**Step 2 — reissue policies, `PUBLIC` instead of `anon`** (safe to
re-run; drops by name first so it doesn't error on a second run):

```sql
drop policy if exists "Public read access on series" on series;
drop policy if exists "Public read access on arcs" on arcs;
drop policy if exists "Public read access on beats" on beats;
drop policy if exists "Public insert access on content_items" on content_items;

alter table series enable row level security;
alter table arcs enable row level security;
alter table beats enable row level security;
alter table content_items enable row level security;

create policy "Public read access on series" on series for select using (true);
create policy "Public read access on arcs" on arcs for select using (true);
create policy "Public read access on beats" on beats for select using (true);
create policy "Public insert access on content_items" on content_items for insert with check (true);
```

Not verified live in this session — this sandbox cannot reach
`*.supabase.co`. The Step 1 query's output, plus the now-diagnostic error
banner on `/submit` after this deploy, together should make the actual
root cause unambiguous on the next attempt.

### Session 10 follow-up: env vars still missing on Vercel after re-adding them — temporary diagnostic route

Even after deleting/re-adding `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel's Production environment and
redeploying, Vercel's build log kept printing `lib/supabase.js`'s
`missing — using placeholder` line. Added a **temporary** diagnostic
route, `app/api/check-env/route.js`, to inspect what a live server
process on Vercel actually sees — should be deleted once this is
resolved.

- **A build-vs-runtime distinction was tested locally and turned out not
  to apply the way expected**: the working assumption going in was that
  `NEXT_PUBLIC_`-prefixed vars are permanently baked at build time
  wherever `process.env.NEXT_PUBLIC_X` appears in code, server-side
  included. Tested directly: built `next build` with `.env.local` absent
  (reproducing "missing" exactly like Vercel's log), then ran `next
  start` with `.env.local` restored — the route handler's plain
  `process.env.NEXT_PUBLIC_SUPABASE_URL` read the *live* value, not a
  stale build-time snapshot. So for server-executed code (route
  handlers, SSR), Next.js reads these vars live at request/server-start
  time; the immutable build-time inlining only applies to the actual
  browser-side JS bundle. The route was written (and rewritten, once this
  was confirmed) to reflect that — it's a single live `process.env` read,
  not two paths pretending to compare build-time vs. runtime.
- **This redirected the likely root cause.** If build and runtime aren't
  actually different axes for a given deployment on Vercel, the more
  likely explanation for "set in Production, still missing" is that the
  *deployment being tested isn't a Production deployment* — Vercel scopes
  env vars per environment (Production / Preview / Development), and a
  deployment built from a non-`main` branch (this project's active work
  happens on `claude/aniindex-project-review-uf50xx`, not `main`) is a
  **Preview** deployment, which does not receive Production-scoped vars.
  The route reports Vercel's own `VERCEL_ENV` and `VERCEL_GIT_COMMIT_REF`
  system variables (injected automatically by Vercel, unrelated to this
  project's own env var configuration) specifically to make this checkable
  at a glance, rather than assumed.
- **What it reports**: `NEXT_PUBLIC_SUPABASE_URL` in full (public by
  design — same value already shipped in the client bundle whenever this
  works correctly), the anon key masked (prefix + last 4 chars + length,
  enough to confirm presence/shape without fully republishing a
  secret-shaped string on a debug endpoint), `vercelEnv` and `gitBranch`
  from Vercel's own system vars, and a one-line diagnosis. Marked
  `export const dynamic = "force-dynamic"` so Next.js can't statically
  optimize/cache the route's response at build time — confirmed in the
  build output as a dynamic (`ƒ`) route, not a static (`○`) one.
- Verified locally end-to-end (`next build` + `next start`, both with and
  without `.env.local` present) that the route returns valid JSON and
  correctly reflects presence/absence; `vercelEnv`/`gitBranch` read `null`
  locally as expected (Vercel-only variables), and will be populated once
  this deploys to Vercel.
- **Reminder: delete `app/api/check-env/route.js` once this investigation
  is resolved** — it's diagnostic-only, not a permanent part of the app.

**Resolved.** The root cause was the branch/environment mismatch, not a
Supabase or code issue: work was being pushed to
`claude/aniindex-project-review-uf50xx`, which produced Vercel Preview
deployments, not Production — so the Production-scoped Supabase env vars
never applied. Fixed by merging that branch into
`claude/aniindex-arc-page-nextjs-wwizd5` (this repo's actual default
branch, and the one Vercel treats as Production) and pushing there
instead (see the top-level branch note). With that fixed, `app/api/check-
env/route.js` has served its purpose and was deleted.

## Session 11

Wired the arc page to read real story beats and real submitted content
from Supabase, replacing the hardcoded `INTENSITY_BEATS`/`BEATS` consts
whenever the URL's `[slug]` matches a seeded arc — the first page in the
project where `params.slug` actually drives a database query, not just
an `active` flag in `ARC_NAV`.

- **`lib/supabase.js`** gained two new functions, plus a private
  (unexported) `getArcRowBySlug(arcSlug)` helper both of them share:
  - `getArcBeats(arcSlug)` — fetches an arc's `beats` rows (`id`, `title`,
    `order_index`, `intensity`, `is_peak`), ordered by `order_index`
    ascending.
  - `getArcContent(arcSlug)` — fetches that arc's `content_items` where
    `status` is `'confirmed'` or `'pending'`, joined with each item's
    `beats(order_index)` (a to-one embed via `beat_id`) so the results can
    be sorted by the beat's `order_index` ascending, then `created_at`
    descending within a beat. PostgREST's cross-table `order` syntax for
    a to-one embed is real but not something this session wanted to
    depend on sight-unseen (this sandbox can't reach Supabase to verify
    it works as expected) — so the DB query orders by `created_at`
    descending only, and the actual required order (beat first, then
    recency) is applied in JS after the fetch, which is simple to reason
    about and easy to unit-test independent of PostgREST version
    behavior.
  - Both functions share `getArcRowBySlug`'s "not found" contract: if no
    arc matches the slug, `getArcRowBySlug` returns `null` (checking for
    PostgREST's `PGRST116` "no rows" error code specifically) and both
    public functions return `null` in turn. Any *other* error (RLS,
    network) is rethrown rather than swallowed, so — matching this
    project's established `Promise.allSettled` pattern from Sessions
    7–8 — a genuine failure and a nonexistent arc both still land the
    caller in its fallback path, but for callers that want to
    distinguish them, the distinction is preserved rather than collapsed
    at the source.
- **`app/arc/[slug]/page.jsx`** now calls `getArcBeats(params.slug)` and
  `getArcContent(params.slug)` alongside the existing AniList calls, all
  via one `Promise.allSettled` (same independent-fallback pattern as
  Session 7). `arcFoundInDb` is `true` only when *both* calls resolved to
  a non-`null` array — deliberately treated as one combined signal so the
  page can never end up mixing real beats against hardcoded cards or vice
  versa (a subtler kind of broken than an outright error).
  - **When the arc is found**: `intensityBeats` is built straight from
    the real `beats` rows (`label` ← `title`, `heightPct` ← `intensity`,
    `tier` ← `"peak"` if `is_peak`, else `"high"` at `intensity >= 50`,
    else `"normal"` — the same 50-point threshold the original hardcoded
    `INTENSITY_BEATS` effectively used, confirmed by comparing the two
    side by side). A new `buildBeatSections(beats, content)` helper groups
    the real content items by `beat_id` and produces one section **per
    real beat, always** — including beats with zero items, per the task:
    a beat with nothing submitted yet shows its header (with `0 items`)
    and an empty card grid, never a hardcoded placeholder card standing
    in for missing real data. `count` on each section is the real item
    count (not a fabricated inflated number like the hardcoded data's
    placeholder counts), and `peakLabel` is `"Peak moment"` for any
    `is_peak` beat (the hardcoded data's second, distinct "Highest
    moment" label for one specific beat has no real equivalent to derive
    from, so real peak beats all read the same).
  - **When the arc isn't found** (or either call rejected): both
    `intensityBeats` and the beat sections fall back to the original
    hardcoded `INTENSITY_BEATS`/`BEATS` consts, unchanged — every other
    slug still renders the Shibuya mockup data exactly as before this
    session, and the page never breaks or shows a partial/empty state for
    an arc that simply isn't wired up to real data yet.
  - Nothing else on the arc page changed — `ARC_NAV`, `ARC`'s own
    fields (name, episodes, badges, stats), and `TABS` are all still
    fully hardcoded, and the AniList-backed breadcrumb/description/
    character wiring from Session 7 is untouched.
- **Verified with a local mock PostgREST server**, since this sandbox
  cannot reach `*.supabase.co` (same restriction as every Supabase-related
  session since Session 9): wrote a small Node HTTP server reproducing
  the exact three request/response shapes `getArcRowBySlug`/`getArcBeats`/
  `getArcContent` make (including PostgREST's real `PGRST116`/406
  behavior for `.single()` finding zero rows), pointed
  `NEXT_PUBLIC_SUPABASE_URL` at it for a real `next build` + `next start`,
  and fetched the actual rendered HTML — not a mocked browser fetch, but
  the real Next.js server doing real SSR against a real HTTP server that
  happens to be a stand-in for Supabase. Confirmed, reading the rendered
  HTML directly:
  - `/arc/shibuya-incident-arc` (mocked as a seeded arc, with one mocked
    `content_items` row on the "The Sealing" beat) rendered all 10 real
    beat titles in both the intensity chart and the beat sections, the
    mocked item's title/creator/platform/tags appeared as a real
    `ContentCard` under "The Sealing" specifically (item count `1`), all
    9 other beats rendered with item count `0` and an empty card grid,
    "The Sealing" and "Yuji breaks" carried the peak styling, and zero
    hardcoded fallback strings (e.g. "Curtain falls & Shibuya Station")
    appeared anywhere in the page.
  - `/arc/totally-unknown-arc-slug` (mocked as not seeded) rendered the
    original hardcoded 3-section `BEATS` data and hardcoded
    `INTENSITY_BEATS` exactly as before this session, with zero real-data
    strings (the mocked item's title) appearing anywhere.
  - Restored the real Supabase env vars and rebuilt afterward to confirm
    no test state leaked into the actual deploy.
- **Not verified against the real, live Supabase project** — this
  sandbox's network policy still blocks `*.supabase.co`. The task asked
  to submit a real item through `/submit` and confirm it shows up on the
  arc page; that step needs to happen from a real browser outside this
  sandbox. Given the mock-server verification above exercises the exact
  same code path end-to-end (including the real query shapes and the
  real grouping/fallback logic), the expected outcome is: after running
  the Session 10 seed SQL and submitting a link on `/submit` (which
  writes to `content_items` with `status: 'pending'`), reloading
  `/arc/shibuya-incident-arc` should show that submission as a real card
  under whichever beat was selected, with every other beat showing 0
  items — matching exactly what the mock server test demonstrated.

### Session 11 follow-up: still showing hardcoded content — temporary diagnostic log

Despite the above, `/arc/shibuya-incident-arc` is still rendering the
hardcoded `BEATS`/`INTENSITY_BEATS` content on the real deployment.
Added a **temporary** `console.log` right after `arcFoundInDb` is
computed in `app/arc/[slug]/page.jsx`, logging `params.slug`, each of
`beatsResult`/`contentResult`'s `status` ("fulfilled" or "rejected"),
the resolved value when fulfilled, the rejection's error message when
rejected, and the final `arcFoundInDb` boolean — everything needed to
tell apart "the arc genuinely isn't seeded," "a query is failing (RLS,
network, bad slug)," and "the fetch succeeds but something downstream is
wrong," which a rendered page alone can't distinguish.

Smoke-tested locally (`next start` against this sandbox's real,
network-blocked Supabase host) to confirm the log actually fires and
reads correctly before pushing — it correctly reported both
`beatsResult`/`contentResult` as `"rejected"`, with the real underlying
error message, and `arcFoundInDb: false`. On the actual Vercel
deployment this same log should show either real fulfilled data (if the
page's own logic is somehow still preferring the hardcoded fallback
despite real data being available — a code bug) or a rejected status
with a real error message (an RLS/query problem, likely the same class
of issue as the Session 10 follow-ups). Check Vercel's function logs for
the `[arc/[slug]] diagnostic:` line after loading the page.

**Reminder: remove this `console.log` once the cause is found** — it's
diagnostic-only.

### Session 11 follow-up: wire the submit form's beat selector to real beats too

The arc page now reads real beats correctly, but `app/submit/page.jsx`
was still using its own Session 5 hardcoded `BEATS` array (10 beats with
slightly different labels — `"Station"`, `"Domain"` — from the real seed
data's `"Shibuya station"`, `"Domain battle"`) for the beat-selector
chart, and — even though `handleSubmit` already saved a real, database-
sourced `beat_id` — it got there by re-querying `beats` at submit time
and mapping `selectedBeatIndex` onto that freshly-fetched array by
position, entirely decoupled from whatever the chart itself was showing
the user.

- **Removed the hardcoded `BEATS` const entirely.** `app/submit/page.jsx`
  now calls `getArcBeats(ARC_SLUG)` (the function added to
  `lib/supabase.js` in Session 11) in a `useEffect` on mount, storing the
  result in a new `realBeats` state (`null` until resolved). The beat
  chart, bar heights, labels, and the "selected beat" name all render
  directly from `realBeats` — real `title`/`intensity` fields, not the
  old hand-picked `label`/`heightPct` values.
- **`selectedBeat` is now `realBeats?.[selectedBeatIndex] ?? null`** — a
  real beat row (with a real `id`) once loaded, not a lookup into a
  parallel hardcoded array. `handleSubmit` was simplified to match: the
  redundant `beats` query it used to run at submit time is gone, and the
  insert now uses `selectedBeat.id` directly — the exact same real id
  already driving what's on screen, not a second, independently-fetched
  copy that merely happened to agree by array position.
- **Three states while `realBeats` loads**: a "Loading story beats…" note
  while the fetch is in flight, a red error message (reusing the
  `.submitErrorMsg` style from Session 10) if `getArcBeats` rejects or
  returns nothing, or the real chart once loaded — never a silent fall
  back to fabricated data, since this task (unlike the arc page's
  explicit "fall back to hardcoded JJK data" instruction) didn't call for
  one, and reintroducing fake beats here would just recreate the bug
  being fixed. Step 2's "Continue →" button is now `disabled={!selectedBeat}`,
  which guarantees a real beat is loaded before the user can ever reach
  step 3 — so every later reference to `selectedBeat.title` (the step-2
  completed summary, step 3's `ContentCard` preview) is safe without
  needing its own null guard.
- **Dropped the fabricated "`{count} items already here`" line** in the
  selected-beat row — `getArcBeats` doesn't return an item count (that
  would need a separate `content_items` query this task didn't ask for),
  and this project's established convention is to omit a stat rather
  than keep showing an invented number once the real data source can't
  back it (same call made for the arc page's stats in Session 6, and the
  character mention-count badge in Session 7). Removed the now-dead
  `.beatSelectedCount` CSS rule along with it.
- **Verified interactively** with a real dev server and mocked Supabase
  REST responses (this page's Supabase calls run client-side, so
  Playwright's request interception applies directly here, unlike the
  arc page's server-side fetch): loading `/submit` and reaching step 2
  rendered the real beat titles `"Shibuya station"` and `"Domain
  battle"` — confirming the *real* seed titles render, not the old
  hardcoded `"Station"`/`"Domain"` labels (checked their absence
  directly, count `0`). Clicked "Yuji breaks" (mocked real id `107`,
  not index `6`), continued to step 3, and submitted — the mocked
  `content_items` insert's `beat_id` was exactly `107`, proving the
  saved id comes from the real beat object already driving the UI, not
  a coincidental index match into a separately-fetched array.
- Not verified against the real, live Supabase project, for the same
  reason as every Supabase-touching session so far — this sandbox's
  network policy blocks `*.supabase.co`.

### Session 11 follow-up: content_items had no SELECT policy — arc page showed 0 items on every beat

The arc page correctly read real beats and `arcFoundInDb` was `true`,
but every beat rendered `0 items` even though `content_items` had real
rows. Cause: the only RLS policy ever added to `content_items` was the
Session 10 `INSERT` policy — there was never a `SELECT` policy. For a
plain (non-`.single()`) query, Postgres RLS silently returns zero rows
when no policy grants access, rather than raising an error — which is
exactly why this looked like "no content" instead of a visible failure.

Reviewed `getArcContent` (`lib/supabase.js`) and the downstream
`buildBeatSections` grouping (`app/arc/[slug]/page.jsx`) specifically for
a `beat_id`-filtering bug, since the empty result could plausibly have
been either. **No code bug found** — `getArcContent` correctly filters by
`content_items.arc_id` (returning every item across all beats in the
arc, by design, since per-beat grouping happens downstream) and embeds
`beats(order_index)` only for sorting; `buildBeatSections` correctly
matches each item's `beat_id` against the real `beats.id` values from
`getArcBeats`. Session 11's own mock-server test already exercised this
exact grouping logic end-to-end with real data present and it worked
correctly then too — the RLS gap fully explains the symptom on its own,
so no code was changed this round.

Fix (run manually in the Supabase SQL editor):

```sql
drop policy if exists "Public read access on content_items" on content_items;

create policy "Public read access on content_items"
  on content_items for select
  using (status in ('pending', 'confirmed'));
```

Not scoped `to anon`, matching the earlier lesson from the "still
failing after the RLS fix" follow-up — `PUBLIC` removes any doubt about
how the `sb_publishable_...`-format key maps to Postgres roles. Only
`pending`/`confirmed` rows are readable; any other `status` value stays
hidden from anonymous reads. Not verified live — this sandbox can't
reach `*.supabase.co`.

### Session 11 follow-up: arc page serving stale data — Next.js fetch caching

Even with data confirmed present and readable, the arc page kept showing
stale/missing `content_items`. Cause: Next.js patches the global `fetch`
during Server Component rendering and, absent an explicit cache
directive, defaults to `force-cache` — so `getArcBeats`/`getArcContent`'s
underlying HTTP requests (and, without anything forcing the route
dynamic, the rendered page itself) were eligible to be cached and reused
across requests, entirely independent of Supabase or RLS. `lib/anilist.js`
already opts into this deliberately (`next: { revalidate: 3600 }`, an
hour-long cache, by design per Session 6); `lib/supabase.js` had no cache
directive at all, which meant it was silently inheriting Next's
aggressive default instead of being fetched fresh.

Two fixes, both applied:

- **`lib/supabase.js`** now passes a custom `fetch` to `createClient()`
  (`global.fetch`) that adds `next: { revalidate: 0 }` to every request
  this client makes, opting all Supabase traffic out of Next's Data
  Cache. Applies globally to the one shared client (used by both the arc
  page's server-side calls and `/submit`'s browser-side calls) — harmless
  for the browser calls, since Next's fetch patching/caching only affects
  server-side rendering, not client-side `fetch()`.
- **`app/arc/[slug]/page.jsx`** gained `export const revalidate = 0` at
  the top of the file — the route segment config that forces the whole
  route to render dynamically and revalidate on every request, rather
  than being eligible for the static/ISR-style caching Next can apply to
  a dynamic-segment page once nothing else forces it dynamic. **Side
  effect, and an intentional trade-off**: per Next's docs, when multiple
  fetches in one route specify different revalidate times, the *lowest*
  wins for the whole route — so this also overrides `lib/anilist.js`'s
  hour-long cache for the `getSeriesById`/`getSeriesCharacters` calls this
  same page makes, meaning the arc page now hits the AniList API fresh on
  every load too, not just Supabase. This matches what was explicitly
  asked for ("force the entire page to be dynamic and never cached") and
  is fine functionally, but is worth knowing: this page no longer
  benefits from AniList response caching the way the search/series pages
  still do.
- **Verified the fix actually eliminates caching**, not just theoretically
  correct: pointed the app at a local mock PostgREST server (same
  approach as Session 11's original verification) that returns a
  different, counter-tagged `content_items` row on each request, ran a
  real `next build` + `next start`, and issued three separate requests to
  `/arc/shibuya-incident-arc` — each one returned a distinct counter value
  (`LIVE FETCH #1`, `#2`, `#3`), proving the page genuinely re-executes
  the Supabase queries on every request rather than serving a cached
  response. Restored the real Supabase env vars and rebuilt afterward to
  confirm no test state leaked into the deploy.

### Session 11 follow-up: platform values saved as short codes instead of full names

`content_items.platform` was being saved as `"tt"` instead of `"tiktok"`
(and would have had the same issue for YouTube/X/Instagram/Reddit, had
the submit form's fake "detection" ever produced anything but TikTok).
Cause: `app/submit/page.jsx`'s `RESOLVED_LINK.platform` — the single
hardcoded value used for both the step 3 preview and the actual
`content_items` insert (the submit flow's link "detection" has always
been entirely fake, per Session 5 — it's always this same hardcoded
TikTok item) — was `"tt"`, the short code `ContentCard`'s `PLATFORM_META`
map has always used internally as its lookup key.

Fixed both ends of this, not just the saved value, since they have to
agree:

- **`app/submit/page.jsx`**: `RESOLVED_LINK.platform` changed from
  `"tt"` to `"tiktok"`.
- **`components/ContentCard.jsx`**: `PLATFORM_META` now accepts *both*
  the short code and the full name as keys for all five platforms
  (`yt`/`youtube`, `tt`/`tiktok`, `x`, `ig`/`instagram`, `rd`/`reddit`),
  both mapping to the same meta object. This was necessary, not optional
  — every hardcoded content item across the rest of the app (arc page
  `BEATS`, search page `TOP_CONTENT`) still uses the short codes, so
  narrowing `PLATFORM_META` to only the full names would have broken
  every one of those cards; widening it to accept either keeps both the
  old hardcoded data and new real `content_items` rows (which now store
  the full name) rendering correctly through the same component. `x` was
  left as-is — Twitter/X's short code and "full" value are already both
  `"x"`, so there was nothing to fix there.
- **Found and fixed a real, unrelated crash while testing this**: the
  beat-selector's "selected beat name" row (`app/submit/page.jsx`) was
  guarded on `realBeats` (the fetched array) being loaded, not on
  `selectedBeat` (`realBeats[selectedBeatIndex]`) being non-null. Since
  `DEFAULT_BEAT_INDEX` is `4`, this only actually crashes if `realBeats`
  ever resolves with 5 or fewer beats — never the case with the real
  10-beat Shibuya seed data, so it hadn't surfaced yet, but it's a real
  latent bug (any future arc seeded with fewer beats would crash for
  every real user on step 2, not just a test). Found via a Playwright
  test using a deliberately short mocked `beats` response, fixed by
  guarding that one sub-block on `{selectedBeat && (...)}` instead of the
  outer `{realBeats && (...)}`.
- **Verified with a real dev server and mocked Supabase REST responses**
  (`next build` + `next start`, matching this project's established
  verification pattern — an initial attempt via `next dev` produced noisy,
  unreliable results from React DevMode/Fast-Refresh machinery and was
  discarded in favor of a production build): reproduced the crash above
  with a 1-beat mock, confirmed the fix resolves it; then, with a
  realistic 10-beat mock matching the real seed data, drove the full
  wizard end-to-end — the step 3 preview correctly showed the "TikTok"
  badge, and the mocked `content_items` insert's `platform` field was
  exactly `"tiktok"`. Separately, pointed a mock PostgREST server's
  `content_items` response at a row with `platform: "tiktok"` and
  confirmed `/arc/shibuya-incident-arc` rendered it with the correct
  TikTok badge/icon (`plt plt-tt` class, `♪` icon) via the widened
  `PLATFORM_META` — the full round trip, submit through display, works
  with the new value.

## Session 12

Built real Open Graph auto-detection for the submit form, replacing
Session 5's entirely-fake link "detection" (`RESOLVED_LINK` always
represented the same hardcoded TikTok item regardless of what URL was
pasted) with a genuine server-side fetch-and-parse of whatever URL the
user actually types in.

- **`app/api/og-fetch/route.js`** (new) — a `POST` route handler that
  takes `{ url }`, fetches that URL server-side, and returns
  `{ title, thumbnailUrl, platform, creator }`.
  - **HTML parsing is regex-based, not a DOM/HTML-parsing dependency** —
    matches this project's established "no external UI or data
    libraries" stance (see the Stack section). `extractMetaTag(html,
    property)` matches `<meta property="og:x" content="...">` in either
    attribute order, and also checks `name=` (non-standard but common in
    the wild) as a fallback. A small `decodeHtmlEntities` helper handles
    `&amp;`/`&quot;`/numeric entities, since real page titles routinely
    contain them (confirmed via a mock TikTok-style page titled `"...
    sealed &amp; the internet broke"` decoding correctly to `&`).
  - **Platform detection** is a hostname allowlist:
    `tiktok.com`→`tiktok`, `youtube.com`/`youtu.be`→`youtube`,
    `twitter.com`/`x.com`→`x`, `instagram.com`→`instagram`,
    `reddit.com`→`reddit`; anything else returns `platform: null` rather
    than guessing.
  - **Creator detection** is platform-specific, per the task: TikTok
    pulls the `@username` path segment directly from the URL (regex
    against `pathname`, no fetch needed for this part); YouTube uses
    `og:site_name` (in practice this is usually the literal string
    "YouTube" on real video pages, not the uploading channel — that's
    what the task specified, so that's what's implemented, but it's
    worth knowing this won't produce an actual channel name for most
    real YouTube URLs); everything else — X, Instagram, Reddit, and any
    unrecognized platform — falls back to the URL's own hostname.
  - `og:description` is extracted (per the task's explicit list of tags
    to parse) but not currently returned — no consumer needs it yet, so
    it's left as an unused local rather than inventing a 5th response
    field the task didn't ask for.
  - `og:image` is resolved against the target page's own origin if it's
    a relative path (`new URL(ogImageRaw, parsedUrl)`) — technically a
    spec violation on the source site's part, but common enough in
    practice to be worth handling rather than silently dropping the
    thumbnail.
  - **Basic SSRF hardening**, since this route fetches an arbitrary,
    user-supplied URL server-side: rejects non-http/https schemes, and
    rejects a hostname-literal blocklist (`localhost`, `127.*`, `10.*`,
    `172.16–31.*`, `192.168.*`, `169.254.*`, `::1`) before ever
    fetching. This is a literal-hostname check, not DNS-resolution-aware
    — it won't catch a public domain that resolves to a private IP (DNS
    rebinding), which would need resolving DNS and validating the
    resolved IP before connecting; that's meaningfully more involved and
    considered out of scope for this feature, noted here rather than
    silently assumed away.
  - **An 8-second timeout** (`AbortController`) on the upstream fetch, so
    a hanging target can't hang the whole request indefinitely — verified
    directly against a mock endpoint that never responds; the route
    correctly aborted and returned an error at ~8s, not sooner and not
    later. No response-size cap was added (a fast-but-huge response could
    still consume memory within that 8s window) — considered a
    reasonable, explicitly-noted trade-off rather than adding streaming-
    with-truncation complexity for a feature that didn't ask for it.
- **`app/submit/page.jsx`** step 1 now debounces on `url` (500ms
  `setTimeout`, reset on every keystroke via the effect's cleanup) before
  calling `/api/og-fetch`, and aborts a still-in-flight request
  (`AbortController`) if the URL changes again before it resolves, so a
  slow, superseded response can never overwrite a newer one. Three new
  pieces of state — `resolvedLink` (the raw API response or `null`),
  `ogStatus` (`idle`/`loading`/`success`/`error`), `ogError` — drive:
  - An inline status line directly under the URL input: the original
    static "Works with TikTok..." hint while idle, "Detecting link
    details…" while loading, a red error banner while failed (explicitly
    stating the user can still continue manually, per the task), or a
    green "✓ Detected from `<Platform>`: `<title>`" line on success.
  - **`RESOLVED_LINK` was removed entirely**, replaced by a derived
    `effectiveLink` object (`title`/`thumbnailUrl`/`platform`/`creator`)
    that reads from `resolvedLink` when available and falls back to
    honest placeholders otherwise (`"Untitled link"`, a generic gradient,
    `"other"`, `"Unknown creator"`) — this is what "let the user proceed
    with manual entry" means in practice here, since there's no actual
    manual-entry form for these fields (out of scope for this task).
    `effectiveLink` is now what the step 1 completed-summary card, the
    step 3 `ContentCard` preview, and the real `content_items` insert all
    read from — the "Next →" button's enabled condition was intentionally
    left unchanged (`url.trim().length === 0` only), so a failed or
    still-pending fetch never blocks progress.
  - `platform` specifically can't fall back to `null` for the DB insert,
    since `content_items.platform` is `NOT NULL` — `"other"` is used as a
    genuine, `ContentCard`-safe "unknown platform" sentinel instead of
    guessing.
- **`components/ContentCard.jsx`** gained a `DEFAULT_PLATFORM_META`
  fallback (`meta = PLATFORM_META[platform] || DEFAULT_PLATFORM_META`) —
  necessary, not optional, once real detected platform values (including
  `null`/`"other"` for unrecognized links) could reach this component;
  without it, an unrecognized platform would crash the card instead of
  rendering a neutral "🔗 Link" badge.
- **Verified thoroughly**, since this route's core job — fetching
  arbitrary real-world URLs — can't be exercised against genuine TikTok/
  YouTube/etc. pages from this sandbox (no general outbound network
  access) and doing so wouldn't be appropriate for automated testing
  regardless. Instead: added temporary `/etc/hosts` entries mapping
  `tiktok.com`, `youtube.com`, `reddit.com`, and a synthetic
  `unknownsite.test` to `127.0.0.1`, and ran a local mock HTTP server
  that serves different canned OG-tagged HTML per `Host` header — this
  makes the API route's own hostname-based platform detection and
  fetch/parse logic run entirely for real, against real (if locally-
  redirected) hostnames, not a mocked function. Directly confirmed via
  `curl` against the real running route: correct title/platform/creator/
  thumbnail (including HTML entity decoding and relative-image-URL
  resolution) for TikTok; `og:site_name`-based creator for YouTube;
  hostname-fallback creator for Reddit and for an unrecognized domain;
  every error path (invalid URL, missing `url` field, each SSRF-blocked
  host pattern, non-http scheme, non-HTML response, upstream 5xx, and the
  8-second timeout) returning the right status and message. Then, with
  Supabase calls mocked at the browser level (same sandbox network
  restriction as every prior session) but `/api/og-fetch` genuinely real
  and same-origin, drove the full wizard in Playwright: typed the mock
  TikTok URL character-by-character, confirmed the loading state
  appeared, confirmed the real title/platform showed up in both the step
  1 completed-summary card and the step 3 preview, and confirmed the
  final (mocked) `content_items` insert carried the real title, `@testcreator`
  creator, `"tiktok"` platform, and the resolved absolute thumbnail URL —
  the complete pipeline, not just the API route in isolation. Restored
  `/etc/hosts` and stopped all mock servers afterward.

### Session 12 follow-up: YouTube blocks server-side scraping — use oEmbed instead

Real YouTube submissions were coming back as "Untitled link" with no
thumbnail — YouTube actively blocks/serves incomplete markup to
server-side scrapers (no real `og:*` tags in the HTML a plain server-side
`fetch()` gets back), so the regex-based scrape that works for TikTok/
Reddit/etc. never had real data to extract for YouTube.

Fixed by giving YouTube its own path in `app/api/og-fetch/route.js`,
using YouTube's public oEmbed endpoint instead of scraping:

- After the existing scheme/SSRF checks, platform is now detected
  *before* deciding how to fetch (previously this happened at the end,
  after scraping). If `platform === "youtube"`, a new
  `fetchYouTubeOEmbed(targetUrl)` calls
  `https://www.youtube.com/oembed?url=<encoded target>&format=json` — no
  API key needed — and the response is mapped directly: `title` →
  `title`, `author_name` → `creator`, `thumbnail_url` → `thumbnailUrl`,
  `platform` hardcoded to `"youtube"`. Everything else (TikTok, X,
  Instagram, Reddit, unrecognized domains) still goes through the
  original HTML-scraping path unchanged.
- This fetch **doesn't need the SSRF hostname blocklist** the scrape path
  has — it always fetches the fixed, known host `www.youtube.com`, never
  the user-supplied URL directly (that URL is only ever passed along as
  an encoded query *value*, which YouTube's own service resolves on
  their end, not ours).
- Same 8-second `AbortController` timeout as the scrape path, and the
  same clean-error-message contract on failure (a 404 from oEmbed, e.g.
  for a private/deleted video, or a 5xx, both surface as a normal
  `{ error: "..." }` response rather than a crash).
- `detectCreator` no longer has a YouTube-specific branch (its only
  purpose was reading `og:site_name`, which in practice usually just
  said "YouTube" itself rather than the channel name — see the original
  Session 12 caveat above) — dead code once every YouTube URL is
  redirected to the oEmbed branch before ever reaching it. `og:site_name`
  is still extracted from the HTML for the remaining platforms (per the
  original task's tag list) but is unused now that its one consumer is
  gone, same as `og:description`.
- **Verified against a real running instance of the route**, not just
  logic review — this couldn't be tested with a plain HTTP mock like the
  original Session 12 verification, since the oEmbed URL is hardcoded to
  `https://www.youtube.com`, and Node's own `fetch()` needs a TLS
  connection there. Rather than disable certificate verification (which
  would be a real, unnecessary weakening), generated a throwaway test CA
  and a `www.youtube.com` server cert signed by it, ran a local HTTPS
  mock oEmbed server with that cert, redirected `www.youtube.com` to
  `127.0.0.1` via a temporary `/etc/hosts` entry, and started the real
  Next.js server with `NODE_EXTRA_CA_CERTS` pointed at the test CA —
  scoping trust to exactly that one test certificate rather than
  disabling verification globally. (Confirmed first that Node's built-in
  `fetch()`, unlike `curl`, doesn't automatically honor this sandbox's
  `HTTPS_PROXY` env var, so this direct connection was actually reaching
  the local mock rather than being silently proxied/blocked.) Against the
  real running route: a `youtube.com/watch` URL and a `youtu.be` short
  URL both correctly returned the real title/creator/thumbnail from the
  mocked oEmbed response; a mocked private/deleted-video 404 and a mocked
  5xx both produced clean error messages. Re-ran the original TikTok and
  Reddit tests too, unchanged, to confirm the refactor (moving platform
  detection earlier, simplifying `detectCreator`'s signature) didn't
  regress the existing paths. All test certs, mock servers, and
  `/etc/hosts` changes were removed/reverted afterward.

### Session 12 follow-up: next.config.mjs image domain allowlist

Added `images.remotePatterns` to `next.config.mjs`, allowlisting
`i.ytimg.com` (YouTube thumbnails, from the oEmbed integration above) and
`s4.anilist.co` (AniList's character/series image CDN, used since
Sessions 6–8) — both `https`, wildcard `pathname: "/**"`.

**Worth being precise about what this does and doesn't fix**: this
config only affects Next.js's `next/image` component, which **isn't
used anywhere in this codebase yet** — `ContentCard.jsx` renders
`thumbnailUrl` via a plain CSS `background`, and character portraits
(`CharacterChips.jsx`) render via a plain `background-image`, neither of
which is subject to Next's image-domain allowlist at all. There's also
no CSP configured anywhere that would block these hosts another way. So
if YouTube thumbnails are genuinely not rendering visually, this change
by itself doesn't explain why, and isn't a complete fix for that
symptom — it's a correct, safe, forward-looking addition for whenever a
future session switches these components to `next/image` for real
optimization (a natural next step, now that real thumbnail/portrait URLs
actually flow through the app instead of only gradients). Flagged this
directly rather than silently complying with a diagnosis the codebase
doesn't support.

### Session 12 follow-up: the actual thumbnail bug — invalid CSS, not a domain allowlist

The `remotePatterns` addition above didn't fix it, as flagged — the real
bug was in how `thumbnailUrl` gets applied as a style, found by checking
exactly what the previous follow-up predicted needed checking.

- **The DB save path is correct** — traced
  `resolvedLink.thumbnailUrl` (the raw `/api/og-fetch` response) →
  `effectiveLink.thumbnailUrl` → `thumbnail_url` on the `content_items`
  insert in `app/submit/page.jsx`; no bug in that chain. Not verified
  against the live database directly (this sandbox still can't reach
  `*.supabase.co`) — to check the actual stored value for a real
  submission yourself:
  ```sql
  select title, platform, thumbnail_url, created_at
  from content_items
  where platform = 'youtube'
  order by created_at desc
  limit 5;
  ```
- **The real bug: `components/ContentCard.jsx` applied `thumbnailUrl` as
  `style={{ background: thumbnailUrl }}`.** This works for the app's
  hardcoded placeholder data, which is always a CSS gradient string
  (`background: linear-gradient(...)` is valid CSS) — but for a real
  image URL (`background: "https://i.ytimg.com/vi/xxx/hqdefault.jpg"`),
  a bare URL is **not valid CSS** for the `background` shorthand (it
  needs `url(...)` wrapping); the browser silently drops the whole
  declaration rather than erroring, so nothing renders. Confirmed this
  precisely, not just by inspection: loaded a minimal HTML file with
  `style="background:https://..."` in a real headless browser and read
  `getComputedStyle(el).backgroundImage`, which came back `"none"`.
- **Found the identical bug in a second location** while fixing the
  first: `app/submit/page.jsx`'s step 1 "completed summary" preview card
  had the exact same `style={{ background: effectiveLink.thumbnailUrl }}`
  pattern — same root cause, same fix needed, just not the file the task
  named.
- **Fix**: added `getThumbnailStyle(thumbnailUrl)`, exported from
  `components/ContentCard.jsx` (now genuinely used by two call sites, so
  sharing it is warranted rather than premature) — returns
  `{ backgroundImage: "url(...)", backgroundSize: "cover",
  backgroundPosition: "center" }` for anything starting with `http(s)://`,
  or falls back to the original `{ background: thumbnailUrl }` for
  everything else (gradients, any other CSS value). Both `ContentCard`'s
  `.thumb`/`.compactThumb` divs and the submit page's `.completedThumb`
  div now use this instead of the raw inline style.
- **Verified with real browser computed-style checks, not just visual
  screenshots** (a real https image URL can't actually load in this
  sandbox regardless, so a screenshot alone wouldn't prove much): on the
  arc page (hardcoded gradient data, since Supabase is unreachable here)
  confirmed `getComputedStyle(...).backgroundImage` still reads
  `linear-gradient(...)` — no regression. Then, driving the submit
  wizard with a mocked `/api/og-fetch` response carrying a real
  `i.ytimg.com` thumbnail URL, confirmed both the step 1 completed-
  summary card and the step 3 `ContentCard` preview now compute
  `backgroundImage: url("https://i.ytimg.com/...")` — the fix genuinely
  applies in both places, not just the one the task named.

## Session 13

Built real magic-link email authentication using Supabase Auth — no new
dependency needed, since `supabase.auth` has been available through the
existing `@supabase/supabase-js` client since Session 9. Three parts, all
in one session: the auth utility functions, the sign-in/callback UI, and
wiring the nav to reflect signed-in/signed-out state.

- **`lib/auth.js`** (new) — three thin wrappers around the shared
  `supabase` client's own `auth` namespace, matching this project's
  established "small lib module, one function per operation" pattern
  (`lib/anilist.js`, `lib/supabase.js`):
  - `signInWithEmail(email)` — calls
    `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo:
    window.location.origin + '/auth/callback' } })` and throws on error, so
    the caller (the `/auth` page) can show a real inline error rather than
    fail silently. `window.location.origin` is read inside the function
    body, not at module scope, so importing this module from a page that
    also happens to render server-side (none currently do, but the
    established pattern elsewhere in this codebase is to keep browser-only
    reads inside the function that's actually only ever called client-side)
    never touches `window` before it exists.
  - `signOut()` — calls `supabase.auth.signOut()`, throws on error.
  - `getSession()` — calls `supabase.auth.getSession()` and returns
    `data.session` or `null`. Deliberately swallows (logs, doesn't throw)
    the error case, unlike the other two functions — every current caller
    just wants "is someone signed in right now," and a transient session
    read failure should read as "signed out" rather than crash whatever
    component asked, the same reasoning already applied to
    `getArcBeats`/`getArcContent`'s null-on-not-found contract in
    `lib/supabase.js`.
- **`app/auth/page.jsx`** (new) + **`app/auth/auth.module.css`** (new) — a
  centered card, styled with the same `--surface`/`--border`/`--accent`/
  `--t1`/`--t2`/`--t3` custom properties already defined in `globals.css`
  (no new CSS variables introduced, aside from two literal colors for the
  success state — see below). Client component (`"use client"`), owning
  `email` and a `status` state machine (`idle` → `loading` → `success` or
  `error`):
  - Idle: the `aniindex` logo (linking home, same `logo` global class +
    `text-decoration: none` pattern used by `SearchNav`/the submit page's
    nav), the heading "Sign in to contribute," the subheading, an email
    input (native `type="email"` + `required`, so the browser's own
    validation catches an obviously malformed address before a request is
    even sent), and the "Send magic link" button.
  - Loading: the input and button both disable, the button's label swaps
    to "Sending…" — the same disabled-button-during-request pattern
    `/submit`'s step 3 "Add to aniindex" button already established in
    Session 10.
  - Success: the form is replaced entirely (not just hidden behind a
    banner) by a green checkmark and "Check your email — we sent a magic
    link to **`<email>`**," the typed address interpolated directly, per
    the task.
  - Error: an inline red banner above the button (reusing the same
    `rgba(240,112,106,0.1)` background / `rgba(240,112,106,0.3)` border /
    `var(--red)` text look as `/submit`'s `.submitErrorMsg`), showing the
    real thrown error's `message` — never a generic "something went
    wrong" — and the form stays interactive so the user can retry.
  - **One deliberate deviation from blindly reusing existing tokens**: the
    success checkmark uses a literal `#6af0a8` / `rgba(106,240,168,...)`
    green rather than `var(--green)`/`var(--green-soft)`, even though
    `submit.module.css` already references those exact variable names
    (and uses that exact color as literal RGB in a couple of its own
    border rules). Checked first: **`--green`/`--green-soft` are never
    actually defined in `globals.css`'s `:root`** — every existing
    `var(--green)`/`var(--green-soft)` reference in `submit.module.css`
    has silently been resolving to nothing (the browser drops the
    declaration, same failure mode as the Session 12 thumbnail-CSS bug)
    since whichever session first wrote them. This is a real, pre-existing
    latent bug, confirmed by `grep`, not fixed here — out of scope for an
    auth task, and touching shared `submit.module.css` styling wasn't part
    of what was asked. Flagging it explicitly rather than silently
    reproducing it: a future session fixing it should add
    `--green`/`--green-soft` to `globals.css`'s `:root` (the color already
    in consistent use everywhere is `rgb(106,240,168)` /
    `rgba(106,240,168,0.14)`), which would then apply to `submit.module.css`
    *and* this page's success state identically without either needing a
    literal value.
- **`app/auth/callback/page.jsx`** (new) — client component, wrapped in
  `<Suspense>` (required for `useSearchParams` in a statically-rendered
  Next 14 App Router page — confirmed by building without it first and
  seeing Next's static-bailout warning, then adding the boundary and
  confirming a clean build). On mount:
  - If the URL has a `code` param (PKCE-flow magic links), calls
    `supabase.auth.exchangeCodeForSession(code)`; redirects to `/`
    (`router.replace`, not `push`, so the callback URL doesn't sit in
    browser history) on success, or shows the real error message on
    failure.
  - If there's no `code` (implicit-flow magic links carry the session in
    the URL's hash fragment instead, which `supabase-js`'s client already
    auto-parses on load via its default `detectSessionInUrl` behavior),
    falls back to `supabase.auth.getSession()` — a session already being
    present means the link was valid and just used the other flow;
    redirects the same way. No session and no error either means the link
    itself was invalid/expired, so that's shown as an explicit message
    rather than silently redirecting anyway. This fallback wasn't
    explicitly named in the task, but was added because the task's own
    spec ("call exchangeCodeForSession if a code param is present") already
    implies there's a real "no code param" case to handle, and leaving it
    as an unconditional error would incorrectly fail every implicit-flow
    link, which is Supabase's default flow type unless a project has PKCE
    specifically configured.
  - Reuses `auth.module.css` (relative import, `../auth.module.css`) for
    the same card chrome as `/auth`, so a user bouncing through this page
    sees visually the same surface, not a jarring unstyled flash.
- **`components/NavAuth.jsx`** (new) — the auth-aware slice of a page's
  `nav-right`, since every page's nav is inlined per-page rather than a
  shared `Nav` component (per this project's established layout, see
  "File layout"). Client component; on mount, calls `getSession()` once
  and also subscribes to `supabase.auth.onAuthStateChange`, so the nav
  updates live after a sign-in (from `/auth/callback`'s redirect back to a
  page holding this component) or a sign-out, without needing a manual
  page reload — unsubscribes on unmount. Renders nothing until the initial
  check resolves (avoids a "Sign in" flash before swapping to the real
  signed-in state a moment later), then either:
  - Signed out: a `next/link` to `/auth` reading "Sign in," styled via a
    `signInClassName` prop (defaults to `"btn btn-ghost"`, matching the
    home page's and `SearchNav`'s existing Sign in button; the arc page
    passes `"btn btn-primary"` to match what was already there — this
    project already had two different visual treatments for the same
    "Sign in" button across pages, Session 13 preserved both rather than
    silently unifying them, since that wasn't asked for).
  - Signed in: the real session's email (`.nav-auth-email` — new, small,
    `var(--t2)`, truncates with an ellipsis past 180px so a long email
    can't blow out the nav layout — added to `globals.css` next to the
    existing `.nav-right`/`.btn*` rules) and a "Sign out" button
    (`.btn.btn-ghost`, same class as everywhere else) that calls
    `signOut()`, showing "Signing out…" while in flight.
  - Wired into the three nav locations that had a "Sign in" button:
    `app/page.jsx` (home), `app/arc/[slug]/page.jsx` (arc page), and
    `components/SearchNav.jsx` (shared by the search and series pages).
    `/submit`'s nav never had a Sign in button (it's the compact
    logo+Cancel nav from Session 5) and wasn't touched.
- **Verified with a real production build and a real browser, not just
  code review**, following this project's established Playwright-based
  verification pattern (this sandbox still can't reach `*.supabase.co`,
  same restriction as every Supabase-touching session since Session 9):
  - `next build` succeeds cleanly with `/auth` and `/auth/callback` both
    prerendered as static routes (confirmed the `<Suspense>` boundary
    around `useSearchParams` was actually necessary — removing it
    reproduces Next's static-bailout error).
  - Screenshotted `/auth` idle (matches the task's spec: logo, "Sign in to
    contribute," the subheading, email input, "Send magic link" button).
  - Clicked submit with no mocking: the request genuinely leaves the
    browser, this sandbox's network policy kills it, and the real "Failed
    to fetch" error correctly renders in the inline red banner — real
    proof the error path works, the same class of test Session 10 used to
    verify `/submit`'s error handling from this same sandbox.
  - Mocked the `signInWithOtp` network call (`**/auth/v1/otp**`) to
    return success: confirmed the success state renders with the actually-
    typed email address interpolated correctly.
  - Confirmed via the rendered DOM (not just a screenshot) that the "Sign
    in" link's `href` is exactly `/auth` on the home page, the arc page,
    and the search page (which also proves the series page, since it
    shares `SearchNav`).
  - Injected a fake session into `localStorage` under Supabase's own
    default storage-key convention (`sb-<project-ref>-auth-token` — this
    sandbox's placeholder Supabase URL gives `sb-placeholder-auth-token`,
    confirmed by reading the key `supabase-js` actually created) and
    reloaded the home page: the nav correctly rendered the injected
    session's email and a working "Sign out" button instead of "Sign in,"
    proving `NavAuth`/`getSession` genuinely read persisted session state
    on mount rather than only reacting to the in-memory result of a sign-in
    that happened in the same page load.
  - **Not verified**: a real magic-link email actually being sent and
    clicked, since this sandbox has no route to Supabase or to any real
    inbox. See the "Partially working" note in the Current State section
    above for what a future session (or the user, from a real browser)
    should check to close this gap.

## Session 14

Wired the signed-in user identity (Session 13) into actual app behavior:
real submissions now save the real user id instead of the literal string
`"anonymous"`, and the arc page's content cards show a small "Yours" badge
on a submission that belongs to whoever's currently signed in. Three parts.

- **`app/submit/page.jsx`**: added a `session` state, populated once on
  mount via a direct `supabase.auth.getSession()` call (the same client
  this file already imports for its `arcs`/`content_items` queries — no
  new import needed). Deliberately *not* subscribed to
  `supabase.auth.onAuthStateChange` the way `NavAuth`/Session 13 is —
  reasoned about this explicitly: the wizard is a single sitting, and
  whatever was true when the form opened is what should be saved,
  regardless of whether the user signs in/out in another tab mid-wizard.
  `handleSubmit`'s insert changed from a hardcoded
  `submitted_by: "anonymous"` to `submitted_by: session?.user?.id ||
  "anonymous"` — one line, but it's the entire behavioral change: signed
  in saves the real `auth.uid()`-shaped UUID, signed out still saves the
  exact same fallback string as before, so a signed-out user's submission
  flow is genuinely unchanged.
- **RLS**: added one new policy (SQL below, and in the "Supabase — full
  schema" section above), letting an `authenticated` user read their own
  `content_items` rows regardless of `status`, on top of the existing
  public policy (`status in ('pending', 'confirmed')`) — Postgres RLS ORs
  multiple permissive policies for the same command, so this is additive.
  Scoped `to authenticated` specifically (not `PUBLIC`, unlike most of
  this project's other policies — see the Session 10 "still failing"
  history for why `PUBLIC` was preferred there): here the policy's whole
  point is comparing `auth.uid()` against `submitted_by`, and
  `auth.uid()` is `null` for an anonymous request, which can never equal
  a real id — so `to authenticated` isn't a style choice here, it's what
  makes the check meaningful at all.

  ```sql
  create policy "Users can read their own submissions"
    on content_items for select
    to authenticated
    using (submitted_by = auth.uid()::text);
  ```

  **Not run against the live Supabase project by this session** — handed
  to the user, per this project's established "SQL is reviewed and run
  manually in the SQL editor" convention (Sessions 9–12 all did the same).
  Doesn't change today's visible behavior either way, since every existing
  row is `'pending'` and already covered by the public policy — it matters
  once a moderation workflow (still not built — see "Suggested next
  phase") introduces other status values a submitter would otherwise lose
  visibility into their own content under.
- **The "Yours" badge** — the one part of this task that took real
  thought, per the task's own framing ("think about the cleanest way to
  do this given the arc page is a server component"):
  - `lib/supabase.js`'s `getArcContent` select list gained
    `submitted_by` (it wasn't being fetched at all before — every other
    field the arc page needed already was). `app/arc/[slug]/page.jsx`'s
    `buildBeatSections` now maps `item.submitted_by` through to each
    card's props as `submittedBy`, alongside the existing
    `platform`/`thumbnailUrl`/etc. mapping — no new fetch, just widening
    an existing one and threading one more field through.
  - **The actual design problem**: `app/arc/[slug]/page.jsx` is an async
    Server Component — it has no access to the browser's Supabase session
    (there's no cookie-based/SSR session anywhere in this app; every
    session lives in the browser's `localStorage`, per Sessions 13's
    design). `ContentCard`, which renders each card, is a plain shared
    component with no `"use client"` of its own, used both here (server-
    rendered, via `BeatSection`) and inside `/submit`'s step 3 preview
    (already client-rendered). Making the whole arc page or all of
    `ContentCard` client-side just to compare one id would have been a
    much bigger blast radius than the task needed.
  - **The fix**: a new, tiny client component,
    `components/YoursBadge.jsx`, nested inside `ContentCard`. This is
    the standard Next.js App Router pattern for exactly this situation —
    a Server Component can render a Client Component as a child, and only
    that nested piece opts into client-side JS; everything around it
    (the card's markup, the beat section, the page itself) stays server-
    rendered exactly as before. `YoursBadge` takes `submittedBy` as a
    prop (already available server-side from the widened query above —
    no client-side fetch of the content itself is needed, only the
    *comparison* needs the browser), calls `lib/auth`'s `getSession()`
    once on mount (the same Session 13 utility `NavAuth` already uses,
    not a new pattern), and renders a `✦ Yours` pill only if
    `session.user.id === submittedBy` — otherwise renders `null`,
    including for the entire window before the check resolves, so it can
    never flash an incorrect badge.
  - `ContentCard.jsx` gained an optional `submittedBy` prop and renders
    `{submittedBy && <YoursBadge .../>}` in both its default and `compact`
    thumbnail markup — gated on the prop being present specifically so
    hardcoded placeholder cards (which never have a `submittedBy`) don't
    each mount a `YoursBadge`/`getSession()` call for nothing; only real
    Supabase-backed cards do.
  - Styling: `.yours-badge` (default mode, `globals.css`) sits top-left
    of the thumbnail — the existing `.plt` platform badge already owns
    bottom-left, and the hover-only "↗" overlay owns top-right, so top-
    left was the one open corner. `.compactYours` (compact mode,
    `ContentCard.module.css`) mirrors the same top-left placement at the
    compact thumbnail's smaller scale. Both use a solid-ish
    `rgba(123,108,246,0.85)` accent fill rather than the app's usual
    `--accent-soft` translucent tint, matching the existing platform
    badges' own reasoning (`.plt-yt`/`.plt-tt`/etc. all use solid-ish
    fills too) — a translucent badge risks disappearing against a light
    or busy real thumbnail image, which a platform-badge-style solid
    fill doesn't.
- **Verified with a real production build and browser**, extending this
  project's established verification pattern (still can't reach
  `*.supabase.co` from this sandbox):
  - `next build` succeeds with no new errors.
  - **Submission identity**: with a fake session injected into
    `localStorage` and `/submit`'s `arcs`/`beats`/`content_items` Supabase
    calls mocked at the browser network level (this page's Supabase calls
    are genuinely client-side, so Playwright's request interception
    applies directly, same as Session 11's follow-up verification of this
    same page), drove the full wizard end to end — the resulting
    `content_items` insert's `submitted_by` was exactly the injected
    session's `user.id`. Repeated with no session present: `submitted_by`
    came back `"anonymous"`, confirming the fallback is untouched.
  - **The "Yours" badge required a different verification approach than
    the submission test**, and it's worth being explicit about why: the
    arc page's Supabase calls happen *server-side*
    (`app/arc/[slug]/page.jsx` is an async Server Component), so
    browser-level Playwright route mocking — which only intercepts
    requests the browser itself makes — can't reach them, unlike
    `/submit`'s genuinely client-side calls above. This is the same
    limitation Session 11's original arc-page verification ran into, and
    it was solved the same way here: a small local Node HTTP server
    standing in for Supabase's REST API, seeded with two `content_items`
    rows (one `submitted_by` matching a to-be-injected session, one not),
    with `NEXT_PUBLIC_SUPABASE_URL` pointed at it. **One real wrinkle hit
    and resolved along the way**: `next build` bakes `NEXT_PUBLIC_*`
    values into the *browser* bundle at build time (confirmed directly —
    Session 10's own finding, re-confirmed here), so the mock server's URL
    had to be set before running `next build`, not just before `next
    start`, for the client-side `getSession()` call inside `YoursBadge` to
    agree with the server-side `getArcContent()` call about which
    Supabase instance (and therefore which `localStorage` key) was in
    play — a build pointed at the mock but a browser bundle still baked
    with the placeholder fallback silently produced a real server-rendered
    page with correct content and a client-side session check that could
    never match anything, which looked like a code bug in `YoursBadge`
    until traced back to being a stale-build artifact instead. Rebuilding
    with the mock URL set resolved it. With that sorted: loading
    `/arc/shibuya-incident-arc` with the matching session injected showed
    exactly one "✦ Yours" badge, on the card whose mocked `submitted_by`
    matched, and none on the other mocked card — confirmed both via a
    screenshot and by asserting on each card's own DOM text directly, not
    visual inspection alone.
  - Restored a clean default build (no mock env vars) and stopped/removed
    both the mock Supabase server and the plain `next start` server used
    for the submission test afterward — no test state, mock server
    processes, or non-default `.next` build left running or committed
    (`.next` itself is already gitignored, per the existing `.gitignore`).

### Session 14 follow-up: fix the magic-link success screen's dead end

Between Sessions 14 and 15, a small standalone fix: the magic-link
success screen (`app/auth/page.jsx`) replaced the whole form with a
"Check your email" message and nothing else — no link, no button, no way
back to the rest of the site short of the browser's own back button.
Added a "← Back to home" link and a note explaining the link had to be
opened on the same device/browser that requested it (Supabase sessions
don't transfer across devices). Verified with a mocked `signInWithOtp`
response and a real click-through confirming the link actually navigated
to `/`, not just that it rendered. **This entire screen and both additions
were removed again in Session 15** below, when the magic-link flow itself
was replaced — noted here only so the history is honest about an
intermediate step existing, not because any of it survived.

## Session 15

Replaced the magic-link auth flow (Sessions 13–14) with a two-step
email-OTP flow: enter your email, then enter the 6-digit code Supabase
emails you, rather than clicking a link. Per the task, `app/auth/callback/
page.jsx` was left completely untouched — it's now unused by this flow
(see below) but wasn't in scope to modify or remove.

- **`lib/auth.js`**: `signInWithEmail` now calls `supabase.auth.signInWithOtp({
  email, options: { shouldCreateUser: true } })` — dropped the
  `emailRedirectTo` option entirely, since there's no redirect link in
  this flow for Supabase to embed. `shouldCreateUser: true` is what makes
  a brand-new email work the same as an existing one; this app has never
  had a separate sign-up flow, so this was already implicitly true before
  (the default), just now explicit per the task's own wording. Added a new
  `verifyOtp(email, token)`, calling `supabase.auth.verifyOtp({ email,
  token, type: "email" })` — throws on failure (wrong/expired code) so the
  caller can show a real inline error, same contract as `signInWithEmail`
  and every other throwing function in this file.
- **`app/auth/page.jsx`**: rebuilt around a `step` state (`"email"` |
  `"code"`) instead of the old `status` state's `"success"` branch.
  - **Email step** — unchanged in spirit from before: email input, "Send
    code" button (relabeled from "Send magic link"), loading/error states.
    On success, transitions to the code step instead of a terminal
    "success" screen — this flow has no dead end by construction, since
    "success" at step 1 just means "there's a second step now," not "the
    task is done."
  - **Code step** (new) — a 6-digit numeric input (`inputMode="numeric"`,
    digit-only via `onChange`'s `.replace(/\D/g, "")`, `maxLength={6}`,
    `autoComplete="one-time-code"` so browsers/password managers that
    support WebOTP-style autofill can offer to fill it), a "Verify code"
    button (disabled until exactly 6 digits are entered, not just
    non-empty — a 3-digit code is never a valid submission attempt worth
    sending to Supabase), and a "← Use a different email" button that
    resets straight back to the email step (clearing the code and any
    error, but not the typed email — re-typing an already-correct address
    after a small mistake elsewhere shouldn't be required). On successful
    verification, `router.replace("/")` — same pattern `app/auth/callback/
    page.jsx` already used for its own post-auth redirect, kept consistent
    even though this page doesn't share code with that one.
  - The subheading on the code step reads "We sent a 6-digit code to
    **`<email>`**," reusing the existing `.subheading` class (which gained
    a `strong` child-selector rule) rather than introducing a second
    near-identical text style — the old dedicated `.successText` class
    this replaced was doing the same job with its own copy of the same
    rules.
- **`app/auth/auth.module.css`**: removed `.success`, `.successIcon`,
  `.successText` (+ its `strong` rule), and `.successNote` as dead CSS —
  the screen they styled doesn't exist anymore, and per this project's own
  established convention (Session 10 deleted `.btnComingSoon` the same
  way), unused rules get removed, not left orphaned "just in case."
  `.backHomeLink` was renamed to `.secondaryAction` and repurposed for
  "← Use a different email" — it's the same "full-width, bordered,
  secondary-weight action" visual pattern, but the class's old name no
  longer described what it does, and reusing a Link-flavored name for a
  `<button>` would have been confusing to whoever reads this file next.
  Explicitly added `background: transparent`, `cursor: pointer`, and
  `font-family: var(--body)` to it while renaming — the original only
  ever styled an `<a>`/`next/link`, which doesn't need those resets the
  way a native `<button>` does. Added `.codeInput` (large, centered,
  letter-spaced text) so the 6-digit field reads clearly as a code entry
  field rather than a generic text input.
- **Verified with a real production build and browser**, mocking
  Supabase's OTP endpoints directly rather than the client SDK (same
  established pattern as every other Playwright-based verification in
  this project):
  - `next build` succeeds with no new errors.
  - Mocked `**/auth/v1/otp**` to succeed: submitting an email correctly
    transitions to the code step, with the real typed address shown in
    the subheading (screenshotted both steps).
  - Mocked `**/auth/v1/verify**` to fail (403, a realistic "expired or
    invalid" Supabase error body): submitting a wrong code shows that
    exact error message inline and the code step stays interactive (not a
    dead end) — screenshotted.
  - Clicked "← Use a different email" from the errored code step and
    confirmed it lands back on the email step's own heading, not a blank
    or broken state.
  - Re-mocked `**/auth/v1/verify**` to succeed (200, a realistic session
    payload), submitted a code, and used `page.waitForURL` (not just "no
    error appeared") to confirm the browser actually navigated to `/`.
  - Read the real request bodies Playwright's route interception
    captured, not just the responses: the OTP-send request body contains
    `"create_user": true` (`shouldCreateUser: true`'s wire form), and the
    verify request body contains `"email"`, `"token"`, and `"type":
    "email"` exactly — direct confirmation that the two Supabase calls the
    task specified are the two calls actually being made, not just that
    the UI looks right.
  - Confirmed `app/auth/callback/page.jsx` has zero diff (`git diff --stat`
    on that one file) before committing, since the task was explicit about
    leaving it alone.
  - Stopped the test server and left no mock processes running afterward.

### Session 15 follow-up: users still receiving a magic link, not a code — not a code bug

After this shipped, real users reported still getting a clickable magic
link by email instead of a 6-digit code. Investigated whether
`signInWithOtp`'s call shape was somehow still triggering link mode
(the specific hypothesis raised: maybe an explicit `emailRedirectTo:
undefined` was needed) — it isn't, and it wouldn't have helped. Confirmed
directly from `@supabase/auth-js`'s own installed source
(`node_modules/@supabase/auth-js/dist/module/GoTrueClient.js`, the
`signInWithOtp` doc comment):

> Magic links and OTPs share the same implementation. To send users a
> one-time code instead of a magic link, modify the magic link email
> template to include `{{ .Token }}` instead of `{{ .ConfirmationURL }}`.

**There is no `signInWithOtp` option, for email, that chooses between a
link and a code** — the API call this app makes is already correct and
identical either way. What actually determines which one a user receives
is which template variable the Supabase project's own email template
uses, and that's dashboard configuration, not application code. Since
this repo's tooling has never had a way to touch the live Supabase
project directly (same reason RLS policies and seed data have always been
handed to the user as SQL to run manually, since Session 9), this is the
same category of fix, just in the dashboard's Email Templates screen
instead of the SQL editor.

**No code was changed to "fix" this** — there was nothing to fix in
`lib/auth.js`. Only added a comment there flagging this exact confusion
for the next person who investigates it as a code bug, so it doesn't get
re-litigated. **The actual fix, for the user to do in the Supabase
dashboard**:

1. Go to the project's dashboard → **Authentication** → **Email
   Templates** → **Magic Link**.
2. The default template body includes something like:
   ```html
   <h2>Magic Link</h2>
   <p><a href="{{ .ConfirmationURL }}">Log In</a></p>
   ```
3. Replace `{{ .ConfirmationURL }}` with `{{ .Token }}` (and update the
   surrounding copy so the email reads sensibly as "here's your code"
   rather than "click this link") — e.g.:
   ```html
   <h2>Your sign-in code</h2>
   <p>Enter this code to sign in: <strong>{{ .Token }}</strong></p>
   ```
4. Save. No redeploy of this app is needed — this only affects what
   Supabase's own auth service puts in the email, not anything this
   codebase controls.

This is the one Supabase-project-level setting this app's whole OTP flow
(Session 15) depends on and had no way to verify from inside this sandbox
(no route to `*.supabase.co`, same limitation as every Supabase-touching
session since Session 9) — worth double-checking first if a future report
of "getting a link instead of a code" comes in again, before assuming it's
a regression in `app/auth/page.jsx` or `lib/auth.js`.

## Session 16

Reverted Session 15's email-OTP flow back to the original magic link.
Turned out the Session 15 follow-up's diagnosis was right about the
*mechanism* (link vs. code is a Supabase email-template setting, not a
`signInWithOtp` option) but the actual constraint runs deeper than "go
edit the template" — **this project's Supabase project is on the free
plan without custom SMTP, and free-plan projects can't edit email
templates at all** (that editor is gated behind a paid plan, or requires
bringing your own SMTP provider so Supabase isn't the one sending the
email). So the dashboard fix documented in the Session 15 follow-up isn't
actually available to this project right now — the only sign-in email
Supabase can currently send here is whatever the default, unmodifiable
Magic Link template produces, which is a link. Reverting to match that
constraint, rather than continuing to build UI around an email shape this
project's Supabase plan can't produce, was the only option that leaves
the app actually working end to end for a real user today.

- **`lib/auth.js`**: `signInWithEmail` reverted to
  `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo:
  \`${window.location.origin}/auth/callback\` } })` — back to exactly
  Session 13's original call shape (Session 15's `shouldCreateUser: true`
  was dropped along with `emailRedirectTo`'s removal; `shouldCreateUser`
  defaults to `true` when omitted per `@supabase/auth-js`'s own source, so
  this is behaviorally identical to Session 13, not just visually
  similar — confirmed directly, not assumed, see "Fully working end-to-
  end" above). Removed the `verifyOtp` export entirely — Session 15 added
  it for the code step's verification call, and nothing calls it anymore
  once that step is gone; left as dead code it would only invite a future
  session to wonder whether it's still wired to something.
- **`app/auth/page.jsx`**: rebuilt back to a single `status` state
  (`idle`/`loading`/`success`/`error`) instead of Session 15's `step`
  state — the `"code"` branch, the 6-digit input, `handleVerifyCode`,
  `handleUseDifferentEmail`, and the `useRouter` import (only needed for
  the code step's post-verify redirect) are all gone. The email step's
  copy reverted to "We will send a magic link to your email" and "Send
  magic link" (from Session 15's "6-digit code"/"Send code" wording).
  - **The success screen intentionally did not revert to Session 13's
    original bare-bones version.** Between Session 15 and this session, an
    intermediate fix (documented in this file as the "Session 14
    follow-up") had added a "← Back to home" link and a same-device note
    to that exact screen, specifically because the original had no way
    out. Session 15 removed that screen entirely (replaced by the code
    step), so reverting *to* Session 15 naturally means reverting *past*
    that fix too unless it's deliberately re-added — which it was, here,
    since simply restoring Session 13's version verbatim would silently
    reintroduce a dead end that a previous task explicitly asked to be
    fixed. This wasn't asked for explicitly this time, but dropping a
    previously-requested, still-relevant fix as an unannounced side effect
    of an unrelated revert would have been a worse outcome than keeping
    it — flagged here, and to the user directly, rather than done
    silently.
  - The success message itself is exactly what was specified: "Check your
    email — we sent you a sign in link," not the old "...a magic link to
    `<email>`" wording — the email address is no longer echoed back in
    the success copy (a small, deliberate difference from Session 13's
    original; the task's quoted message didn't include a place for it,
    and the message reads completely without it).
- **`app/auth/auth.module.css`**: removed `.codeInput` (Session 15's
  6-digit field styling, unused now) as dead CSS. Restored `.success`,
  `.successIcon`, and `.successText` (removed as dead code in Session 15,
  needed again now) — `.successNote` and `.secondaryAction` had never
  actually been removed (the "back to home"/same-device fix they style
  survived, conceptually, through the Session 14-follow-up → Session 15 →
  Session 16 chain even though the screen itself was deleted and rebuilt
  twice in between), so those two just needed to be referenced by the
  restored JSX again, not recreated.
- **`app/auth/callback/page.jsx` was not touched**, per the task —
  confirmed with `git diff --stat` on that one file showing no changes,
  same check performed (and passed) in Session 15 for the same file.
- **Verified with a real production build and browser**, same established
  pattern as every prior auth-related session:
  - `next build` succeeds with no new errors.
  - Mocked `**/auth/v1/otp**` to succeed: submitting an email produces the
    exact success text "Check your email — we sent you a sign in link"
    (asserted on the literal rendered string), with zero code-input
    elements present anywhere on the page (asserted a `0` count for the
    numeric-input selector Session 15's code step used, not just "it
    looks like the code step is gone").
  - Confirmed the "← Back to home" link's `href` is `/`.
  - Confirmed the actual outgoing request body for the sign-in call:
    `shouldCreateUser` isn't explicitly set in this codebase anymore, and
    the real wire body still shows `"create_user": true` — matching
    `@supabase/auth-js`'s documented default, confirming the revert is a
    genuine behavioral match to Session 13, not merely a visual one.
  - Confirmed `app/auth/callback/page.jsx`'s diff is empty before
    committing.
  - Stopped the test server afterward, no processes left running.

## Session 17

A full project audit, done before considering Phase 4 (auth, Sessions
13–16) closed — no application code changed. Read every file in `app/`,
`components/`, and `lib/` directly from disk (25 source files total, plus
`next.config.mjs`/`jsconfig.json`/`package.json`/`.gitignore`), rather than
trusting the "Current State" section's accumulated Session 13–16 patches
to still be accurate, and rewrote that section from the ground up.

- **What changed in `PROJECT.md`**: the "Current State — Handoff Audit"
  section (previously patched incrementally across Sessions 13–16, which
  had left it correct but fragmented — lots of parenthetical "(Session
  13; updated Session 15/16)" annotations layered on top of each other)
  was rewritten as one coherent reference: a complete file-by-file
  inventory (every file in `app/`/`components`/`lib`, confirmed against
  the actual files, not carried forward from memory), a full component
  prop reference for all 13 components, the complete design-token list
  from `globals.css`, the full Supabase schema/RLS/seed-data block
  (unchanged content, reorganized presentation), and a "Phase 5+ roadmap"
  replacing the old "Suggested next phase (Phase 4+)" heading now that
  Phase 4 is being closed out.
- **One real, previously-known-but-easy-to-lose issue was re-confirmed
  and given a permanent, prominent home in "Known issues" instead of
  being buried in a Session 13 aside**: `--green`/`--green-soft` are
  referenced 13 times across `app/submit/submit.module.css` (confirmed via
  `grep -c`) and are still not defined anywhere in `globals.css`'s
  `:root` (confirmed via a second `grep` finding nothing) — every one of
  those CSS declarations has been silently dropped by the browser since
  whichever session first wrote them, the same failure class as the real
  (and actually fixed) Session 12 thumbnail-CSS bug. This was flagged
  once, in passing, in Session 13's log entry, and had no line in "Known
  issues" or "Suggested next phase" until this audit — meaning a session
  skimming only the Current State section (the documented, intended way
  to pick up this project) could easily have missed it entirely. Not
  fixed here (this session made no code changes, by design — an audit
  that quietly starts fixing things it finds isn't an audit anymore), but
  now has a specific "Known issues" entry with the exact fix.
- **Nothing else materially inaccurate was found.** Specifically checked
  and confirmed still true by reading the actual code rather than
  assuming: both diagnostic `console.log` blocks are still present
  (`app/arc/[slug]/page.jsx` line ~262, `app/submit/page.jsx` lines
  181/187/208); `lib/auth.js` exports exactly `signInWithEmail`,
  `signOut`, `getSession` (no leftover `verifyOtp`); `app/auth/page.jsx`
  is genuinely single-step (no leftover `step` state or code-input JSX);
  `app/auth/callback/page.jsx` matches what every prior session's "zero
  diff" check already implied; `lib/supabase.js`'s `getArcContent` select
  list includes `submitted_by`; `ContentCard.jsx` and
  `ContentCard.module.css` both have the Session 14 `submittedBy`/
  `YoursBadge`/`.compactYours` wiring; and no file exists in `app/`,
  `components/`, or `lib/` that wasn't already documented somewhere in
  this file.
- **Confirmed clean end state**: `next build` succeeds with no new errors
  (same route table as Session 16 — this session touched no application
  code). `git status` clean, working tree matches `origin/claude/
  aniindex-arc-page-nextjs-wwizd5` after pushing (this is the default
  branch Vercel deploys as Production — see "Confirm all changes are
  pushed" in this session's own closing check).

## Session 18

Phase 5 begins — a first pass at a no-auth community quality-control layer
on top of `content_items.status`/`confirmation_count`, in four parts. (This
task was framed to the assistant as "Session 15"; that number was already
taken by the real Session 15 above, so this is logged as Session 18 to
keep the log unambiguous — see the note at the top of the file.)

**Part 1 — cleanup.** Removed both items Session 17's audit had flagged
and left unfixed on purpose (an audit that fixes things it finds isn't an
audit): the `[arc/[slug]] diagnostic:` `console.log` in
`app/arc/[slug]/page.jsx`, and the three `[submit] ...` logs in
`app/submit/page.jsx`'s `handleSubmit`. Added `--green: #6AF0A8;` and
`--green-soft: rgba(106,240,168,0.14);` to `globals.css`'s `:root` — the
exact literal color that was already in informal, consistent use
throughout `submit.module.css`'s own border rules — so all 13
`var(--green...)` call sites in that file (`.completedCheck`,
`.stepDotDone`, `.stepLabelDone`, `.stepLineDone`, `.charChipConfirm`,
`.submitSuccess`, etc.) resolve to a real color instead of silently
dropping, first flagged all the way back in Session 13.

**Part 2 — pending review badge.** `lib/supabase.js`'s `getArcContent`
already selected `id` and `status` per row (no select-list change needed);
`app/arc/[slug]/page.jsx`'s `buildBeatSections` now threads both through
to each item object it hands to `ContentCard`. `components/ContentCard.jsx`
gained an `id`/`status` prop pair and, in its default (tall) render path
only: when `id` is present and `status === "pending"`, a
`.pending-badge` span ("⏳ Pending review") renders in the exact slot
`YoursBadge` would otherwise occupy — replacing it, not stacking with it,
and with no auth check of any kind, matching the task's "any pending item
shows the badge regardless of who submitted it." A real (`id`-bearing)
non-pending item still falls through to the existing `YoursBadge` logic
unchanged. Hardcoded fallback cards and the `/submit` wizard's live
preview never pass an `id`, so this UI can never appear on them — same
"omit rather than fabricate" convention this project has used since the
Yours badge (Session 14).

**Part 3 — confirm placement.** Added `confirmContentItem(id)` to
`lib/supabase.js`: selects the row's current `confirmation_count`/`status`;
no-ops (returns the current state unchanged) if `status` isn't `'pending'`,
so a stray duplicate click or a confirm on an already-confirmed/flagged
item can't double-count; otherwise increments the count by 1 and, once it
reaches 2, sets `status: 'confirmed'` in the same update. This is a plain
select-then-update, not one atomic SQL statement — a genuine (and
accepted, documented) race exists if two confirms land on the same row at
the same instant, the same style of trade-off this project already
accepted for `og-fetch`'s SSRF guard. `app/api/confirm/route.js` is a thin
POST wrapper: validates the body has an `id`, calls
`confirmContentItem`, returns its result or a 400/500 with `{ error }`.
`components/ConfirmButton.jsx` is a new client component nested inside
`ContentCard`, shown only alongside the pending badge (real, pending items
only); its click handler calls `preventDefault`/`stopPropagation` first,
since the whole card is itself an anchor tag pointing at `sourceUrl` — an
unguarded click would otherwise also navigate away. Tracks
`idle | loading | done | error` locally and renders "✓ Confirmed" once
the request succeeds.

**Part 4 — flag.** Added `flagContentItem(id)` to `lib/supabase.js` — an
unconditional `status: 'flagged'` update, no threshold, no auth, unrelated
to the confirm counter. `app/api/flag/route.js` mirrors `/api/confirm`'s
route shape exactly. `components/FlagButton.jsx` mirrors `ConfirmButton`'s
client-component pattern (same `stopPropagation` requirement, same local
status states, renders "🚩 Flagged" once done) and appears on every real
(`id`-bearing) card regardless of status, not just pending ones.
`getArcContent`'s existing `.in('status', ['confirmed', 'pending'])`
allowlist (unchanged from Session 10) already excludes `'flagged'` rows —
no code change was needed there beyond a clarifying comment, since
`'flagged'` was simply never in the allowed set to begin with.

**The RLS problem, and how it was solved.** Both new writes hit a real
blocker documented since Session 10/11: **no `UPDATE` policy exists on any
table**, so a plain `anon`-role `PATCH` against `content_items` would be
rejected by Postgres before ever reaching the app's logic. Rather than add
a `PUBLIC` `for update using (true)` policy with no other constraint (which
would let anyone rewrite *any* column on *any* row, including
`source_url`/`title`/`submitted_by`), the fix is two pieces of new SQL,
both handed to the user to run manually per this project's established
"SQL is reviewed and run manually" convention (see the Database schema
section above, "Not run yet"): `grant update (confirmation_count, status)
on content_items to anon, authenticated` (Postgres enforces column-level
privileges independently of and before RLS — this is what actually stops
any other column from ever being written, regardless of what the policy
below says) plus a genuinely `PUBLIC`, `using (true)` update policy (the
task explicitly requires no auth for either action, so this is the correct
scope here, not an accidentally widened one — see the schema section's own
reasoning for why this differs from the earlier `PUBLIC`-vs-`anon`
lesson). **This SQL has not been run against the live Supabase project by
this session** — until it is, `/api/confirm`/`/api/flag` are wired
correctly (see verification below) but fail against the real database.

**Verification.** This sandbox still can't reach `*.supabase.co` (see
"Known issues"), so this session built a fuller local mock PostgREST
server than prior sessions' — covering `arcs`/`beats`/`content_items` GET
with the actual filter/select shapes `lib/supabase.js` sends, plus
`content_items` PATCH — and drove everything through a real `next dev`
server pointed at it via `NEXT_PUBLIC_SUPABASE_URL`, over real HTTP, not
just unit-level function calls. Seeded three rows (id 501 `pending`/
`confirmation_count: 0`, id 502 `confirmed`, id 503 `flagged`) and
confirmed: the arc page's real render showed the pending badge + confirm
button + flag button on 501, no pending badge/confirm button but a flag
button on 502, and card 503 didn't render at all; confirming 501 twice via
`POST /api/confirm` produced `confirmationCount: 1` (still `pending`) then
`confirmationCount: 2, status: "confirmed"`, a third call was a no-op
(confirmed via the mock's own request log — no further `PATCH` sent); a
fresh fetch of the arc page after that showed zero remaining pending
badge/confirm button for card 501, proving the UI reflects a genuine DB
write on the next load rather than just the button's own local state;
flagging 502 produced `status: "flagged"`; and a confirm call with no `id`
correctly returned a 400. Full detail in "Fully working end-to-end" #11
above. `next build` succeeds with both new routes present in the route
table (`/api/confirm`, `/api/flag`, both dynamic/`ƒ` as expected for a
route handler).

## Session 19

Bug-fix session. Two bugs were reported against Session 18's quality
control layer in production: (1) clicking "Confirm placement" didn't
persist — the pending badge stayed, and a page refresh reverted the card
back to `pending`; (2) clicking the flag icon appeared to do nothing, and
the card never disappeared. Both were reported with the same suspected
cause: a permissions error from the Session 18 grant/policy SQL not
actually being in effect, silently swallowed by the API routes.

**Diagnosis.** Re-read `confirmContentItem`/`flagContentItem` in
`lib/supabase.js` and `app/api/confirm/route.js`/`app/api/flag/route.js`
line by line. The routes themselves were not silently swallowing
anything — a thrown Supabase error already propagated to a `500 { error }`
response — but neither route nor either function ever logged anything
to the server console, so even a real failure would have been invisible
in Vercel's function logs, exactly as reported. More importantly, a
second, more fundamental problem surfaced on closer inspection of what
`confirmContentItem`/`flagContentItem` actually did after their `.update()`
call: **neither chained a `.select()`, so neither ever checked whether the
update actually matched any rows.** This matters because of a genuine
Postgres RLS behavior this project hadn't exercised before: **an `UPDATE`
blocked by row-level security doesn't raise a permission error — it
silently matches zero rows**, the same way a `SELECT` a role can't see
just returns no rows instead of erroring. Supabase's `anon`/`authenticated`
roles already have table-wide `UPDATE` privilege via the schema's default
grants (independent of RLS), so even without Session 18's own
`grant update (confirmation_count, status)` having been run, the actual
blocker was always going to be the missing `UPDATE` policy — and a missing
policy fails exactly this way: quietly. Session 18's functions returned
`{ id, confirmationCount: newCount, status: newStatus }` /
`{ id, status: 'flagged' }` unconditionally after a no-error `.update()`
call, which is precisely why both bugs looked like "the API call succeeds
but nothing changes" from the outside — because the API genuinely didn't
know anything had failed. This also meant a comment written in Session 18
(that a missing grant/policy would produce a hard "permission denied for
column" error) was a real, previously untested assumption, and it was
wrong — corrected in the Database schema section above.

**Fix.** Both functions in `lib/supabase.js` now chain
`.select('...').maybeSingle()` after their `.update()` call.
`.maybeSingle()` resolves to `null` (no error) when zero rows come back —
exactly the shape of an RLS-blocked write — so both functions now check
`if (!updated)` explicitly and, when true, `console.error` a diagnostic
message (naming the id and pointing directly at the Session 18/19
grant/policy SQL as the likely cause) before throwing a real `Error`,
which the route handlers turn into an honest `500`. Both route handlers
(`app/api/confirm/route.js`, `app/api/flag/route.js`) also gained their own
`console.error(...)` in the `catch` block, logging the full error before
responding — intentional, permanent operational logging (explicitly not
the kind of temporary debug log Session 18 removed elsewhere), so a real
failure is now visible in Vercel's function logs at two levels of detail.

Making `flagContentItem`'s new `.select()` actually useful uncovered a
second, smaller issue: Postgres RLS filters `UPDATE ... RETURNING` through
the table's `SELECT` policy applied to the row's *new* values, and
`'flagged'` was never in `"Public read access on content_items"`'s
allowlist — so even a fully successful flag would have returned an empty
`RETURNING` result, indistinguishable from a blocked one. Fixed with a new
piece of SQL, `alter policy "Public read access on content_items" ...
using (status in ('pending', 'confirmed', 'flagged'))` — this only affects
what a direct query against `content_items` can read; `getArcContent`'s
own application-level `.in('status', ['confirmed', 'pending'])` filter
still excludes flagged rows from the arc page exactly as before. This SQL,
plus a diagnostic query to check whether all of the Session 18/19 SQL has
actually been applied, are both documented in the Database schema section
above — both handed to the user to run manually, per this project's
established convention; neither has been confirmed run against the live
project by this session.

Separately, while reviewing `FlagButton.jsx` for why "clicking flag does
nothing" specifically (as opposed to "confirm doesn't persist," which at
least reports an error state), found a real, independent UI bug: unlike
`ConfirmButton`, `FlagButton`'s `error` state fell through to render the
exact same plain 🚩 icon as its `idle` state — so even server-side logging
aside, a failed request was never visible to the person clicking it. Fixed
to render a distinct "⚠" with its own `title`/`aria-label` on error,
matching `ConfirmButton`'s existing `idle | loading | error | done` pattern.

**Verification.** Extended the Session 18 mock PostgREST server (still the
only option from this sandbox — see "Known issues") with a fourth
`content_items` row (id 504) whose `PATCH` handler deliberately returns a
200 with zero rows, modeling the exact wire-level shape of a real
RLS-blocked `UPDATE` that this mock had no way to simulate before (a
limitation now called out explicitly in "Fully working end-to-end" #11).
Confirmed: a confirm/flag against this row now returns a `500` with the
new diagnostic message, and the matching `console.error` line appears in
the server log naming the id and the likely cause — reproducing, then
fixing, the exact silent-failure shape the bug report described. Also
re-ran the full Session 18 happy-path suite (confirm a real pending item
twice → `confirmed`, third call is a no-op, arc page reflects it on the
next render; flag a real item → disappears from the next render; missing
`id` → `400`) to confirm nothing regressed. Full detail in "Fully working
end-to-end" #12. `next build` succeeds with no new errors.

## Session 20

Second bug-fix session. Two issues reported: (1) confirming genuinely
persisted (Session 19's fix worked — a page refresh correctly showed the
badge gone), but the arc page's own UI didn't update until that refresh;
(2) the flag button still appeared completely non-functional — no visible
change, no card removal.

**Issue 1 — optimistic confirm UI.** The pending badge and the confirm
button live in two different places inside `ContentCard`'s markup (the
badge overlays the thumbnail; the button sits in a `.card-actions` row
under the tags), both driven by the same server-supplied `status` prop.
Hiding both instantly, without a reload, meant that piece of state had to
move client-side and be owned somewhere both pieces of markup could read
it — the natural place is `ContentCard` itself. Converted `ContentCard` to
a client component (`"use client"`), added a `useState` seeded from the
`status` prop, and gave `ConfirmButton` a new `onConfirmed` callback prop
that fires after a successful `/api/confirm` response; `ContentCard` wires
this to flip its local status to `"confirmed"`. `isPending` now reads the
local state instead of the raw prop, so both the badge and the button
disappear together the instant the click succeeds. This is deliberately
optimistic and can diverge from the real row: a single confirmation
genuinely leaves `content_items.status` as `'pending'` in the database
until a second, distinct confirmation lands (`confirmContentItem`'s
existing two-confirmation threshold, unchanged) — the badge disappearing
means "you confirmed it," not "the row is now `'confirmed'`" — documented
explicitly in "Partially working" above so it isn't mistaken for a
regression later. Converting `ContentCard` to a client component required
checking every place that renders it: `app/submit/page.jsx` already was a
client component, and `app/search/page.jsx` (a Server Component) already
rendered it directly for its hardcoded `TOP_CONTENT` cards — a Server
Component rendering a Client Component descendant is normal, supported
App Router behavior, so this didn't need any changes elsewhere.

**Issue 2 — lifting flagged-item state to `BeatSection`.** `ContentCard`
hiding itself internally on a successful flag wasn't enough — the task
specifically asked for the *card list* to filter flagged items out, which
`ContentCard` has no way to do to its own siblings. Converted
`BeatSection` to a client component holding a `flaggedIds` state (a
`Set`), added an `onFlagged(id)` callback threaded from `BeatSection` →
`ContentCard` (passed straight through, unmodified) → `FlagButton`, which
now calls it after a successful `/api/flag` response. `BeatSection`
filters `beat.items` against `flaggedIds` before rendering, so a flagged
card disappears from the grid immediately, and recomputes the displayed
"N items" count from the same filtered list (previously a static,
server-computed `beat.count` that would have gone stale the moment a card
was flagged away). Also fixed each card's React `key` from the array index
to `item.id ?? i` — required once the rendered list can shrink from the
middle: an index-based key would let React reuse a removed card's DOM
node and in-progress component state (e.g. a `ConfirmButton` mid-request)
for whatever card next slid into that index, a real (if narrow) bug this
change heads off before it was ever hit in practice.

**Flag route also got more robust, independent of the UI fix.** While
tracing why flag might still fail even after Session 19, re-examined
`flagContentItem` (`lib/supabase.js`) and found its Session 19 verification
technique — `.select().maybeSingle()` after the update — depended on a
second piece of SQL (an `ALTER POLICY` widening the public read policy to
include `'flagged'`) that Session 19 documented as required but that could
easily be the one piece of a multi-statement SQL block a user runs
manually and doesn't get to. That would produce exactly this session's
reported asymmetry: confirm's outcomes (`'pending'`/`'confirmed'`) were
already covered by the *original* read policy, so confirming would work
fine, while a genuinely successful flag's `RETURNING` would still come
back empty (Postgres RLS filters `UPDATE ... RETURNING` through the
SELECT policy against the row's *new* value) and get misreported as a
blocked write. Rather than lean harder on users running every statement in
a multi-part SQL block correctly, rewrote `flagContentItem` to verify
success without needing the read policy widened at all: it now reads the
row's status before the update and again after, both times using the
*same*, already-required read policy. A genuinely successful flag makes
the row invisible on the second read (`'flagged'` was never in the
allowlist); a write blocked by RLS leaves the row visible and unchanged on
both reads. This needs no SQL beyond the Session 18 grant + update policy
— identical to what `confirmContentItem` already required — so an
`ALTER POLICY` statement Session 19 introduced is retracted (see the
Database schema section above for the retraction and why widening that
policy is better left for whenever the "moderation/flagged-items view" on
the Phase 5+ roadmap is actually built, rather than bundled into this fix).

**Verification.** Since this is genuinely interactive, client-side-only
behavior (a DOM update with no full-page navigation), `curl`ing the HTML
can't observe it — this session installed Playwright temporarily
(`npm install --no-save playwright`, confirmed via `git status` before and
after that `package.json`/`package-lock.json` never changed, then
uninstalled again at the end) and drove a real headless Chromium instance
against `next dev` pointed at an extended version of the Session 18/19
mock PostgREST server. Also fixed a gap in the mock itself: its single-row
`GET .../content_items?id=eq.X` handler previously returned whatever was
in memory unconditionally, which can't exercise `flagContentItem`'s new
before/after visibility check — updated it to only return a row whose
status is `'pending'`/`'confirmed'`, mirroring the real, unwidened
"Public read access on content_items" policy. Confirmed all of the
following without any page reload: clicking "Confirm placement" on a real
pending card made its pending badge and the button itself both vanish in
the same tick (DOM query counts went from 1/1 to 0/0 inside that card's
own container); the underlying write was real (the mock's request log
showed the actual `confirmation_count: 1` `PATCH`, and a subsequent full
reload correctly still showed the card pending, matching the documented
one-confirmation-isn't-two gap above); clicking a real card's flag button
removed that exact card from the DOM and decremented the beat's displayed
item count in the same render; and — using the still-present, deliberately
RLS-blocked test row (id 504) from Session 19 — flagging a row whose write
genuinely fails left the card in place and switched its flag button to the
Session 19 "⚠" error glyph, confirming the failure path is still correctly
distinguishable from success in the browser, not just in the raw API
response. `next build` succeeds with no new errors. Full detail in "Fully
working end-to-end" #13.

## Session 21

Third bug-fix session, and the shortest one: one issue reported, one root
cause, one fix. Flagging visibly failed — the button showed Session 19's
"⚠ Flagging failed — try again" error state — but the flag was genuinely
persisting to the database (confirmed by refresh: the card was gone on
reload). The user supplied the missing piece this session couldn't get on
its own: Vercel's actual function logs, showing a real Postgres `42501`
(`insufficient_privilege`) error.

**Diagnosis.** `flagContentItem` (as of Session 20) made three Supabase
calls: an initial select (confirm the row exists/is readable), the update
itself, and a second select afterward to verify the update actually took
effect — reasoning that if the row's status was genuinely now `'flagged'`,
that second select would find nothing (RLS hides it, since `'flagged'`
isn't in the read policy's allowlist), and if the write had been silently
blocked instead, the row would still be there. Given the user's report —
write persists, but the function still throws — the middle call
(`update()`) had to be succeeding (matching "genuinely persists"), and the
*verification* select had to be what was throwing (matching "still reports
failure"). This meant Session 20's entire premise — that reading a row
outside the read policy's allowlist behaves the same way Session 19's
blocked-`UPDATE` did (silent, zero rows, no error) — doesn't hold for a
plain `SELECT` against this project's actual Supabase configuration. It
raises a real, hard permission error instead. Both assumptions had been
reasonable extrapolations from Session 19's one confirmed data point, and
both turned out to be checking a premise that was never actually true for
this specific query shape.

**Fix.** Removed the post-update verification select from `flagContentItem`
entirely, per the direct instruction this session was given: trust
`update()`'s own `{ error }` result, and treat "no error" as success
regardless of what (if anything) the row looks like afterward. The
function now makes exactly two Supabase calls — the initial existence
check, and the update — down from three, and never touches the row again
once it's flagged. This is a real, acknowledged trade-off, documented
prominently in "Partially working" and "Known issues" above: it
reintroduces a narrower version of Session 19's original bug — a write
silently blocked by a missing/misconfigured RLS policy would now be
misreported as successful, since nothing checks anymore — traded
deliberately for fixing a confirmed, reproducible production bug that the
verification step itself was causing. `confirmContentItem` is unaffected
and unchanged: its own verification (`.select().maybeSingle()` chained
directly onto the *same* update statement, not a separate follow-up query)
never hits this problem, because its two possible outcomes (`'pending'`,
`'confirmed'`) are always covered by the read policy — only flagging's
`'flagged'` outcome ever wasn't.

**Verification.** Updated the local mock PostgREST server (still this
sandbox's only option — see "Known issues") to reflect the corrected
understanding: its single-row `GET .../content_items?id=eq.X` handler now
returns a genuine `42501`-style error for a row whose status isn't covered
by the read policy, replacing the earlier (Session 20) simulation that
returned a silent empty result instead. Against the rewritten
`flagContentItem`, confirmed: flagging a normal item now succeeds cleanly
with exactly one `GET` and one `PATCH` logged by the mock (previously two
`GET`s and a `PATCH`), and the write persists through a real reload;
flagging the still-present, deliberately-blocked test row (id 504) now
returns a **false success** (the accepted trade-off, confirmed directly —
the mock's own log shows the write was never applied, yet the API returns
`200`). Re-ran the Session 20 browser-driven check (Playwright, installed
temporarily and fully removed afterward) to confirm the client-side
optimistic removal still works end to end with the simplified backend:
clicking a real flag button still removes the card from the page
instantly, no reload. `next build` succeeds with no new errors.

## Session 22

Full project audit, second one after Session 17. No code changes — this
was requested and executed as a documentation-only pass, same convention
as Session 17.

Re-read every file in `app/` (17 files), `components/` (17 files), and
`lib/` (3 files) directly from disk, plus all 4 root config files
(`next.config.mjs`, `jsconfig.json`, `package.json`, `.gitignore`) —
nothing carried forward from memory of Sessions 18–21's incremental
patches to the "Current State" section. Ran a fresh `grep` sweep for
`console.*`/`TODO`/`FIXME`/`XXX` across the whole `app/`/`components/`/
`lib/` tree: every remaining `console.*` call is intentional, already-
documented operational logging (the two `lib/supabase.js` module-load
logs, `confirmContentItem`/`flagContentItem`'s per-failure logs, both API
routes' catch-block logs, `NavAuth`'s sign-out failure log) — no leftover
temporary debug logging exists anywhere in the codebase. The only two
`TODO`s are the long-standing, already-tracked hardcoded-arc-list notes on
the search and series pages. `rm -rf .next && npm run build` succeeds
cleanly with no new errors, same route table as Session 21.

Rewrote the "Current State — Handoff Audit" section from scratch (not
patched incrementally this time, matching Session 17's own precedent for
a full-audit session) — it had accumulated four rounds of "(Session 18)",
"(Session 19)", "(Session 20)", "(Session 21)" annotations layered on top
of each other since Session 17, in the same fragmented style Session 17
itself was written to clean up. The rewrite consolidates all of that into
one coherent reference: a complete file-by-file inventory confirmed
against actual current file contents (including noting `YoursBadge.jsx`'s
own comment now slightly undersells that `ContentCard` became a client
component in Session 20 — a stale comment, not a behavioral bug, left
as-is since this was a documentation-only session), the full current
Supabase schema/RLS/seed-data picture with every policy's actual
confirmed-vs-presumed status stated plainly, a full "what's real vs.
hardcoded" pass per page, "fully working end-to-end" consolidated instead
of listing 14 separate historical verification entries, "partially
working," "known issues," "explicitly not built," and a renamed "Phase
6+ roadmap" now that Phase 5 (Sessions 18–21) is considered stable.

**One real, substantive correction made in this audit, not just a
reorganization**: the Session 18 grant + `UPDATE` policy SQL had been
described ever since Session 19 as "not run yet" / "hasn't been
confirmed run," which was accurate at the time but stale by this session
— real production bug reports across Sessions 19 and 21 both showed
confirm and flag writes genuinely persisting to `content_items`, which is
only possible if this SQL is actually live. This audit updates that
language to "presumed applied, based on strong behavioral evidence,
though never directly confirmed via the diagnostic query" — a more
accurate current state than the flatly negative framing the file
previously carried forward unchanged across three sessions that had, in
fact, each individually accumulated more evidence it was true. The
formal diagnostic query itself is unchanged and still hasn't been run and
reported back by a human with live access — that gap is now Phase 6+
roadmap item #1 instead of being conflated with "probably not applied."

**Confirmed clean end state**: `git status` clean, working tree matches
`origin/claude/aniindex-arc-page-nextjs-wwizd5` after pushing (the
default branch, which Vercel deploys as Production).

## Session 23

Database-only session — no application code changed. Four new arcs (and
their beats) and two new series were seeded directly via the Supabase SQL
editor, outside this repo/sandbox, and reported back for this file to
record:

- `series`: Attack on Titan (`anilist_id: 16498`) and Chainsaw Man
  (`anilist_id: 146065`). **Correction (Session 26): `146065` was wrong** —
  confirmed live against AniList's API to be an unrelated show ("Mushoku
  Tensei: Jobless Reincarnation Season 2"), not Chainsaw Man at all,
  presumably a data-entry slip in this session's hand-written SQL that
  was never round-tripped through this repo to catch. See Session 26's
  own log entry below for the fix.
- `arcs`: Vs. Mahito Arc (`slug: 'vs-mahito-arc'`, Jujutsu Kaisen, episodes
  14–20), Control Devil Arc (`slug: 'control-devil-arc'`, Chainsaw Man,
  episodes 10–12), The Rumbling Arc (`slug: 'the-rumbling-arc'`, Attack on
  Titan, episodes 88–96), Marley Arc (`slug: 'marley-arc'`, Attack on
  Titan, episodes 64–75).
- `beats`: seeded for all four new arcs, reported verified in Supabase
  with correct per-arc counts. The exact titles/`order_index`/`intensity`
  values were never round-tripped back into this file (they were entered
  and confirmed directly in the Supabase Table Editor) — check there
  directly rather than trusting a reproduction here.

This repo/sandbox has no live Supabase access, so none of this was
independently verified from here — it's recorded on the reporting
session's word, the same trust level this file already extends to any
Supabase state no session working from this sandbox can query directly
(see "Known issues").

**Why this is a smaller change than "seed a second arc" (old Phase 6+
roadmap item 5) sounds like it should be**: `getArcBeats`/`getArcContent`
(`lib/supabase.js`) are the *only* two functions on the arc page that were
ever keyed by `params.slug`, so they immediately resolve real data for all
four new slugs with zero code changes — that part generalizes exactly as
designed. But `app/arc/[slug]/page.jsx` has two other hardcoded values
that were never in scope for those two functions and this seeding doesn't
touch: `ANILIST_SERIES_ID` (always `113415`, Jujutsu Kaisen's AniList id,
regardless of slug) and the `ARC` object (name, episode range, badges,
breadcrumb, stats — always Shibuya Incident Arc's, regardless of slug).
Concretely, as of this session:

- `/arc/vs-mahito-arc` renders real beats/content *and* correct AniList
  series info, purely by coincidence — it's also a Jujutsu Kaisen arc, so
  the hardcoded `ANILIST_SERIES_ID` happens to match.
- `/arc/control-devil-arc`, `/arc/the-rumbling-arc`, and `/arc/marley-arc`
  render real beats/content under Jujutsu Kaisen's AniList description and
  character list (Chainsaw Man's and Attack on Titan's real data exist in
  AniList and are reachable via `lib/anilist.js`, just never requested for
  these slugs) — a genuinely wrong pairing, not a crash or a blank state.
- All five real arcs — including the original `shibuya-incident-arc` —
  still show `ARC`'s hardcoded header verbatim: "Shibuya Incident Arc,"
  "Episodes 38–47," the Shibuya badges/description/stats. This was already
  true before this session for `shibuya-incident-arc` (the header was
  never anything but hardcoded), but this session is what makes the
  mismatch externally visible for the first time on the other four slugs.

None of this is a regression or a new bug in the strict sense — no code
changed, and every hardcoded value behaved exactly as documented before
this session. It's a previously-latent gap (the arc page never derived
its header or its AniList series id from `params.slug`) that direct SQL
seeding was the first thing to make observable. See "Known issues" below
for how this is now tracked, and Phase 6+ roadmap items 5–6 for the fix.

`app/submit/page.jsx`'s `ARC_SLUG` constant is unaffected by this session
and still hardcodes `"shibuya-incident-arc"` — real submissions can still
only ever land on that one arc. The four new arcs have real beats but, by
construction, cannot yet have real `content_items` through the app itself.

## Session 24

Fixes the display-layer mismatch Session 23 exposed (see that session's
own log entry above for the full diagnosis): `app/arc/[slug]/page.jsx`
hardcoded `ANILIST_SERIES_ID` (always `113415`, Jujutsu Kaisen) and the
`ARC` header object (always Shibuya Incident Arc's name/episodes)
regardless of `params.slug`, so 4 of the 5 arcs seeded in Session 23
rendered real Supabase beats/content under the wrong AniList series data
and the wrong page header.

**Code changes**:
- `lib/supabase.js` — added `getArcMeta(arcSlug)`, exported. Selects
  `title, episode_start, episode_end, anilist_series_id` from the `arcs`
  table for a given slug; returns `null` for an unseeded slug (same
  convention as `getArcBeats`/`getArcContent`), rethrows on any other
  error. This is what makes `arcs.anilist_series_id` — a column that has
  existed in the schema since Session 9 specifically so an arc's series
  is "always recoverable even without a join," per that session's own
  note — actually used by the app for the first time.
- `app/arc/[slug]/page.jsx` — the old single `Promise.allSettled` that
  fired both AniList calls and both Supabase calls together no longer
  works, since the AniList calls now depend on `getArcMeta`'s result.
  Split into two sequential steps: first `Promise.allSettled([getArcMeta,
  getArcBeats, getArcContent])` (still parallel with each other — none of
  these three depend on one another, matching the existing pattern), then
  a second `Promise.allSettled([getSeriesById, getSeriesCharacters])`
  once `arcMeta?.anilist_series_id` is known. `ANILIST_SERIES_ID` was
  renamed `FALLBACK_ANILIST_SERIES_ID` and its comment rewritten — it's
  now used only when `params.slug` doesn't match a seeded arc, not as the
  primary source. `arc.name`/`arc.episodes` now come from `arcMeta` when
  present (`Episodes {start}–{end}`, matching the original hardcoded
  string's exact en-dash formatting), falling back to `ARC.name`/
  `ARC.episodes` otherwise. `arcFoundInDb` (governs the intensity
  chart/beat sections) is unchanged — still based on `realArcBeats`/
  `realArcContent` alone, per the task's explicit scope.
- **Deliberately not touched**, per the task's explicit scope (called out
  as Session 18 work, or simply out of scope): `ARC_NAV` (the arc-chip
  strip) is still hardcoded, and `ARC`'s badges/`seasonPart`/`dateRange`/
  `stats` fields still don't vary by slug — only `name` and `episodes`
  were switched to real per-arc data.
- `app/page.jsx` — fixed `TRENDING_ARCS`' Attack on Titan card slug,
  `"rumbling-arc"` → `"the-rumbling-arc"`, to match the arc actually
  seeded in Session 23 (this typo meant the card's link 404'd against the
  real arc — well, fell through to the hardcoded-fallback path, same as
  any unseeded slug — rather than reaching it).

**Verification**: `rm -rf .next && npm install && npm run build` (a fresh
`npm install` was needed — `node_modules` wasn't present at the start of
this session) compiles cleanly with no new errors and the same route
table as Session 22/23 (`next build`'s static/dynamic split for `/arc/
[slug]` is unchanged: still `ƒ` dynamic, as `revalidate = 0` requires).
This sandbox still cannot reach the live Supabase/AniList endpoints (see
"Known issues"), so this is a code-reading/build-time verification only —
nobody has click-tested `/arc/control-devil-arc` or `/arc/marley-arc`
against the live project yet to confirm the correct Chainsaw Man/Attack on
Titan AniList data actually renders. Whoever picks this up next, outside
this sandbox: visit all 5 seeded arc URLs and confirm each shows its own
series' real name/episodes/description/characters, not Jujutsu Kaisen's.

## Session 25

Three bugs reported after live testing of Session 24's work. Two had
clear, verifiable root causes found by direct code reading; the third
(missing beats/content on `/arc/control-devil-arc`) does not, and is
**not confirmed fixed** — see below.

**Bug 1 — `/arc/control-devil-arc` renders no beats/content sections,
page ends after the hero.** Reviewed `getArcMeta`, `getArcBeats`, and
`getArcContent` (`lib/supabase.js`) and the arc page's use of
`arcMeta?.anilist_series_id` — all three query `.eq('slug', arcSlug)`
correctly against `params.slug`, and the AniList id used for
`getSeriesById`/`getSeriesCharacters` is correctly `arcMeta`'s real
`anilist_series_id`, not a hardcoded constant. No logic bug found in
either. The one plausible-but-unconfirmed cause identified and fixed:
`getArcRowBySlug` (used internally by `getArcBeats`/`getArcContent`) and
`getArcMeta` both used `.single()`, which throws — not returns null — if
a slug matches more than one row. This project's `arcs` table is seeded
entirely by hand via the Supabase SQL editor (no migration tool, no
uniqueness enforced at the application layer beyond the schema's own
`unique` constraint on `slug`), so a duplicate-slug insert from a
copy-paste seeding mistake is a real, live possibility this sandbox
cannot rule out. Both functions now use `.limit(1).maybeSingle()`
instead — a duplicate row degrades to "use the first match" rather than
throwing and taking every caller down with it. **Caveat, stated plainly**:
if this *is* the real cause, a thrown `getArcBeats`/`getArcContent`
would have made `arcFoundInDb` false and fallen back to the *hardcoded
Shibuya* beats/content — not rendered nothing — so this fix may not
actually address the reported symptom. Per the task's explicit
instruction, added the requested diagnostic logging instead of just
guessing further: `getArcMeta` now `console.log`s its slug/result/error
on every call (temporary, unlike this file's other permanent operational
logs), and the arc page `console.error`s `getArcBeats`/`getArcContent`'s
rejection reason if either actually rejects. Both are meant to be removed
once Vercel's logs reveal the real cause on the next live test — this
remains an **open bug**, tracked in "Known issues," not closed by this
session.

**Bug 2 — arc nav strip chips ("Vs. Mahito Arc" etc.) not clickable.**
Root cause had nothing to do with the strip's data being hardcoded:
`components/ArcNav.jsx` rendered every chip as a plain `<div>`, with no
`href` at all, real data or not. Fixed by rendering each chip as a real
`next/link` to `/arc/${arc.slug}` (added `text-decoration: none` to
`.arc-chip` in `globals.css`, since no other anchor-styled class in this
codebase relies on a global reset — each sets it individually, e.g.
`.logo`/`.btn`/`.card`). Separately, per the task, also replaced the
strip's hardcoded `ARC_NAV` data: a new `getArcsBySeries(anilistSeriesId)`
(`lib/supabase.js`) fetches every seeded arc for the current arc's
series, and the arc page now passes those as real chips (`{ slug, name,
active }`, `active` set by comparing to `params.slug`) when any exist,
falling back to `ARC_NAV` only when the series has no other seeded arcs.
`ArcNav`'s `count` prop is now optional (previously an unconditional
`.toLocaleString()` call, which would have thrown given a real arc row's
missing `count`) — omitted rather than fabricated, since no per-arc
fan-item-count query exists yet.

**Bug 3 — Chainsaw Man's series page shows no arcs.** Root cause exactly
as suspected: `app/series/[slug]/page.jsx`'s arc list was the same fully
hardcoded `ARCS` placeholder (originally authored for Chainsaw Man,
ironically, per its own Session 8 TODO comment — coincidentally on-brand
but not connected to anything real) regardless of which series was being
viewed, and no Supabase import existed in this file at all before this
session. Fixed by calling the same new `getArcsBySeries(anilistId)`
(`anilistId` is `Number(params.slug)`, since this page's URL segment is
already the real AniList id) and mapping real rows to `ArcList`'s prop
shape (`slug`, `name` ← `title`, `num` ← zero-padded `order_index`),
falling back to `ARCS`/`MORE_ARCS_LABEL` for any series with nothing
seeded. `components/ArcList.jsx` — used by both the search page (still
fully hardcoded) and this one — was made defensive for `count`/`spark`,
neither of which a real arc row has yet: `count` previously called
`.toLocaleString()` unconditionally (would have thrown), and `spark` was
passed straight into `Sparkline` (whose own render maps over `bars`,
which would have thrown on `undefined`). Both are now optional and
simply don't render when absent, matching this codebase's "omit rather
than fabricate" convention (e.g. `YoursBadge`).

**Verification**: `rm -rf .next && npm run build` compiles cleanly, same
route table as prior sessions. This sandbox still has no live
Supabase/AniList access (see "Known issues"), so Bugs 2 and 3's fixes are
verified by direct code reading + build only, not click-tested — and Bug
1 is explicitly **not** verified fixed at all, only investigated. Whoever
picks this up next, outside this sandbox: re-test `/arc/control-devil-arc`
first and check the new diagnostic logs in Vercel regardless of outcome;
then confirm the arc-page nav strip and the Chainsaw Man/Attack on
Titan/Jujutsu Kaisen series pages' arc lists are both real and clickable.

## Session 26

Reported bug: the Chainsaw Man series page (`/series/127230`, reached by
searching "Chainsaw Man") showed no arcs, and the human operator's own
diagnosis was that AniList returns both a manga and an anime entry for
"Chainsaw Man" and the app had the wrong one seeded (`146065`) versus
what search resolves to (`127230`).

**Correcting the record**: this session had live network access to
`graphql.anilist.co` (a plain `curl` from this environment succeeded —
see the updated "Known issues" entry on sandbox network access, since
every prior session assumed this was impossible and that assumption no
longer holds universally). Queried AniList directly rather than trusting
either the human's diagnosis or the existing seed data:

- `127230` → `Chainsaw Man`, format `TV`, type `ANIME`, 2022, 12 episodes.
  The real anime. Not a manga — the human's specific theory ("AniList
  returns a manga and an anime, we seeded the manga") was wrong.
- `146065` (what was actually seeded) → **`Mushoku Tensei: Jobless
  Reincarnation Season 2`**. Not Chainsaw Man in any form — an unrelated
  show. This explains the symptom without needing a manga/anime mixup at
  all: `getArcsBySeries(146065)` (Session 25) correctly found zero arcs,
  because `arcs.anilist_series_id` for `control-devil-arc` was never
  really Chainsaw Man's id to begin with.
- Also spot-checked Attack on Titan's seeded `anilist_id` (`16498`) and
  Jujutsu Kaisen's (`113415`) the same way — both confirmed correct (real
  `TV`/`ANIME` entries for the right shows). Did not find a second
  instance of this bug.
- Also confirmed `lib/anilist.js`'s `SEARCH_SERIES_QUERY` already filters
  `type: ANIME` and the search page already takes `results[0]` — the
  code path that resolves "Chainsaw Man" → `127230` was never buggy.
  Grepped `app/`, `components/`, `lib/` for `146065`/`127230`: zero
  matches outside PROJECT.md itself, so no code needed changing.

**No code was pushed this session** — nothing in the codebase was wrong.
Handed the human operator this SQL to run manually (this project's
established convention — no session has ever had write access to the
live Supabase project):

```sql
UPDATE series SET anilist_id = 127230 WHERE anilist_id = 146065;
UPDATE arcs SET anilist_series_id = 127230 WHERE slug = 'control-devil-arc';
```

Keyed the `series` update off the confirmed-wrong `anilist_id = 146065`
rather than a guessed `slug = 'chainsaw-man'` (the human's own draft),
since this file has no confirmed record of that series row's actual
`slug` value and `146065` is independently confirmed wrong regardless of
what the slug turns out to be.

**Not yet confirmed run.** PROJECT.md's Seed data / Known issues /
`/arc/[slug]` sections above are updated to state the correction is
pending, not applied — whoever picks this up next should confirm
`select anilist_id from series where slug ilike '%chainsaw%';` returns
`127230` (and the matching `arcs` row) before treating this as resolved,
then update those sections to drop the "pending" language.

## Session 27

The human operator ran Session 26's SQL and reported back, verified live
on the production site: `series.anilist_id` for Chainsaw Man is `127230`,
`arcs.anilist_series_id` for `control-devil-arc` is `127230`, searching
"Chainsaw Man" navigates to `/series/127230`, and Control Devil Arc
appears in the series page's arc list. **Marking the Session 26 fix
confirmed** — updated PROJECT.md's Seed data, `/arc/[slug]`, and Known
issues sections to drop the "pending"/"not yet confirmed" language.

**A second, separate open bug also appears resolved by this same live
test**: the operator additionally reported `/arc/control-devil-arc`
"shows correct beats" — the exact symptom Session 25 flagged as an open,
unconfirmed bug (the page previously rendered no beats/content sections
at all). This is a genuinely separate code path from the AniList-id fix
above — `getArcBeats`/`getArcContent` are keyed by `params.slug`, not
`anilist_series_id`, so correcting the series' AniList id shouldn't have
had any mechanical effect on whether beats render. The most likely
explanation: Session 25's `.limit(1).maybeSingle()` change (replacing
`.single()` in `getArcRowBySlug`/`getArcMeta`, to defend against a
possible duplicate-slug row) was the actual fix all along, and this is
the first live confirmation of that. Treating this as confirmed based on
the operator's direct report, since "shows correct beats" is precisely
the previously-missing behavior — flagged clearly in chat in case that
inference is wrong and the bug needs reopening.

**Code changes**: removed both temporary diagnostics added in Session 25
now that the bug they were chasing is confirmed fixed — `getArcMeta`'s
`console.log` (`lib/supabase.js`) and the arc page's two `console.error`
calls for a rejected `getArcBeats`/`getArcContent` (`app/arc/[slug]/
page.jsx`). Removed the two corresponding "Known issues" bullets (the
Chainsaw Man `anilist_id` bug and the open control-devil-arc beats bug)
now that both are confirmed resolved, rather than leaving stale open-
issue text in this file's current-state section.

**Verification**: `rm -rf .next && npm run build` compiles cleanly, same
route table as prior sessions.

## Session 28

Wired the arc page's content tabs (All / Edits & Video / Fan Art /
Discussion / OST & Music), previously decorative — clicking one did
nothing, since `ContentTabs.jsx` rendered plain, non-interactive `<div>`s
and nothing downstream read which tab was "active" beyond a static
`active: true` on the hardcoded `TABS` const.

**A real data mismatch surfaced before any code was written**: the task
specified exact-match filtering against `content_type = 'edit'`/
`'fanart'`/`'discussion'`/`'ost'`, but `app/submit/page.jsx`'s
`CONTENT_TYPE_OPTIONS` — the actual values ever written to real
`content_items.content_type` rows — are `"Edit / AMV"`, `"Fan art"`,
`"Discussion"`, `"Breakdown"`, `"OST / Music"`, `"Other"`. None of those
equal the specified lowercase codes, so exact-match filtering would have
shown zero cards on every tab but "All" against real content. Confirmed
with the human operator before building: normalize/classify real values
into buckets rather than implement literal exact-match.

**Code changes**:
- `components/ArcContent.jsx` (new) — a client component that now owns
  everything from the tab bar through the beat-section list and the
  index note. Necessary because `ContentTabs` and the beat sections
  aren't parent/child in the markup (a `.container` boundary and
  `IntensityChart` sit between them in `app/arc/[slug]/page.jsx`) but
  both need to react to one shared "active tab" state, and the arc page
  itself is a Server Component that can't hold state. Owns `activeLabel`
  state; `classifyTag(tag)` keyword-matches a tag string
  (case-insensitive, checks for `edit`/`amv`, `fan art`/`fanart`,
  `discussion`, `ost`/`music`/`soundtrack`) into one of the 4 buckets or
  `null`; `itemMatchesBucket` coerces `item.contentType` to an array
  (handles both the real single-string case and the hardcoded fallback
  data's multi-tag arrays, same pattern `ContentCard.jsx` already uses)
  and matches if *any* tag classifies into the active bucket. On "All"
  (`activeBucket === null`), every beat section renders unfiltered,
  including zero-item ones — preserves the pre-existing, deliberate
  "empty beat still shows its header" behavior (see `buildBeatSections`'
  own comment in the arc page). On any other tab, each beat's items are
  filtered to matches first, then the whole beat section is dropped if
  none match — satisfies the task's "hide entirely, don't show an empty
  header" requirement without touching that pre-existing "All" behavior.
  `BeatSection.jsx` itself needed no changes — its existing
  `visibleItems.length` count and flagged-item filtering just operate on
  whatever pre-filtered `beat.items` array it's handed, so per-beat counts
  update correctly for free.
- `components/ContentTabs.jsx` — tabs are now real `<button>`s (were
  plain `<div>`s) with an `onClick` calling a new optional `onSelect`
  prop; otherwise unchanged, still just renders whatever `tabs` it's given
  with the `active` flag `ArcContent` computes.
- `app/globals.css` — added `background: transparent; border: none;
  font-family: var(--body);` to `.tab` (a button-style reset, matching
  `.confirm-btn`/`.flag-btn`'s existing pattern) — `cursor: pointer` was
  already there.
- `app/arc/[slug]/page.jsx` — no longer imports or renders `ContentTabs`,
  `IntensityChart`, or `BeatSection` directly; renders `<ArcContent
  tabs={TABS} intensityBeats={intensityBeats} beatSections={beatSections}
  />` instead, passing through the same values it already computed.

**Verification — actually driven in a browser, not just build-checked**:
this environment has Chromium pre-installed
(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`); temporarily installed
`playwright` (`npm install --no-save`, uninstalled before finishing, same
convention as Sessions 20/21 — confirmed via `git status` showing no
`package.json`/`package-lock.json` diff either time), ran `next dev`,
and drove `/arc/<unseeded-slug>` (the hardcoded `BEATS` fallback data,
since this sandbox has no live Supabase credentials) through all 5 tabs:
- **All**: 3 beat sections, 3/4/3 items — unfiltered, matches original.
- **Edits & Video**: same 3 sections, filtered to 1/2/1 items.
- **Fan Art**: same 3 sections, filtered to 1/1/1 items.
- **Discussion**: only "The Sealing" section renders (1 item) — the other
  2 beat sections correctly disappear entirely, confirming the
  hide-when-empty requirement actually works, not just the item-level
  filter.
- **OST & Music**: zero beat sections render (no hardcoded mock item is
  OST-tagged) — screenshotted to confirm this renders as a clean empty
  content area, not a broken layout; nav/hero/tabs/intensity chart/index
  note all still render normally above and below it.
- Clicking back to **All** restores the original 3/4/3 state.
- Active-tab highlighting (the `.tab.active` CSS class) confirmed correct
  at every step via a live DOM query, not just visually.
- No console/page errors attributable to this change (a few unrelated
  `net::ERR_TUNNEL_CONNECTION_FAILED`/404 messages from Google
  Fonts/favicon requests this sandboxed environment can't fully resolve).

This is real content_type data — the mock `BEATS` array's tags (`"AMV"`,
`"Fan art"`, `"Discussion"`, `"Theory"`, etc.) — not live Supabase data,
so the *classification* logic against real submitted values (`"Edit /
AMV"`, `"OST / Music"`, etc.) is still unverified against production.
Whoever picks this up next with live access: submit or check a real
`content_items` row of each `CONTENT_TYPE_OPTIONS` value and confirm it
lands under the tab it's supposed to.

## Session 29

Two-part task. Second part first here since it's the smaller one.

**Part 2 — tab filter empty state.** The task described the bug as
"beat section headers show even when completely empty on filtered
tabs," but that specific symptom wasn't actually reproducible — Session
28's per-beat hiding (drop a beat section entirely once none of its
items match the active tab) was already confirmed working via direct
Playwright testing in that session's own log entry. What *was* missing:
when a tab matches literally nothing anywhere in the arc (e.g. "OST &
Music" against an arc with no OST-tagged content), the page just showed
a blank gap with no explanation — not broken, but not "clean" either.
Added exactly what the task asked for regardless of the discrepancy in
how the bug was described: `components/ArcContent.jsx` now renders a
`.tab-empty-state` message ("No {tab label} content yet for this arc —
be the first to submit some.", linking to `/submit`) in place of the
beat-section list specifically when a non-"All" filter matches zero
items across every beat. New `.tab-empty-state` CSS in `globals.css`.

**Part 1 — mobile responsiveness pass.** Rather than guess at CSS
values, drove every page (`/`, `/arc/[slug]`, `/search`, `/series/
[slug]`, `/submit`, `/auth`) at a 390px viewport with a temporarily
installed Playwright (`npm install --no-save`, uninstalled before
finishing, same convention as prior sessions — confirmed via `git
status` showing no `package.json`/`package-lock.json` diff), and for
each page confirmed/refuted overflow via
`document.documentElement.scrollWidth` (a wider `scrollWidth` than
`clientWidth` is unambiguous, unlike eyeballing a screenshot) rather
than assuming the task's list of "known issues to check" was accurate.
It wasn't, entirely — some named concerns turned out to already be
fine, and the two worst actual bugs weren't on the task's list at all:

- **Confirmed already fine, no changes made**: the arc-nav strip's
  horizontal scroll (`.arc-strip-wrap` already had `overflow-x: auto`
  since it was built); character-chip wrapping on the arc page
  (`.chars { flex-wrap: wrap }`); the content-card grid going to a
  single column (`auto-fill(minmax(280px,1fr))` already collapses to 1
  column below ~574px content width); the entire `/submit` wizard
  (already built with `flex-wrap`/`min-width:0`/ellipsis-truncation
  throughout, confirmed via screenshot after triggering step 1's
  detected-link state); `/auth`'s centered card. The home and arc pages'
  hero text was already fluid via `clamp()` and not literally
  overflowing, though tightened slightly further anyway per the task's
  explicit ask.
- **Found and fixed — home page nav overflow** (not on the task's
  list). `document.documentElement.scrollWidth` was 580px at 390px
  viewport. Root cause, confirmed via direct child-by-child
  measurement: `.navLinks` (Browse/Series/Characters/Seasonal —
  already plain, non-clickable `<div>`s per `page.jsx`'s `NAV_LINKS`,
  not real navigation) plus `.nav-right` don't fit next to the logo,
  and `nav` has no wrap/collapse behavior. Fixed by hiding `.navLinks`
  at `max-width: 768px` (`page.module.css`) — the simplest fix that
  doesn't require inventing a hamburger-menu pattern this design has
  never had.
- **Found and fixed — arc page content-tabs overflow** (not on the
  task's list; the task named the *arc-nav strip*, which was already
  fine, not the *content tabs* row below it). `scrollWidth` was 677px.
  Root cause: `.tabs-wrap`/`.tabs` (added Session 28) never got
  `overflow-x: auto` the way `.arc-strip-wrap` did — the 5 tabs just
  overflowed the whole document instead of scrolling within their own
  row. Fixed by adding the same contained-scroll pattern
  `.arc-strip-wrap` already used, at `max-width: 768px`
  (`globals.css`).
- **Found and fixed — search page two-column layout** (on the task's
  list). `.twoCol`'s `1.1fr 0.9fr` grid squeezed both columns to
  ~236px/185px at 390px, confirmed via direct grid-child measurement
  (both columns' `top` values matched — genuinely side by side, not an
  illusion from a screenshot). Fixed by stacking to `1fr` at `max-width:
  768px` (`search.module.css`).
- **Found and fixed — series page hero** (on the task's list, described
  as "not overflowing" but the actual bug was worse than overflow).
  `document.documentElement.scrollWidth` didn't actually flag this one
  (390px, no overflow) — the bug was a broken *visual* layout, not a
  wider-than-viewport one. Root cause, confirmed via direct
  `getBoundingClientRect` measurement of `.poster`/`.info`: `.info`
  (`flex: 1; min-width: 0`) squeezed to ~150px instead of wrapping to
  its own line, its text wrapped into a ~1080px-tall column, and
  `align-items: flex-end` (which aligns each flex line's items to its
  own bottom edge) then pushed the 240px-tall poster down by roughly
  the difference — landing it visually mid-page, overlapping the
  description text, instead of at the top next to the title. Fixed by
  switching `.heroInner` to `flex-direction: column` at `max-width:
  768px` (`series.module.css`), which resolves both problems at once
  (no more squeeze, no more misaligned poster).

Every fix re-verified after the change: full mobile audit re-run,
confirming `scrollWidth === clientWidth` on all 6 pages; screenshots
retaken for home/arc/search/series and visually compared against the
"before" set. One apparent visual bug during this re-check — the sticky
nav appearing to duplicate mid-page in a `fullPage` screenshot of the
tab-filter empty state — was confirmed to be a `fullPage`
screenshot-stitching artifact specific to `position: sticky` elements,
not a real rendering bug, by taking a second, non-`fullPage` screenshot
at a real scroll position (rendered cleanly, sticky nav pinned only at
the very top, no duplication).

**Verification**: `rm -rf .next && npm run build` compiles cleanly,
same route table as prior sessions. All CSS changes are additive
`@media (max-width: ...)` blocks appended after existing rules in each
file — nothing above any of them was edited, so desktop layout (already
confirmed unaffected by every prior session's own build-and-read
verification) should be unchanged; this session didn't separately
re-screenshot desktop widths to double-confirm that, since no
pre-existing selector or rule was touched, only new ones added inside
`max-width` queries that cannot match a desktop viewport.

## Session 30

Two bugs reported after Session 29's mobile pass was tested against real
mobile devices (not browser resize): the search and arc pages still
overflowed sideways on a real phone despite testing clean under
emulation, and JJK Season 2 search results showed hardcoded arcs on the
series page instead of the real seeded ones.

**Bug 1 — real-device-only overflow.** Investigated by direct code
review and measurement rather than guessing at CSS values, same
discipline as Session 29:

- **Root cause #1, found by reading `app/layout.jsx`, not by testing**:
  no viewport meta tag existed anywhere in the app. Added the Next.js
  `viewport` export (`width: "device-width", initialScale: 1`). Without
  it, a real mobile browser renders at an assumed ~980px desktop-sized
  layout viewport and zooms the whole page to fit — meaning every
  `@media (max-width: 768px)`/`(max-width: 480px)` rule Session 29 wrote
  almost certainly never matched on a real phone at all. This alone
  plausibly explains most of the reported symptom on its own: Session
  29's testing used Playwright/DevTools viewport emulation, which sets
  the rendering viewport directly and never depended on this tag being
  present, so it couldn't have caught its absence.
- **Root cause #2, found by reading, not testing**: `.ctitle`/`.ccreator`
  (`globals.css`) and `.compactTitle`/`.compactMeta`
  (`ContentCard.module.css`) had no `overflow-wrap` protection. Real
  submitted content (an actual scraped creator handle, unlike this app's
  own short hardcoded/mock strings) can be a single long unbroken token
  with no spaces, which by default overflows its box visually rather
  than wrapping or being clipped — "past the card... border," matching
  the report exactly. This is also why Session 29 never caught it: every
  string in its own test data was short by construction. Added
  `overflow-wrap: break-word` to all four, plus `.seriesName`
  (`search.module.css`, the real AniList title) defensively.
- **The explicitly requested fix — `overflow-x: hidden` on the main page
  wrapper — took three attempts, the first two of which were caught
  before push by directly measuring `nav`'s position across a scroll,
  not by trusting the fix "should" work:**
  1. A `.page-overflow-guard` wrapper div (`overflow-x: hidden;
     overflow-y: visible;`) around the search and arc pages' content.
     Broke `position: sticky` on `nav` outright — scrolling 500px moved
     its top from 0 to -500 instead of staying pinned at 0. Root cause:
     setting only `overflow-x` on an element forces the UA to compute
     `overflow-y` as `auto` regardless of what it's explicitly set to (a
     real CSS Overflow Module Level 3 rule), turning the wrapper into a
     scroll container and `nav`'s new "nearest scrolling ancestor"
     instead of the document — and since the wrapper itself never
     scrolls internally, sticky had nothing to engage against.
  2. `overflow-x: hidden` on both `html` and `body` together, applied
     site-wide instead of a wrapper specifically to sidestep problem #1.
     This *also* broke sticky the same way — surprising enough to
     isolate in a minimal standalone test page outside the app (a bare
     `<nav style="position:sticky">` + tall content div, no Next.js/React
     involved) to root-cause properly: `overflow-x: hidden` on `html`
     *alone* preserves sticky perfectly; on `body` *alone* also preserves
     it perfectly; only the *combination* of both together breaks it —
     the same visible-computes-to-auto coercion as problem #1, just
     triggered between `html` and `body` instead of between one
     element's two axes.
  3. **The actual fix**: `overflow-x: hidden` on `body` only
     (`globals.css`), nothing on `html`, applied site-wide rather than
     scoped to the search/arc pages specifically (no known downside
     anywhere, and it's the one configuration confirmed by direct
     measurement not to touch sticky positioning at all).

**Bug 2 — JJK Season 2 series page shows hardcoded arcs.** Queried
AniList's live API directly (`graphql.anilist.co`, reachable from this
environment) for "JJK Season 2": returns id `145064` ("Jujutsu Kaisen 2nd
Season" / "JUJUTSU KAISEN Season 2", TV, 2023, 23 episodes) — a
completely separate Media entry from Season 1's `113415`, which is what
`arcs.anilist_series_id` is actually seeded with for both Shibuya
Incident Arc and Vs. Mahito Arc. `getArcsBySeries(145064)` therefore
correctly found zero rows (not a bug in that function — the id genuinely
isn't in the table) and the series page correctly fell back to hardcoded
`ARCS`, exactly as designed for any series with nothing seeded. The
"nothing seeded" premise was simply wrong for this specific id.

Considered the two options the task raised: parent/child series
relationship handling (querying AniList's own `relations` field at
request time to discover sibling season entries dynamically) versus a
small hardcoded alias. Chose the alias — a live `relations` lookup would
add a network request to every series-page view to resolve a case this
project has only ever hit once, for one show, and this codebase already
prefers small hardcoded lookups over speculative abstraction (`ARC_NAV`,
`TABS`, `CONTENT_TYPE_OPTIONS`, etc.). Also considered seeding a literal
alias into the database (duplicate `arcs` rows under `anilist_series_id
= 145064`) — rejected in favor of the code-level map specifically to
avoid data duplication and a schema/maintenance burden that grows with
every future split-season show; the code fix requires no SQL at all.
Added `ANILIST_ID_ALIASES = {145064: [113415]}` to `lib/supabase.js`;
`getArcsBySeries` now queries `.in('anilist_series_id', ids)` instead of
`.eq(...)`, where `ids` includes any known aliases. Deliberately
unidirectional (145064 → 113415, not the reverse) since nothing is
currently seeded under 145064 specifically — revisit if that ever
changes.

**Verification**: `rm -rf .next && npm run build` compiles cleanly, same
route table as prior sessions. Bug 1 re-verified end to end after each
attempt (including the two reverted ones) via a temporarily installed
Playwright (removed before finishing, confirmed via `git status` showing
no `package.json`/`package-lock.json` diff): `document.documentElement.
scrollWidth === clientWidth` on all 4 of `/`, `/arc/[slug]`, `/search`,
`/series/[slug]` at 390px, *and* `nav`'s `getBoundingClientRect().top`
measured before and after a 500px scroll on every page, confirming it
stays pinned at 0 rather than just eyeballing that it "looked" sticky.
Bug 2's `ANILIST_ID_ALIASES` logic and the AniList id itself (145064)
are verified; the actual database query result is not — this sandbox has
no live Supabase credentials (same standing limitation as every
Supabase-touching change in this project's history), so `/series/145064`
was only confirmed to render without crashing and fall back cleanly, not
confirmed to actually surface the real arcs. Whoever picks this up next
with live access: visit `/series/145064` and confirm Shibuya Incident Arc
and Vs. Mahito Arc appear instead of the hardcoded Chainsaw Man
placeholder list.

## Session 31

Reported: mobile horizontal overflow still present on the arc and search
pages on a real device, despite Session 30's fix — "content being cut
off on the left" and "the page sliding sideways," with the arc page's
content tabs and the search page's series panel/filter pills named
specifically.

Took this report seriously as a sign that Session 30's verification
method has a real blind spot, not just "try the same kind of fix again."
Every check across Sessions 29–30 was Playwright/Chromium viewport
emulation — never a real device, never real touch input, never real
WebKit. That gap is directly relevant here: a nested horizontally-
scrollable region (`overflow-x: auto`) sitting inside a `position:
sticky` element is exactly the kind of thing that can behave differently
under a real touch gesture (scroll/bounce "chaining" out to the whole
page) than in an emulated desktop browser driving synthetic scroll
events — and both `.tabs-wrap` (arc page) and, less directly,
`.arc-strip-wrap` fit that description precisely. A `scrollWidth`/
`clientWidth` check, which is what every prior session's verification
relied on, cannot detect a touch-gesture propagation bug at all — it's
not a static layout measurement.

**Arc page**: replaced `.tabs`' Session 29/30 horizontal-scroll pattern
(`overflow-x: auto` + `width: max-content`) with `flex-wrap: wrap` at
`max-width: 768px` — 5 short tab labels wrap cleanly to a few rows, and
this removes the nested-scrollable-sticky-region pattern structurally
rather than trying to harden it further with a technique (`overflow-x:
auto`) already reported not to hold up on a real device twice now.
`.tabs-wrap` (itself `position: sticky`) also gets `overflow-x: hidden`
directly, honoring the task's explicit request literally — confirmed via
an isolated standalone test page (a bare sticky element with `overflow-x:
hidden` on itself, nested under a `body` that also has it) that this
specific combination does not break its own stickiness, learning from
Session 30's mistake rather than assuming it's safe: only two *ancestors*
both having non-visible `overflow-x` breaks sticky, not an element and a
single ancestor. Also added `overscroll-behavior-x: contain` to both
`.tabs-wrap` and `.arc-strip-wrap` — not reported broken for the latter,
but the same pattern, and this is the CSS property specifically designed
to stop a nested scroll region's gesture from chaining to the page,
directly targeting the failure mode this whole bug report points at.

**Search page**: two real, distinct flexbox gaps found by re-reading the
CSS carefully, not by guessing:
- `.typeFilters` (filter pills row) already had `flex-wrap: wrap` but
  could still, per a subtle flex layout edge case, have its flex-basis
  computed from its own pre-wrap content extent before its parent
  (`.resultsHeader`, also `flex-wrap: wrap`) finished deciding whether to
  wrap it onto its own line. Added `overflow-x: hidden` (unconditional,
  harmless on desktop) plus `width: 100%` at `max-width: 768px` (forces
  it to claim its full row width once wrapped, closing the edge case).
- `.seriesPanelBody` — a `flex: 1` child of `.seriesPanel`, which already
  has `overflow: hidden` — had no `min-width: 0`. Its real content
  (poster, title, genre tags, action buttons) could refuse to shrink
  below its own natural width and get silently clipped by the parent's
  existing `overflow: hidden` instead of properly reflowing/wrapping —
  the likely explanation for "content cut off" specifically, as distinct
  from the page itself growing wider. Added `min-width: 0`.

Also re-checked the whole codebase for `100vw`/negative margins/other
fixed-width traps per the task's explicit request — same result as
Session 30, nothing found beyond what's already covered.

**Verification**: `rm -rf .next && npm run build` compiles cleanly, same
route table as prior sessions. Re-ran the full overflow + sticky-nav
regression check (temporarily installed Playwright, removed before
finishing, confirmed via `git status` showing no `package.json`/
`package-lock.json` diff) on all 4 of `/`, `/arc/[slug]`, `/search`,
`/series/[slug]` at 390px: `scrollWidth === clientWidth` on every page,
*and* `nav` confirmed still pinned at `top: 0` after a 500px scroll on
every page (the sticky-regression check Session 30 introduced, run again
here specifically because `.tabs-wrap` — itself sticky — was directly
modified this session). Additionally confirmed, via direct measurement
rather than just "should work" reasoning: the arc page's tabs now
genuinely wrap (`flexWrap: "wrap"`, rendered across 3 rows at 390px, and
`.tabs-wrap`'s own `scrollWidth` now exactly equals its width — meaning
it has *zero* overflow left to scroll, not just contained overflow); the
search page's series panel and filter pills both end exactly at the
container's right edge (362px = 390 − 28px padding on each side), not
past it.

**What this session could not verify, stated plainly**: none of this was
tested against an actual physical mobile device, real touch input, or
real WebKit/Safari — the specific gap this whole bug report exists
because of. Every fix here is well-justified by direct code reading and
CSS-layout reasoning (the `min-width: 0` gaps are unambiguous flexbox
bugs; `flex-wrap` structurally cannot overflow the way `overflow-x: auto`
can under WebKit's touch handling) and re-verified by the most rigorous
measurement this sandbox can perform, but if mobile overflow is reported
a fourth time, the next place to look is `overscroll-behavior-x:
contain`'s actual browser support/behavior on the reporter's specific
device, or getting a real screen recording, rather than another round of
Chromium-emulation-based guessing.

## Session 32

Reported broken a fourth time. Explicit instruction this session: stop
the targeted per-element approach and do a blunt, universal reset —
three specific rules requested verbatim: `html { overflow-x: hidden;
max-width: 100vw; }`, `body { overflow-x: hidden; max-width: 100vw; }`,
`* { max-width: 100%; box-sizing: border-box; }`.

**Implemented two of the three exactly as specified, and deliberately
changed the third — flagged clearly before proceeding, not silently:**
the requested `html` rule included `overflow-x: hidden`. Session 30's own
write-up in this file (still present, directly above `body`'s rule in
`globals.css`) documents — from an isolated test page, not guesswork —
that `overflow-x: hidden` on both `html` and `body` together breaks
`nav`'s `position: sticky` outright. Adding it to `html` again would
silently reintroduce a regression this project has already paid for once.
Re-ran the exact same isolated-test-page technique this session (not just
cited the old finding) to re-confirm before deciding: `html,body {
overflow-x:hidden}` together still breaks sticky; `body` alone still
doesn't. Implemented `html { max-width: 100vw; }` (no `overflow-x`),
`body { overflow-x: hidden; max-width: 100vw; }` (unchanged from Session
30 plus the new `max-width`), and `*, *::before, *::after { ...;
max-width: 100%; }` (added to the Session 1 box-sizing/margin/padding
reset already there — `box-sizing: border-box` on `*` was already
present, not new).

**Real risk identified and checked before shipping, not assumed away**:
a universal `max-width: 100%` could plausibly neuter `.arc-strip`'s
intentional wider-than-container horizontal-scroll strip (`width:
max-content`, meant to be wider than `.arc-strip-wrap`) — if `max-width`
capped it down to its container's width, there would be nothing left to
scroll. Measured directly rather than guessing either way: `.arc-strip`'s
own computed `width` does get capped to 390px (its `max-width: 100%`
container), but its `scrollWidth` still reports 1547px — its flex
children (9 arc chips) still refuse to shrink below their own natural
content size (an unrelated, already-present flexbox default,
`min-width: auto` on the children, not overridden by the parent's cap),
so the overflow is still real and `.arc-strip-wrap`'s existing
`overflow-x: auto` still scrolls it exactly as before. Confirmed with a
screenshot too, not just the numbers — chips render at full size,
un-squished, cut off cleanly at the viewport edge exactly as a working
horizontal-scroll row should look.

**Verification**: `rm -rf .next && npm run build` compiles cleanly, same
route table as prior sessions. Re-ran the full overflow + sticky-nav
regression check (temporarily installed Playwright, removed before
finishing, confirmed via `git status` showing no `package.json`/
`package-lock.json` diff) on all 6 pages this time (`/`, `/arc/[slug]`,
`/search`, `/series/[slug]`, `/submit`, `/auth` — the first session to
check `/submit` and `/auth` alongside the other four, since a
site-wide reset is exactly the kind of change that could plausibly touch
pages nobody thought to re-check): `scrollWidth === clientWidth` on every
page, and `nav` confirmed still pinned at `top: 0` after a 500px scroll
on every page that has a `nav` element (`/auth` doesn't, by design —
its own `querySelector("nav")` correctly returns null, which the
verification script logged as a literal false positive rather than a
real regression, worth noting so it isn't mistaken for one later).

**Stated plainly, again**: none of this was tested against an actual
physical device. This is now four consecutive sessions where an
increasingly aggressive, increasingly well-verified CSS fix was reported
not to hold on a real device. See the "Known issues" entry on this for
the fuller reasoning, but the short version: if this is reported broken
a fifth time, a CSS-only diagnosis is unlikely to be the right next move
without a real-device screen recording or exact browser/OS/model — a
universal `max-width: 100%` reset genuinely cannot be defeated by an
ordinary block/flex layout overflow, so a persistent report at this point
more plausibly points at something outside this file's reach (a stale
cached build, a service worker, a browser extension, or a device-specific
rendering quirk) than a sixth CSS rule.

## Session 33

Reported broken a fifth time — this time described specifically as "the
dark background bleeds past the right edge," with an explicit,
structured investigation request: check `app/arc/[slug]/page.jsx` and
`app/search/page.jsx` for a wrapper div with an explicit width/
min-width, check whether any section/container with a background color
has a width exceeding the viewport, and compare the home page's wrapper
structure (which doesn't show the bug) against arc/search's (which do)
to find the structural difference.

**Did the requested comparison thoroughly, and it came up empty** — this
is recorded plainly rather than dressed up as a fix, since after four
prior sessions of real findings it would be easy to manufacture a
fifth one that isn't real:
- Re-read every page's full JSX return (`app/page.jsx`,
  `app/arc/[slug]/page.jsx`, `app/search/page.jsx`) side by side. All
  three use the identical structure: a bare `<>` Fragment, `<nav>` first,
  then flat sibling sections — no extra wrapping `<div>` anywhere on any
  of them, and specifically none with its own `width`/`min-width`
  distinct from what Sessions 29–32 already found and fixed.
  `ArcHero.jsx` wraps `.hero` inside `.container` (`max-width: 1100px;
  margin: 0 auto; padding: 0 28px;` — no background, no explicit width
  beyond the max-width cap); nothing structurally different from how
  `page.module.css`'s own `.hero` sits directly under the home page's
  `<>` fragment.
- Grepped every `background:` declaration in the entire `globals.css`
  (not just the ones already touched) looking specifically for a
  full-viewport-width colored bar with its own explicit sizing. Found
  exactly three: `nav`, `.arc-strip-wrap`, `.tabs-wrap` — all three are
  plain block-level elements with no explicit `width` (default to 100%
  of their containing block, and are now additionally capped by Session
  32's universal `max-width: 100%`), and `nav` itself renders
  identically on the home page (same bare `nav` selector, same
  `backdrop-filter: blur(14px)`) without the reported issue there,
  weakening the theory that any of these three is the differentiator on
  its own.
- Checked every relevant component (`ArcHero`, `ArcNav`, `ArcContent`,
  `SearchNav`, both page files) for an inline `style={{ width: ... }}` —
  none found; the only inline `style` props anywhere in these files set
  `marginBottom`, `background` (a per-character avatar color, not a
  layout width), or a 1px divider height.

**One real, if minor, thing found and fixed**: `.tabs-wrap`'s
`overflow-x: hidden` (Session 31) was only inside the `max-width: 768px`
media query, not applied unconditionally. Moved it to the base rule.
Harmless on desktop (tabs never overflow there) and closes a real, if
narrow, gap — but this is a hardening, not a new bug that would explain
"background bleeding," since the media query already covers every real
phone width given a correctly-set viewport meta tag (confirmed present
and correct in the prior session).

**Verified this specific change didn't reintroduce Session 30's sticky
regression** — `.tabs-wrap` is itself `position: sticky`, so any change
to it gets the same scrutiny that mistake earned. First check
(scroll 500px, expect `.tabs-wrap.top === 56`) read "not pinned" —
investigated rather than accepted at face value, and turned out to be a
test methodology gap, not a regression: `.tabs-wrap` sits far enough down
the page (behind the arc hero's description/character chips/stats) that
500px of scroll isn't enough to reach its sticky engagement point at
all — it was still moving in exact 1:1 lockstep with the scroll amount,
which is correct *pre*-sticky-engagement behavior, not broken sticky
behavior. Re-tested at scroll 2000px: `.tabs-wrap.top === 56` exactly,
confirmed pinned correctly, same as `nav`.

**What this session's finding actually means, stated directly**: this is
the first of five sessions on this bug where a thorough, requested
investigation found no new code-level cause. Combined with Session 32's
universal `max-width: 100%` reset — which is about as close to
mathematically complete CSS overflow containment as this stylesheet can
express — a sixth CSS-only attempt is unlikely to be the right next move
if this is reported broken again. The more likely remaining explanations
are outside this file's reach: the tester viewing a stale Vercel preview
URL or browser-cached response rather than the latest deployed commit,
or a device/browser-specific rendering behavior no session working from
this sandbox can reproduce (confirmed again this session: no real device
or physical touch input available, same standing limitation noted in
every mobile session's log since Session 29).

**Verification**: `rm -rf .next && npm run build` compiles cleanly, same
route table as prior sessions. Re-confirmed (temporarily installed
Playwright, removed before finishing, confirmed via `git status` showing
no `package.json`/`package-lock.json` diff) on the arc page specifically:
zero overflow, `nav` pinned at `top: 0`, `.tabs-wrap` pinned at `top: 56`
once scrolled far enough to engage — the one file this session actually
changed, tested correctly for its sticky implications, not skipped.

## Session 34

Reported broken a sixth time, but this time with a specific, correct
diagnosis instead of another symptom description: the signed-in nav
(logo + search bar + Browse + email address + Sign out button) is what's
pushing the nav — and with it the page's full-bleed background — wider
than the mobile viewport. Requested fix: hide the email on screens below
640px (Sign out button or an avatar/icon is enough), hide the
non-functional "Browse" link at the same breakpoint, done as media query
rules in `NavAuth.jsx`/CSS.

**This was the real bug, and Sessions 29–33 never had a chance to find
it.** `nav` has no `flex-wrap`, and every child of `.nav-right` (the
Browse button, the email `<span>`, the Sign out button) keeps the
flexbox default `flex-shrink: 0` — none of them, nor `.search-bar`
beyond its own text-wrap, can give up space, so once the signed-in nav
has more children than the signed-out one, the row simply grows past the
viewport. The reason five prior sessions of thorough CSS auditing missed
this: this sandbox has never had live Supabase credentials
(`lib/supabase.js` always falls back to `placeholder.supabase.co`), so
`getSession()` always resolves to `null` and `NavAuth` always rendered
the signed-out "Sign in" link in every Playwright/DevTools test run to
date. Nobody — across six sessions — had ever actually rendered the
state a real logged-in mobile user sees.

**Fix**:
- `app/globals.css` — new `@media (max-width: 640px)` block:
  `.nav-auth-email { display: none; }` and `.nav-browse-btn { display:
  none; }`. Placed as its own block (the existing breakpoints are 768px
  and 480px; the task specified 640px explicitly).
- `app/arc/[slug]/page.jsx` — the nav's `<button>Browse</button>` now
  also carries a `nav-browse-btn` class. Needed because the Sign out
  button also uses `.btn-ghost`; without a distinct class, a selector
  broad enough to hide Browse would have hidden Sign out too. (The home
  page's own "Browse" — part of `NAV_LINKS`/`.navLinks` — was already
  hidden below 768px since Session 29, so it needed no change. The
  search page's nav has no Browse button at all.)
- `NavAuth.jsx` itself needed no code change — `.nav-auth-email` was
  already a distinct, targetable class name.

**Verified by actually reproducing the bug, not just reasoning about
it** — a first for this saga. Temporarily hardcoded a fake signed-in
session into `NavAuth.jsx` (bypassing the real `getSession()`/
`onAuthStateChange` calls, which this sandbox's placeholder Supabase
client would otherwise immediately overwrite back to `null`), then
measured `document.documentElement.scrollWidth` at a 375px Playwright
viewport:
- **Before the fix**: arc page `scrollWidth` 552px, search page 518px,
  home page 428px — all against a 375px viewport. The home page
  overflowing too is a new finding beyond what was reported: Session
  29's `.navLinks { display: none }` fix only ever addressed the
  signed-out state there.
- **After the fix**: all three pages back to `scrollWidth === clientWidth
  === 375`, `.nav-auth-email` and `.nav-browse-btn` (arc page)
  confirmed `display: none`, Sign out button still visible.
- Also re-confirmed `nav`'s `position: sticky` is unaffected in the
  signed-in state: `nav.top === 0` both before and after a 2000px
  scroll.

The temporary `NavAuth.jsx` test edit (hardcoded session, disabled
`getSession()`/`onAuthStateChange` calls) was fully reverted before
committing — confirmed via `git diff components/NavAuth.jsx` showing no
output (byte-identical to before).

**Verification**: `rm -rf .next && npm run build` compiles cleanly
(same 11-route table as every prior session). Playwright was
temporarily reinstalled for this session's testing and removed before
finishing (`npm uninstall playwright`, confirmed via `git diff --stat
package.json package-lock.json` showing no diff). `git status --short`
before commit showed only `app/arc/[slug]/page.jsx`, `app/globals.css`,
and `PROJECT.md` modified.

This is treated as the real fix, not another round of hardening: unlike
Sessions 29–33, this session reproduced the exact reported symptom
(background/page wider than viewport) under test, then confirmed it
gone after the change — the first time in this saga that's been
possible. If mobile overflow is reported again, worth checking whether
it's this same nav in some state still untested (e.g. a very long real
email address wider than the `.nav-auth-email` component ever exercised
before it was hidden — mitigated already since it's `overflow: hidden;
text-overflow: ellipsis` even above 640px, but combined with even more
`.nav-right` children than exist today it could resurface) before
assuming a new cause.

## Session 35

Reported still broken, but scoped precisely this time: the search page and
series page — both of which turned out to render via `SearchNav.jsx`, a
separate nav implementation from the arc page's own inline `<nav>` fixed
last session — still overflow on mobile, attributed to the "Submit
content" button being too wide alongside Sign out. Requested fix: collapse
"Submit content" to an icon (or hide it outright) below 640px, applied to
whichever nav component the search/series pages actually use.

**Confirmed `SearchNav.jsx` is exactly what the search and series pages
share** — `app/series/[slug]/page.jsx` imports and renders it directly,
same component, same file, as `app/search/page.jsx`. The arc page's inline
`<nav>` (fixed in Session 34) is unrelated and untouched by anything in
this session.

**Measured before guessing.** Reused Session 34's technique — a temporary
hardcoded signed-in session in `NavAuth.jsx` (reverted before commit,
confirmed via `git diff` showing no output) — but this time swept a full
range of widths (320–639px) rather than checking a single viewport, since
Session 34's own 375px-only check would have missed this:
- At 375px, both pages already measured clean (`scrollWidth === 375`) —
  Session 34's `.nav-auth-email` fix alone was enough at that width.
- At 320px (the narrowest realistic phone width — original iPhone SE,
  some budget Android devices), both pages overflowed the viewport by
  16px (`scrollWidth 336` vs `clientWidth 320`) even with the email
  already hidden. Session 34's fix was real and necessary, just not
  sufficient at the narrowest end of the range this component's own
  `.searchWrap` (a real `<input>`-backed search bar, unlike the arc
  page's static decorative one) leaves less room to work with.
- The home page (`app/page.jsx`, its own separate inline nav, not
  `SearchNav.jsx`) has the same "Submit content" button but was not part
  of this request's scope; noted here for the record that it shows a
  smaller, related 8px overflow at 320px (`scrollWidth 328` vs `320`) —
  left as-is since it wasn't reported and wasn't asked for, but worth
  fixing with the identical pattern if it ever is.

**Fix**: rather than hiding "Submit content" outright — the option the
task offered as a fallback — collapsed it to an icon-only button below
640px, since unlike the arc page's decorative, non-functional "Browse"
button (removed entirely in Session 34), this is a real, functional
primary CTA available to every visitor, signed in or not. `SearchNav.jsx`
now renders the link as a `+` icon span plus a text span
(`aria-label="Submit content"` on the link itself so the accessible name
survives regardless of which span is visually hidden); `globals.css`
hides the icon and shows the text by default, then the existing
`@media (max-width: 640px)` block (added Session 34) flips that — text
hidden, icon shown, button padding tightened for an icon-sized hit
target.

**Verification**: swept both pages across nine widths (320, 360, 375,
390, 414, 480, 600, 639, and — past the breakpoint — 640, 700, 1024px),
signed in, confirming `document.documentElement.scrollWidth ===
clientWidth` at every single one, and confirming the icon/text swap
happens exactly at the 640px boundary (icon at 640px and below, text at
700px and above). Also re-confirmed `nav`'s `position: sticky` on the
search page specifically (not just the arc page, which is a different
component instance): `nav.top === 0` at 375px both before and after a
2000px scroll, signed in. `rm -rf .next && npm run build` compiles
cleanly, same route table. Playwright was reinstalled temporarily for
this session and removed before finishing (`git diff --stat package.json
package-lock.json` shows no diff). The temporary `NavAuth.jsx` test
session hack was fully reverted before commit.

## Session 36

Follow-up on Session 35's own closing note: fix the home page's 8px
overflow at 320px, previously attributed (by me, in that session's own
report) to its separate "Submit content" button, using the same
icon-only collapse below 640px.

**Applied the requested fix first** — `app/page.jsx`'s "Submit content"
`<Link>` now renders the same `.nav-submit-icon`/`.nav-submit-text` span
split Session 35 introduced in `SearchNav.jsx` (no new CSS needed, since
those classes are already global, not scoped to a CSS module).

**Then measured rather than assumed it was done** — re-ran the same
temporary-signed-in-session Playwright technique across 320–1024px. The
icon collapse applied correctly (icon shown, text hidden, below 640px)
but **the 320px overflow was still there**: `scrollWidth` 328 vs
`clientWidth` 320, unchanged from before the fix. My own Session 35 note
attributing this 8px to "Submit content" was wrong — it was a coincidence
of both numbers being small, not a verified cause. Drilled down (checking
each level of `document.body`'s children, then `.container`'s children,
then that section's children) rather than accepting the assumption: `nav`
itself measured a clean 320×320 with the icon fix in place, so the 8px
was never coming from the nav at all. The actual source was three levels
away — `.arcGrid` (the "Trending arcs" section's card grid), whose
`grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))` forces a
300px-minimum column regardless of available width. At 320px, `.container`
padding leaves only 264px for it, so the grid overflowed its own parent
by 36px — clipped visually (nothing looked broken on screen), but still
counted toward `document.documentElement.scrollWidth`, which is where the
8px total was actually coming from. This section was never touched by any
of Sessions 29–35, all of which were chasing nav-related causes.

**Fix**: `.arcGrid { grid-template-columns: 1fr; }` inside the existing
`@media (max-width: 480px)` block in `page.module.css` — the same
single-column-below-a-breakpoint pattern already used for `.cards`
(`globals.css`) and the content-card grid, not a new pattern.

**Verification**: re-swept the same width range (320–1024px) after both
changes — `scrollWidth === clientWidth` at every one, icon/text swap
still correct at the 640px boundary, `nav`'s `position: sticky` still
pinned (`top === 0` before/after a 2000px scroll at 375px). Reverted the
temporary `NavAuth.jsx` session hack before commit (`git diff` shows no
output). `rm -rf .next && npm run build` compiles cleanly, same route
table. Playwright reinstalled and removed as usual (`git diff --stat
package.json package-lock.json` shows no diff).

**Worth stating plainly**: the task as given ("fix the 8px overflow …
caused by the Submit content button") had an incorrect premise baked in
by my own prior session, and applying exactly what was asked did not
fix the measured symptom — it took an actual measurement after the fact
to catch that and find the real cause instead of reporting the
requested change as done and moving on.

## Session 37

Cleanup pass: three specific items, requested as "Session 20" — the
project's own history already used that number (see the Session 20 entry
above, from several sessions ago), so this is logged as Session 37, the
next actually-available number, per this project's established
mislabeling convention.

**Item 1 — remove two leftover debug `console.log` blocks (one in the arc
page, one in the submit page), described as "marked as temporary in
PROJECT.md."** Checked before touching anything: `grep -rn "console\."`
against `app/arc/[slug]/page.jsx` and `app/submit/page.jsx` specifically
returns zero matches in either file — no `console.*` call of any kind
exists in either page, temporary or otherwise. This isn't a gap in the
search; PROJECT.md's own "Current State" section already states this
plainly (see the "Zero `console.log`/`TODO`/`FIXME` sweep" paragraph
near the top of this file, and Session 22's identical from-scratch
re-sweep): every remaining `console.*` call anywhere in the codebase is
intentional, permanent operational logging (the two `lib/supabase.js`
module-load/error logs, `confirmContentItem`/`flagContentItem`'s
per-failure logs, both API routes' catch-block logs, `NavAuth`'s
sign-out failure log — now also `getTrendingArcs`' own two error logs,
added this session, same pattern) — the arc page's own last temporary
diagnostic log was removed back in Session 27, and the submit page has
never had one recorded in this file's history at all. **Nothing was
removed, because there was nothing left to remove** — reported here
plainly rather than deleting an unrelated `console.error` just to have
something to point at.

**Item 2 — arc page hero stats.** Confirmed the premise first: `ARC.stats`
was indeed always `2,847` / `14,209` / `891` / `38` (Fan items/Saves/This
week/Contributors), spread unconditionally into the `arc` object
regardless of `params.slug` — the one field Session 24 explicitly named
as left-hardcoded and never revisited since. Fixed:
- `ARC`'s hardcoded `stats` array removed entirely from `app/arc/[slug]/
  page.jsx`.
- A new `heroStats` is computed after `arcFoundInDb` is known: "Fan
  items" uses `realArcContent.length` — the exact same array
  `getArcContent` already fetched earlier in the same request for the
  beat sections below, so this needed no new query, just reading a
  length off data already in hand. The other three render as a plain
  `"—"` rather than a number, since this project has no `saves` table,
  no way to compute a real "this week" window, and no distinct-
  contributor query — inventing a number for any of them would be
  exactly the "fake number" this task was about removing.
- Applies even on the fully-hardcoded fallback path (`params.slug`
  doesn't match any seeded arc) — that path still renders fake mockup
  beats/content elsewhere (unchanged, out of this task's scope), but a
  fake *stat number* specifically is what was asked to go, so `fanItems`
  is `0` there rather than reintroducing `2,847` through the back door.

**Item 3 — home page "Trending arcs."** Added `getTrendingArcs(limit=6)`
to `lib/supabase.js`: pulls up to 500 of the most recent visible
`content_items` (ordered by `created_at` descending, `status` in
`confirmed`/`pending` — the same visibility filter `getArcContent` already
uses), embedding each item's `arcs`/`series` in the same round trip, and
collapses to one entry per `arc_id` in JS. Because the source query is
already newest-first, the first time a given `arc_id` appears in the
results is exactly that arc's most recent item — a plain `Map` (insertion-
order-preserving) gives "most recently active arc, most recent first"
without a separate aggregate/group-by query, which Supabase's query
builder can't express directly anyway. A second query fetches real
`beats` for just the resulting arc ids, so the card's sparkline and
"Peak: ..." label are genuine per-arc data too (same `heightPct`/`tier`
derivation the arc page's own `intensityBeats` already uses), not the old
hand-picked-per-card fake arrays.

`app/page.jsx`: `HomePage` is now `async` (`export const revalidate =
0`, matching the arc page), calls `getTrendingArcs(6)`, and the entire
hardcoded `TRENDING_ARCS` array (6 fake arcs, several from shows this
project has zero real data for) is deleted — not kept around as a
fallback. Real cards render `seriesTitle` (no fake " · S2"-style season
suffix — the `series` table has no such field) and `episodeStart`–
`episodeEnd` (no fake date — `arcs` has no date field either); a
`seriesDotColor` helper hashes the arc id into a small fixed palette
purely for visual variety on the badge dot (decorative, not a claim about
real data, unlike a fabricated stat would be). Per the task's explicit
instruction, any of the 6 grid slots without a real arc render a plain
dashed `.arcCardEmpty` placeholder ("More trending arcs coming soon")
instead of being padded with fake arcs — including all 6 slots when zero
real arcs have content yet (this sandbox's own current, verified state,
since Supabase is unreachable here — see Verification below). The
section's subtitle changed from "Most active in the last 7 days" to
"Most recently added content," since the new query genuinely computes the
latter but not the former (see "Known issues" for the distinction).

**Verification**: `rm -rf .next && npm run build` compiles cleanly (`/`
is now `ƒ` dynamic rather than `○` static, as expected once it fetches
live data). Ran `next start` against the production build and `curl`'d
every page (`/`, `/arc/[slug]`, `/search`, `/series/[slug]`, `/submit`)
— all return `200`, no crash. Inspected the actual rendered HTML rather
than assuming: the home page's arc grid shows all 6 `.arcCardEmpty`
placeholders (Supabase is unreachable from this sandbox, so
`getTrendingArcs` correctly falls through its caught error to `[]`,
exactly like every other Supabase-backed page here always has), and the
arc page's hero stats render exactly `0 / — / — / —` for Fan items/
Saves/This week/Contributors (also the correct behavior for this
sandbox's dead-Supabase state, per Item 2's own fallback rule above) —
confirming the new code paths execute and degrade honestly rather than
crashing, though neither can be confirmed against real data from this
environment (no live Supabase credentials here, same standing limitation
as every prior session touching this file).

## Session 38

Full project audit, requested explicitly: cover all files/components,
Supabase schema, all RLS policies, what's real vs. hardcoded per page,
fully working end-to-end, partially working, known issues, and a Phase 7
plan. This file's third full audit (the first was Session 17, the second
Session 22) — same standard both times: every file re-read fresh from
disk, nothing carried forward from memory of the incremental patches
between audits.

**Every file in `app/`, `components/`, and `lib/` (38 files) plus all 4
root config files was read directly from disk this session**, not
inferred from this file's own prior descriptions of them — including 20
files no session had re-verified since a prior audit or their own
introducing session (`app/search/page.jsx`, `app/series/[slug]/page.jsx`,
`app/submit/page.jsx`, `app/auth/page.jsx`, `app/auth/callback/page.jsx`,
`app/api/confirm/route.js`, `app/api/flag/route.js`,
`app/api/og-fetch/route.js`, `lib/anilist.js`, `lib/auth.js`,
`next.config.mjs`, `package.json`, `jsconfig.json`, and 8 components:
`ArcNav`, `ArcContent`, `BeatSection`, `ConfirmButton`, `ContentTabs`,
`FlagButton`, `HeroSearch`, `IntensityChart`, `CharacterChips`,
`YoursBadge`, `ArcList`, `ContentCard`). Cross-checked every claim in the
existing "Current State — Handoff Audit" section against what was
actually on disk, rather than assuming a section that's been kept
incrementally updated every session since Session 22 was still accurate
by default.

**Result: the existing audit section held up well** — every page's
real-vs-hardcoded claims, every component's prop/behavior description,
and the full RLS/schema section were all confirmed accurate against the
current source. Two small inaccuracies found and fixed, both minor
bookkeeping drift rather than anything materially wrong:
- `lib/supabase.js` has **one** module-load `console.log` (a single
  multi-line statement), not "two module-load logs" as this section
  previously said.
- **Only one** literal `TODO`-marked comment remains in the codebase
  (`app/search/page.jsx`), not two — the series page has an equivalent,
  already-tracked gap but its comment doesn't use the `TODO` marker, so
  a plain grep undercounts it relative to what "Explicitly not built"
  already documents in prose.

**Structural changes made to this file, not to the application**:
- **File inventory count corrected 37 → 38** — `components/ArcContent.jsx`
  (added Session 28) postdates the count Session 22 originally took.
- **Named a closed Phase 6** (Sessions 22–37: Session 22's own audit,
  real multi-arc/multi-series data and per-slug routing, a real
  production data bug found and fixed, real client-side tab filtering,
  the eight-session mobile-responsiveness effort, and Session 37's real
  arc-page/home-page stats) — previously ungrouped, sitting between
  Phase 5 and a roadmap section titled "Phase 6+" as if Phase 6 hadn't
  started yet, when in fact 15 sessions of real work had already
  happened under that implicit label.
- **Renamed "Phase 6+ roadmap" to "Phase 7 roadmap"** and updated its
  item list: removed items that were already fully done (Session 18's
  RLS confirmation guidance stayed, since it's still genuinely
  unconfirmed; tab-filtering and the Session 24 arc-header fix were
  removed as list items since they're done and already covered in
  "Known issues"/the phase summary), and added two new forward-looking
  items this audit's own re-read surfaced as real, currently-untracked
  gaps: giving "Trending arcs" an actual trending/ranking metric (not
  just "most recently active"), and deciding whether Saves/This
  week/Contributors ever become real tracked features at all, since
  nothing in the current schema supports any of them.
- **Removed roughly 400 lines of stale, pre-Session-17 reference
  material** (a separate "Stack" / "File layout" / "What each component
  does" / "Hardcoded data per page" / "Explicitly not done" block) that
  had drifted out of sync with the codebase (e.g. it described
  `lib/supabase.js` as exporting only 2 of its current 8 functions) and
  fully duplicated what the Current State section above already covers
  more accurately — replaced with a short pointer explaining the
  removal. The session-by-session log (Sessions 1–37, unaffected) remains
  the complete historical record; only the second, parallel reference
  doc was removed.

**Nothing in the application code changed this session** — documentation-
only, same convention as Sessions 17 and 22. `rm -rf .next && npm run
build` re-run to confirm the codebase itself is still in the exact state
this audit describes: compiles cleanly, same route table as Session 37
left it.

## Session 39

**Phase 7, first session** (this file's own numbering convention: treat
new work as the next sequential session number regardless of how the task
framed it — this task called itself "Phase 7 Session 1," logged here as
Session 39 per the rule explained at the top of this file). Task: make
`/submit` dynamic so a submission can target any seeded arc, not just
Shibuya, instead of the hardcoded `ARC_SLUG = "shibuya-incident-arc"` and
always-JJK/Shibuya `SERIES_DETECTED`/`ARC_DETECTED` consts Sessions 5/10
left in place (Phase 7 roadmap item 8).

**`lib/supabase.js`** gained two new exports:
- `searchSeries(query)` — case-insensitive `ilike` partial match against
  `series.title`, up to 10 rows, ordered alphabetically. A blank/
  whitespace query returns `[]` without querying at all (the caller
  debounces on every keystroke, including the empty string right after a
  character is deleted). Never throws — a failed query logs and returns
  `[]`, matching this file's other best-effort read functions
  (`getArcsBySeries`, `getTrendingArcs`) rather than `getArcMeta`/
  `getArcBeats`/`getArcContent`'s throw-on-error convention, since this
  one only ever backs a live-typing search box, not a page's core data.
- `getAllArcsForSeries(seriesId)` — every `arcs` row for a given
  `series.id` foreign key, ordered by `order_index`. Deliberately
  separate from the existing `getArcsBySeries(anilistSeriesId)` (Session
  25, keyed by AniList's id, used by the arc page's nav strip and the
  series page's arc list) — this new function is keyed by the aniindex
  `series.id` instead, since `/submit`'s new series search resolves a
  real `series` row (with its own id) rather than an AniList id.

**Naming collision found and documented, not fixed**: `lib/anilist.js`
already has its own `searchSeries(query, {perPage})` (a live AniList
GraphQL search, unchanged since Session 6, used by `app/search/page.jsx`).
Same function name, different module, different backing data — no file
imports both today, so there's no runtime clash, but it's a real trap for
a future session adding a new call site. Renaming either one was out of
this task's scope (touching `app/search/page.jsx`'s working AniList call
for a documentation nicety felt like exactly the kind of unrequested
refactor this codebase's own conventions warn against), so this is
flagged here and in the file inventory instead.

**`app/submit/page.jsx`** — Step 2 rebuilt from a static "detected"
summary into a real three-tier picker:
- **Series**: a debounced (300ms) search input calling `searchSeries`;
  matches render as clickable chips. Picking one replaces the input with
  a selected-series summary (a "✓ selected" badge + "Change" button,
  reusing the same `.detectedVal`/`.changeLink` visual pattern the old
  auto-detected fields used, since the layout language still fits even
  though nothing is auto-detected anymore).
- **Arc**: appears once a series is selected, loads via
  `getAllArcsForSeries(selectedSeries.id)`, renders as a vertical list of
  buttons (title + episode range), same selected-summary pattern once
  picked. Resets to empty the moment the series selection changes
  (`useEffect` keyed on `selectedSeries`), so an arc from a previously
  selected series can't linger selected against a new one.
- **Story beat**: unchanged chart/interaction, now keyed on
  `selectedArc.slug` via the existing `getArcBeats` (no new Supabase
  function needed here — this was already arc-agnostic, just previously
  only ever called with the one hardcoded slug). Beat selection resets to
  index 0 on every arc change — the old `DEFAULT_BEAT_INDEX = 4` assumed
  Shibuya's own beat order specifically ("The Sealing"), which has no
  sensible equivalent once the arc varies.
- **Characters / content type**: left exactly as they were, per the task
  — still `INITIAL_CHARACTERS`' one hardcoded "Gojo Satoru" chip and
  `CONTENT_TYPE_OPTIONS`' plain label list, un-gated behind any
  series/arc selection (same as before).

`handleSubmit` no longer does its own arc lookup query — Session 5/10's
version re-fetched the arc's id from its slug at submit time; now that
the picker already resolved a real `arcs` row (with its own `id`) before
the user ever reaches step 3, `selectedArc.id` is used directly in the
`content_items` insert alongside `selectedBeat.id`, one fewer round trip
than before.

The "Continue →" button on step 2 is disabled until series, arc, *and*
beat are all selected (previously just beat, since series/arc were
always pre-filled). The step-2 completed summary line (shown once past
step 2) now reads the real selected series/arc/beat titles instead of the
old hardcoded `SERIES_DETECTED.name`/`ARC_DETECTED.name`.

**CSS** (`submit.module.css`): the old `.autoBadge` class (unused
anywhere else in the file once `SERIES_DETECTED`/`ARC_DETECTED` were
removed) was renamed to `.selectedBadge` with the same visual styling —
renaming rather than leaving a dead, misleadingly-named class plus a
near-duplicate new one. Added `.searchInput`/`.searchResults`/
`.searchChip` (the series search box + chip results) and `.arcList`/
`.arcListItem`/`.arcListItemTitle`/`.arcListItemMeta` (the arc picker
list), styled to match this page's existing input/pill/list visual
language rather than introducing a new one.

**Verification**: `rm -rf .next && npm run build` compiles cleanly (no
live Supabase credentials in this sandbox, same standing limitation every
prior session touching this file has noted — build-time static
generation still hits the placeholder-URL fallback in `lib/supabase.js`
harmlessly, same as always). Beyond that static check, this session also
did real browser-driven verification via Playwright (installed temporarily
via `npm install --no-save playwright-core`, uninstalled after — same
pattern as Sessions 20/21, confirmed via `git status` showing no diff on
`package.json`/`package-lock.json` either before or after), against a
mocked Supabase PostgREST endpoint (route interception on `**/rest/v1/**`
returning hand-built `series`/`arcs`/`beats`/`content_items` fixture
data) rather than a live project, since this sandbox has never had real
Supabase credentials. Confirmed: picking a series shows its real arcs
with correct episode ranges; picking an arc loads that arc's real beats
(not a different arc's); the beat chart defaults to index 0 and
re-selecting updates the selection; "Continue" stays disabled until
series+arc+beat are all chosen and enables correctly once they are; the
step-2 completed summary and step-3 review both reflect the actual
selection; and submitting posts a `content_items` insert (captured by the
mock) and shows the real success message. Screenshots taken at each stage
confirm the visual layout holds together (chips wrap correctly, the arc
list and beat chart render as designed, the review card matches the
selection). **The series search's own substring filtering was checked
carefully, not just assumed**: a first version of the mock's own query-
string parsing had a regex bug that accidentally matched every row
regardless of query, which would have let a broken `searchSeries` pass
unnoticed — caught before trusting the result, fixed the mock (not the
app code, which was never wrong), and re-ran with an explicit negative
case (searching "titan" shows the Attack on Titan chip and *not*
Jujutsu Kaisen) to confirm the real `.ilike('title', '%…%')` call and its
UI rendering filter correctly both ways, not just render whatever rows a
loose mock happens to return.
**Not verified**: a real insert against a live Supabase project (this
sandbox still can't reach one), and whether `series`/`arcs` RLS read
policies (already public-select per the Database schema section) behave
identically against real data volume — no reason to expect otherwise,
but genuinely unconfirmed from here, consistent with this file's standing
verification caveat for every Supabase-touching session.

**Phase 7 roadmap item 8 is done** — see that list's own entry above,
now struck through. Item 7 (manual title/creator correction on
`/submit`) remains open and is a distinct, unstarted gap from what this
session built.

## Session 40

Three bug fixes, requested together: two in `/submit`, one on the arc
page's confirm flow.

**Bug 1 — hardcoded, unremovable "Gojo Satoru" character chip.**
`app/submit/page.jsx` no longer has an `INITIAL_CHARACTERS` constant at
all. `characters` is now a plain array of strings (not `{name, initials,
color}` objects), starts empty, and a new inline text input
(`.charInput`) sits right in the chip row — pressing Enter or comma
commits the current input text as a new chip (`addCharacterFromInput`,
via `handleCharacterInputKeyDown`; the comma itself is prevented from
being inserted into the input via `e.preventDefault()` on keydown, the
standard free-text-tag-input pattern, rather than typed then stripped).
Each chip has its own × (`handleRemoveCharacter`, unchanged mechanism,
just matching on the plain string now instead of `char.name`). Removed
the now-dead `"✦ detected"` badge and colored-initials avatar markup —
neither makes sense once nothing is auto-detected — along with their
CSS (`.charChipDetected`/`.charAv`/`.charChipConfirm`/`.addChar` in
`submit.module.css`, replaced with `.charChip`/`.charInput`).
`character_tags` on the final insert is now `characters` directly (no
more `.map((c) => c.name)`), and the step-3 preview's `characterTags`
prop is the same array unchanged.

**Bug 2 — no navigation off the step-3 success screen.** Added a
`.successActions` row directly under the existing "✓ Submitted" message:
a "View arc page →" link (`next/link` to `` /arc/${selectedArc.slug} ``,
reusing the `.btnContinue` button styling — which needed a
`text-decoration: none` added, since it had only ever been applied to
real `<button>`s before) and a "Back to home" link (`href="/"`, the
shared global `.btn.btn-ghost` classes, same convention already used
elsewhere in this app for button-styled links). Both only render once
`submitStatus === "success"` and a `selectedArc` exists (always true by
the time step 3 is reachable, per step 2's own Continue-button gating —
the `selectedArc &&` guard is defensive, not load-bearing).

**Bug 3 — confirming a pending item, then switching the arc page's own
content tabs away and back, silently un-confirms it in the UI.** The
task's own diagnosis (framed as "the optimistic UI update happens before
the API call completes, a race condition in ConfirmButton") turned out
not to match the code: `ConfirmButton.jsx` already set its loading state
synchronously on click, disabled itself while loading, and only called
`onConfirmed` after `await`ing the fetch and checking `res.ok` — verified
by direct code reading, then confirmed live (see Verification below) that
this exact ordering already held. The real, reproducible bug was one
level up: `ContentCard.jsx`'s confirm-optimism used to live in its own
`useState(status)`, seeded once at mount — and the arc page's content-tab
filter (`ArcContent.jsx`, Session 28) unmounts a `ContentCard` entirely
the instant its item doesn't match the active tab's bucket. Switching to
a tab this item doesn't match and back to one that shows it again mounts
a **new** `ContentCard` instance, which re-seeds its local state from the
original, still-`'pending'` server prop — silently reverting the pending
badge/confirm button to visible again, even though the confirm POST had
genuinely already succeeded. This is exactly what "requires clicking
twice" / "the confirmation hasn't actually saved" would look like from a
user's perspective, without needing an actual page refresh or a second
click at all — just a tab switch on the same page. (The task's own
framing that a *page refresh* loses the confirmation is separately true,
but for a different, intentional reason — see "Known issues" below.)

Fix: moved confirm-optimism tracking up to `ArcContent.jsx`, the one
component in this chain that never unmounts across its own tab-filter
switching (switching tabs is just its own `activeLabel` state changing).
`ArcContent` now owns a `confirmedIds` Set plus a `handleItemConfirmed(id)`
handler, threaded down through `BeatSection.jsx` (`confirmedIds`/
`onItemConfirmed`, passed straight through unowned) to `ContentCard.jsx`
as `locallyConfirmed`/`onConfirmed`. `ContentCard` no longer has a
`useState` at all — `isPending` is now a plain computed expression
(`Boolean(id) && status === "pending" && !locallyConfirmed`). Noted but
deliberately not fixed in the same pass: `BeatSection`'s own `flaggedIds`
Set has the identical structural exposure (it can also be unmounted by
`ArcContent`'s filtering, whenever every one of a beat's items gets
filtered out under some tab) — lower-stakes in practice, since a flagged
item is also excluded server-side on the next real fetch, and out of
this task's explicit scope (only confirm was reported broken). Worth the
same fix if ever reported.

**Verification**: `rm -rf .next && npm run build` compiles cleanly.
Beyond that, did real, adversarial browser-driven verification via
Playwright (installed temporarily via `npm install --no-save
playwright-core`, uninstalled after — confirmed via `git status` showing
no diff on `package.json`/`package-lock.json`, same pattern as every
other session that's used it):
- **Bugs 1/2** verified end to end against `/submit` with a mocked
  Supabase REST endpoint (route interception, same technique as Session
  39): no "Gojo Satoru" chip on load; typing a name and pressing Enter
  adds a chip; typing another name followed by a comma also adds a chip
  and leaves the input empty (not a stray comma); a chip's × removes
  only that chip, leaving others intact; the step-3 preview reflects the
  manually-typed tag; and after a successful submit, both "View arc
  page" (linking to the actually-selected arc's real slug) and "Back to
  home" render and are independently clickable, with "View arc page"
  confirmed to genuinely navigate to that arc's real page.
- **Bug 3** verified with a temporary, uncommitted test route
  (`app/verify-arc-content-temp/page.jsx`, deleted before finishing —
  never part of any commit) rendering `ArcContent` directly with a
  one-item fixture, since this bug is entirely client-side React state
  and doesn't need a real Supabase/AniList round trip to reproduce or
  fix. Mocked `/api/confirm` with an artificial 800ms delay to make the
  loading window observable: confirmed the button shows "Confirming…"
  and is disabled well before the mock resolves, and the pending badge
  stays visible the whole time the request is in flight — the literal
  ordering the task asked for, already true before this session's
  change. **Then proved the fix matters, not just the literal ask**: `git
  stash`ed the three component changes, reran the same test against the
  old code, and confirmed it actually fails the tab-switch check (pending
  badge and confirm button both reappear after switching to "Edits &
  Video" and back to "All") — then restored the fix and reran, confirming
  it now passes. This is a genuine regression test result, not an
  assumption: the old code measurably exhibits the bug, the new code
  measurably doesn't.

## Session 41

A user report between sessions ("comma doesn't commit a chip, only
Enter") turned out, on live verification (real discrete keystrokes via
Playwright, not a bulk `.fill()`), to already work correctly against
Session 40's code — no code change was made that turn, just verification
against the already-pushed branch.

This session is the actual follow-up: **remove comma as a chip-commit
trigger entirely**, requested directly this time — Enter is now the only
way to commit a character chip. `app/submit/page.jsx`'s
`handleCharacterInputKeyDown` dropped the `|| e.key === ","` branch (and
its own comment explaining the old dual-trigger behavior, now inaccurate);
a comma typed into the field is no longer intercepted at all — it inserts
literally, like any other character, and only becomes part of a chip if
the user includes it in the text before pressing Enter. The helper text
directly below the input changed from "Press Enter or comma to add a
character" to "Press Enter to add."

**Verification**: `npm run build` compiles cleanly. Playwright (installed
temporarily, uninstalled after, no diff on `package.json`/
`package-lock.json`) against a running `next dev`, using real discrete
key presses: typed "Megumi Fushiguro" character-by-character then pressed
comma on its own — confirmed no chip commits and the comma is inserted
into the input's value literally (`"Megumi Fushiguro,"`); pressed Enter
immediately after — confirmed that still commits the chip (with the
trailing comma as part of the chip's own text, exactly what was typed).
Confirmed the new helper text renders and the old comma-mentioning text
is gone. Screenshot-confirmed the chip and input visually.

## Session 42

Made the search page's arc list real — Phase 7 roadmap items 6 and (the
codebase's last remaining literal `TODO`) resolved together, requested
directly rather than picked up off the roadmap unprompted.

**Two new `lib/supabase.js` functions**, both used only by the search
page:
- `getSeriesByAnilistId(anilistId)` — resolves a `series` row from its
  AniList numeric id (`.limit(1).maybeSingle()`, same duplicate-row
  defense as `getArcRowBySlug`/`getArcMeta`). Deliberately distinct from
  the already-existing, shorter path: `getArcsBySeries(anilistSeriesId)`
  (Session 25) already queries `arcs` directly by its own
  `anilist_series_id` column with no series-table round trip at all, and
  would have done this job in one call — but the task explicitly asked
  for a `series`-table lookup by anilist_id feeding into
  `getAllArcsForSeries` (Session 39, keyed by the aniindex `series.id`
  FK), so that's what got built, not a substitution for the shorter
  existing function.
- `getArcSparkline(arcId)` — an arc's own beats ordered by order_index,
  shaped directly as Sparkline bars (`{heightPct, tier}`), same
  intensity/is_peak tier derivation `getTrendingArcs` (Session 37)
  already uses. Keyed by the arc's own row id, not its slug, since every
  caller already has a real `arcs` row in hand. Always an array, `[]` on
  no beats seeded yet or a query error — deliberately returns no
  fallback itself; that decision belongs to the caller.

**`app/search/page.jsx`**: the hardcoded `ARCS` (an 11-arc Chainsaw Man
placeholder list, unrelated to whatever series was actually searched —
the codebase's last literal `TODO` comment, originally left by Session 8)
and `MORE_ARCS_LABEL` are gone entirely, not just bypassed. Once AniList
resolves a series match, `getSeriesByAnilistId(series.id)` → (if found)
`getAllArcsForSeries(seriesRow.id)` → (per arc, via `Promise.all`)
`getArcSparkline(arc.id)`. Each real arc becomes `{slug, num (real
order_index, zero-padded), name (real title), spark, peak}` — `spark` is
the real sparkline, or a new `FLAT_SPARKLINE` constant (5 bars, 50%
height, "normal" tier) for the one arc-with-zero-beats case specifically,
per the task's explicit fallback request; `peak` is derived from whether
any of that arc's own beats is `is_peak` (a real read of the same data
already driving the sparkline, not a separate fabricated flag). If no
real arcs come back at all (series not seeded in Supabase, or seeded
with zero arcs), renders "No arcs indexed yet for this series." instead
— never the old hardcoded list. `ArcList.jsx` itself needed no changes:
it already linked each row to `/arc/[slug]` and already treated
`count`/`spark`/`peak` as optional (Session 25's own "omit rather than
fabricate" convention), so the real arc objects (which omit `count` —
no real per-arc fan-item-count query was asked for here, matching the
same convention as the arc page's nav strip and the series page's arc
list) render through it unchanged.

**Verification**: `npm run build` compiles cleanly. This page's Supabase
calls run server-side during SSR (an async Server Component, like the
arc page) — unlike `/submit`'s client-side calls, Playwright's
browser-side `page.route()` can't intercept them, so verification used a
small local mock PostgREST server (plain Node `http`, no new dependency)
seeded with one series (Jujutsu Kaisen, matching a real AniList id so a
real live AniList search — this sandbox can reach AniList directly, per
Session 26 — resolves to the same series the mock has arcs for) and two
arcs, one with real beats and one with none. Ran `next dev` with
`NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY` pointed at
that mock server (this project's own established convention, Sessions
18–21, for exactly this "server-side Supabase call" verification gap).
Confirmed via Playwright: both real arcs render with real titles/order;
the beat-having arc's sparkline reflects its real intensity/peak data;
the beat-less arc's sparkline is the flat fallback, not empty or broken;
a real click on an arc row navigates to its real `/arc/[slug]` page; and
searching a real, different AniList-resolvable series with nothing in
the mock `series` table renders the "No arcs indexed yet for this
series." message with zero arc rows, not a stale/fake list. Screenshot-
confirmed all three states. Playwright installed temporarily
(`playwright-core`, `npm install --no-save`) and uninstalled after —
confirmed via `git status` showing no diff on `package.json`/
`package-lock.json`.

## Session 43

Bug fix, requested directly: searching "Demon Slayer" on `/search`
returned the wrong series — AniList's own `SEARCH_MATCH` sort ranked
"Onigiri" (AniList id 21612, an obscure short whose alternate titles
happen to include "Demon Slayer") ahead of "Kimetsu no Yaiba" (id
101922, the real Demon Slayer TV series, ~100x more popular). Confirmed
live against AniList's real API before touching any code — `curl`ing the
exact GraphQL query `lib/anilist.js`'s `searchSeries` was already sending
reproduced the bug exactly (Onigiri first, popularity 8,872; the real
series fourth, popularity 972,447).

**Investigated the task's literal instruction before implementing it,
since one part of it was invalid AniList syntax**: the task asked to "add
`format: ANIME` to the search variables." AniList's schema has two
separate axes — `type` (`MediaType`: `ANIME`/`MANGA`) and `format`
(`MediaFormat`: `TV`/`TV_SHORT`/`MOVIE`/`OVA`/`ONA`/`SPECIAL`/`MUSIC`) —
and `ANIME` isn't a valid `MediaFormat` value at all. Confirmed this
directly against the live API: sending `format: ANIME` as a `MediaFormat`
variable gets a real GraphQL validation error (`Variable "$format" got
invalid value "ANIME"; Expected type MediaFormat.`), which would have
broken every search on the page, not fixed anything. The actual "restrict
to anime, not manga" intent behind that request is already fully covered
by `type: ANIME`, present in this query since Session 6 and left
unchanged — so `format` was deliberately not added, rather than adding
something that doesn't compile just to match the letter of the request.

**What was actually changed, in `lib/anilist.js`'s `searchSeries`**:
- `sort: SEARCH_MATCH` → `sort: POPULARITY_DESC` — this alone fixes the
  reported case: the real, popular series a search almost always means
  now outranks a coincidentally-similarly-named obscure one, rather than
  AniList's own text-relevance score doing the ranking.
- Added `popularity_greater: $minPopularity` to the query, with a new
  `MIN_SEARCH_POPULARITY = 1000` constant (matching the task's requested
  threshold) — excludes any result under that popularity outright, not
  just ranking it lower. Confirmed live against AniList's real API that
  `popularity_greater` is a real, valid filter argument on `Media`
  (unlike the invalid `format: ANIME` above) before relying on it.

**Verification**: `npm run build` compiles cleanly. Ran `next dev` and
hit the real `/search` route directly (this sandbox can reach AniList's
live API, confirmed again this session) for the exact reported query —
confirmed the series panel now shows "Demon Slayer: Kimetsu no Yaiba"
(real id 101922, popularity 972,447, `/series/101922`), not Onigiri.
Also re-ran three other known-good searches (Jujutsu Kaisen, Attack on
Titan, One Piece, Chainsaw Man) to confirm the sort change didn't
regress any series this app already seeds real arcs against — all four
still resolve to the correct real series. Directly `curl`ed the exact
GraphQL query/variables the updated code sends, independent of the Next
app, to confirm AniList's response ordering matches what the code now
relies on rather than trusting the rendered page alone.

## Session 44

Two cleanup fixes, requested together, framed as prep before a Phase 8.

**Fix 1 — arc page hero stats + hardcoded header fields.** Checked the
hero stats claim first, since it's easy to verify directly: Saves/This
week/Contributors *already* all rendered `"—"` (Session 37's own fix) —
confirmed by reading `app/arc/[slug]/page.jsx`'s `heroStats` array
directly, no code change needed there, and said so rather than silently
"fixing" something already correct. The real, unaddressed part of this
fix was the header's `badges`/`seasonPart`/`dateRange` (and the
breadcrumb's second segment) — flagged as an open gap in this file since
Session 24/25 (Phase 7 roadmap item 5) but never actually closed.
`episode_start`/`episode_end` are episode *numbers*, not air dates, and
nothing in this schema tracks a season/part label or an intensity/
spoiler classification at all — so "derive a real date range from real
episode numbers" isn't actually possible the way the task's own wording
hoped; the honest fix is hiding these fields for a real arc, not
inventing something that looks derived but isn't. `app/arc/[slug]/
page.jsx` now sets `seasonPart`/`dateRange` to `null` and `badges` to
`[]` whenever `arcMeta` is present (a real seeded arc), and narrows
`breadcrumb` to `[seriesName]` (drops the hardcoded `"Season 2"` second
segment) for the same case — all three keep their original hardcoded
values, unchanged, on the fallback path for an unseeded slug.
`components/ArcHero.jsx` updated to match: `seasonPart`/`dateRange` each
render (with their own `·` separator) only when truthy, and `badges`
defaults to `[]` rather than assuming it's always a populated array —
previously this component unconditionally rendered both fields and their
separators, which would have produced stray `"· ·"` dots once the page
started passing `null`.

**Fix 2 — search page's Characters column.** Replaced the hardcoded
`CHARACTERS` (8 fixed Chainsaw Man characters, unrelated to whatever
series was actually searched) with real AniList characters via
`getSeriesCharacters(series.id)` — the same `lib/anilist.js` function the
arc page and series page already call, keyed directly off the AniList id
the search match already carries (no extra Supabase round trip needed,
unlike the arc list). Each real character renders its real portrait when
AniList has one, or a small rotating-palette colored-initials fallback
(new `CHAR_AVATAR_COLORS`/`getInitials`, page-local, reusing the same
6-color palette `ArcHero`'s own hardcoded character list already used)
when it doesn't. Deliberately didn't reuse `components/CharacterChips.jsx`
(the shared component the arc/series pages already use for this exact
"real photo or colored-initials fallback" pattern) — this page's own
`.charsGrid`/`.charChip` visual design is a distinctly different grid/chip
style from that component's flat-list look, and the task was about fixing
the data, not restyling the section. Dropped the per-character mention
count entirely (no real per-character count exists — the old numbers were
invented) and the static "+14 more" label (no real "total minus shown"
count exists either) — both removed rather than kept fake, along with
their now-unused `.charCount`/`.moreChars` CSS rules. Renders "No
characters listed for this series." when AniList genuinely has none, or
when the fetch fails — caught in its own try/catch, separate from the
series-search fetch above, so a characters-specific failure can't take
down the series panel/arc list that already resolved successfully. The
"no arcs"/"no characters" empty-state box shares one CSS class now
(renamed `.noArcsMessage` → `.emptyColMessage`, since it's no longer
arcs-specific) rather than duplicating the same box style twice.

**Verification**: `npm run build` compiles cleanly. Fix 2 (search page)
verified directly against the real, live AniList API (no mock needed —
`getSeriesCharacters` doesn't touch Supabase) via `next dev`: searching
"Jujutsu Kaisen" renders real characters (Satoru Gojou, Yuuji Itadori,
Megumi Fushiguro, etc.) with real AniList portrait URLs, not the old
hardcoded Chainsaw Man names — confirmed the specific character chips
directly in the rendered HTML, not just eyeballing a screenshot, and
separately confirmed the *old* hardcoded names weren't merely still
present as a coincidence (Chainsaw Man's own search still shows Denji/
Power/Makima correctly, since those happen to be its own real cast too —
Jujutsu Kaisen was the meaningful test since its real cast is entirely
different from the old hardcoded list). Fix 1 (arc page) needed a mock,
since `getArcMeta`/`getArcBeats`/`getArcContent` run server-side during
SSR — this sandbox has no live Supabase credentials, so `next dev` was
run with `NEXT_PUBLIC_SUPABASE_URL` pointed at a small local mock
PostgREST server (this project's own established convention for exactly
this gap) seeded with one real-shaped arc row. Confirmed: the real,
seeded arc's hero-meta line renders only `"Episodes 38–47"` — no season
label, no date range, no badges, and the breadcrumb has no fake "Season
2" segment — while a genuinely unseeded slug still renders the full
original mockup (`"Episodes 38–47 · Season 2, Part 2 · Oct – Dec 2023"`
plus both badges), confirming the fallback path is untouched. Screenshot-
confirmed both. Playwright installed temporarily (`playwright-core`,
`npm install --no-save`) and uninstalled after — confirmed via `git
status` showing no diff on `package.json`/`package-lock.json`.

## Database schema

Four tables, **created and confirmed live** in the Supabase project
(verified in the Table Editor), designed to eventually replace the
hardcoded per-page consts documented above (`ARC_NAV`/`ARC`/
`INTENSITY_BEATS`/`BEATS` on the arc page, `ARCS`/`CHARACTERS`/
`TOP_CONTENT` on the search page, `ARCS` on the series page). Created
manually via the Supabase SQL editor, not through any tool/migration in
this repo. As of Session 10, `content_items` is genuinely written to by
`app/submit/page.jsx`'s step 3 submit button (see the Session 10 notes
above); `series`, `arcs`, and `beats` are also seeded with one real row
set (Jujutsu Kaisen / Shibuya Incident Arc / its ten beats) that
`/submit` depends on. No page *reads* from Supabase yet — `/submit`'s
step 2 beat chart and step 3 preview both still use `/submit`'s own
hardcoded `BEATS`/`RESOLVED_LINK` consts, and every other page is still
on Session 1–8 hardcoded data / AniList calls.

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
  `TOP_CONTENT` (search page) currently hardcode. As of Session 10,
  `/submit`'s step 3 button genuinely inserts into this table (see the
  Session 10 notes above) — it's no longer just a future destination.
  `arc_id` is required; `beat_id` is optional (nullable) since a
  submission could plausibly land at the arc level before/without a
  specific beat assignment. `status` (default `'pending'`) still
  anticipates the moderation workflow `/submit` has no backend for beyond
  writing the row (nothing reads `status` or shows a moderation queue
  yet). `submitted_by` was write-only (always the literal string
  `"anonymous"`) through Session 13; **as of Session 14 it holds a real
  Supabase `auth.uid()`-shaped user id for a signed-in submitter** (see
  the Session 14 notes above), and is read back out in two places: the
  arc page's "Yours" badge, and — once the Session 14 RLS policy has been
  run — a signed-in user's own non-public-status rows via
  `submitted_by = auth.uid()::text`. `confirmation_count` anticipates some
  future "confirm this is accurate" community signal that doesn't exist in
  the UI yet. `character_tags` is a Postgres `text[]`, matching
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

### Seed data (Session 10)

Run once in the Supabase SQL editor, after the tables above exist. Seeds
the one series/arc/beat set `/submit` currently saves content against:

```sql
insert into series (anilist_id, title, slug)
values (113415, 'Jujutsu Kaisen', 'jujutsu-kaisen');

insert into arcs (series_id, anilist_series_id, title, slug, episode_start, episode_end, order_index)
select id, 113415, 'Shibuya Incident Arc', 'shibuya-incident-arc', 38, 47, 6
from series
where anilist_id = 113415;

insert into beats (arc_id, title, order_index, intensity, is_peak)
select arcs.id, beat.title, beat.order_index, beat.intensity, beat.is_peak
from arcs
cross join (values
  ('Curtain falls',   1,  28, false),
  ('Shibuya station', 2,  35, false),
  ('Gojo arrives',    3,  54, false),
  ('Domain battle',   4,  63, false),
  ('The Sealing',     5,  87, true),
  ('Nanami',          6,  70, false),
  ('Yuji breaks',     7, 100, true),
  ('Nobara',          8,  77, false),
  ('Aftermath',       9,  42, false),
  ('Fallout',         10, 30, false)
) as beat(title, order_index, intensity, is_peak)
where arcs.slug = 'shibuya-incident-arc';
```


## Stack, file layout, and per-page hardcoded-data reference (superseded)

This file used to carry a separate "Stack" / "File layout" / "What each
component does" / "Hardcoded data (per page)" / "Explicitly not done"
reference here, written before Session 17 introduced the "Current State
— Handoff Audit" section above. Removed in Session 38's audit: every
piece of real information those sections held is already covered, more
accurately and without the duplication, by the Current State section's
own "Complete file inventory," "What's real vs. hardcoded, per page,"
"Fully working end-to-end," "Partially working," "Known issues," and
"Explicitly not built" subsections — which are the ones that have
actually been kept current every session since. This legacy block had
drifted out of sync (e.g. it still listed `lib/supabase.js` as exporting
only `getArcBeats`/`getArcContent`, missing the five other functions
added since) and one of its own paragraphs already said so in place
("this paragraph describes Session 9's original state and is stale").
Removing it isn't a loss of history — the session-by-session log earlier
in this file (Sessions 1 through 37, immediately after the Current State
section) is unaffected and remains the complete, append-only record of
how the project got built; this was a second, parallel *reference* doc,
not part of that log, and keeping two reference docs in sync every
session was exactly the fragmentation Session 17 was created to fix in
the first place.
