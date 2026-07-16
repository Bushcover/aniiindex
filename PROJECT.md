# aniindex

A fan content index for anime series. Started as a single hardcoded
mockup page; as of Session 13 it has a real Next.js App Router
structure, real AniList GraphQL data on several pages, a real
Supabase database with a working (if narrowly-scoped) submission
pipeline, and real Supabase Auth magic-link sign-in. See "Current
State — Handoff Audit" immediately below for a full, current
snapshot; the session-by-session log after it is the historical
record of how each piece got built.

## Current State — Handoff Audit (as of Session 13)

This section is a complete, current-state snapshot of the project, written
as a handoff for whichever session picks this up next. The session-by-
session log below this section is still the accurate history of *how* the
project got here and *why* specific decisions were made — read this section
first for orientation, then the log for the reasoning behind any specific
piece of code.

**Stack**: Next.js 14 (App Router), plain JavaScript/JSX (no TypeScript), no
CSS framework (global stylesheet ported 1:1 from the original mockup, plus
colocated CSS Modules per page), `@supabase/supabase-js` as the only real
dependency beyond Next/React itself — Session 13's auth work uses the same
package's `supabase.auth` namespace, no new dependency was installed.
Default branch: **`claude/aniindex-arc-page-nextjs-wwizd5`** (not `main` —
this repo has no `main` branch; see the branch-related notes further down
this file for why). **This session's own work happened on
`claude/determined-lamport-roi673`**, a separate feature branch — not yet
merged into the default branch as of the end of this session; whoever
merges it should follow the same branch/Vercel-env lesson from the Session
10 follow-up notes (Preview vs. Production env vars) before assuming
`/auth` works on the deployed site.

**Phases so far, loosely**: Phase 1 (Sessions 1–5) converted static HTML
mockups into Next.js pages/components with 100% hardcoded data. Phase 2
(Sessions 6–8) wired real AniList GraphQL data into the search, arc, and
series pages. Phase 3 (Sessions 9–12) added Supabase as a real database —
schema, seeding, the submit form's real write path, the arc page's real
read path, real Open Graph/oEmbed link detection, and the bug fixes that
followed each of those. Phase 4 (Session 13, so far) added real Supabase
Auth magic-link sign-in and wired the nav to reflect signed-in/signed-out
state — see "Suggested next phase" at the end of this section for what's
still left to build on top of it (auth exists now, but nothing yet uses
*who* is signed in for anything).

### Complete file inventory

```
app/
  layout.jsx                    Root layout — Syne + Inter fonts, imports globals.css, static <head>/metadata
  globals.css                   Shared styles ported from the original mockup's <style> block
  page.jsx                      Home page — server component, 100% hardcoded data, composes HeroSearch + Sparkline
  page.module.css               Home-page-only styles
  arc/[slug]/page.jsx           Arc page — async server component; real Supabase beats/content + real AniList series/characters, both with hardcoded fallback; still has a temporary diagnostic console.log (see "Known issues")
  search/page.jsx                Search page — async server component; real AniList series panel only, everything else hardcoded
  search/search.module.css       Search-page-only styles (also imported by ArcList and the series page)
  submit/page.jsx                 3-step submission wizard — client component; real OG/oEmbed detection, real beat selector, real Supabase insert; still has 3 debug console.logs in handleSubmit (see "Known issues")
  submit/submit.module.css        Submit-page-only styles
  series/[slug]/page.jsx          Series page — [slug] is an AniList numeric id; real series + characters, hardcoded arc list
  series/[slug]/series.module.css Series-page-only styles
  api/og-fetch/route.js           POST route — real HTML/OG scraping (regex-based, no dependency) for TikTok/X/Instagram/Reddit; real YouTube oEmbed for YouTube; basic SSRF guard + 8s timeout
  auth/page.jsx                   (Session 13) Magic-link sign-in card — client component; calls signInWithEmail, shows idle/loading/success/error states
  auth/auth.module.css            (Session 13) Styles for both the sign-in card and the callback page (imported by both)
  auth/callback/page.jsx          (Session 13) Magic-link redirect handler — client component; exchanges the URL's `code` for a session (or falls back to checking for an already-parsed hash-based session), redirects to `/` or shows an error
lib/
  anilist.js                    searchSeries / getSeriesById / getSeriesCharacters / getSeriesWithRelations — real AniList GraphQL calls, each cached via Next's fetch cache (next: { revalidate: 3600 })
  supabase.js                   Exports the shared `supabase` client (fetch explicitly opted out of Next's cache) + getArcBeats / getArcContent
  auth.js                       (Session 13) signInWithEmail / signOut / getSession — thin wrappers around supabase.auth.{signInWithOtp,signOut,getSession}
components/
  ArcNav.jsx                   Horizontal arc-chip strip. Props: { arcs: [{ slug, name, count, active? }] }
  ArcHero.jsx                  Breadcrumb/title/meta/badges/description/characters/stats block. Props: { arc: { breadcrumb[], name, episodes, seasonPart, dateRange, badges[{type,label}], description, characters[], stats[{value,label}] } }
  ContentTabs.jsx               Sticky tab bar. Props: { tabs: [{ label, count, active? }] }
  IntensityChart.jsx            Ten-beat bar chart. Props: { beats: [{ label, heightPct, tier: "normal"|"high"|"peak" }] }
  BeatSection.jsx                One story-beat block + ContentCard grid. Props: { beat: { title, count, peakLabel, items: [] } } — items spread directly into ContentCard
  ContentCard.jsx                 Single fan-content card (default tall + compact horizontal modes). Props: { title, creator, platform, thumbnailUrl, contentType, characterTags, sourceUrl, beatLabel, compact? }. Also exports `getThumbnailStyle(thumbnailUrl)` (named export) — used by this component and by the submit page's preview card to correctly render either a real image URL or a CSS gradient/color value as a background
  ContentCard.module.css          Colocated styles for ContentCard's compact mode
  Sparkline.jsx                  Small bar-chart sparkline. Props: { bars: [{ heightPct, tier }], width?, height?, gap? }
  Sparkline.module.css            Colocated styles
  HeroSearch.jsx                  Client component — home page's hero search input + quick-search chips. No props; owns its own input state
  SearchNav.jsx                    Client component — search/series pages' nav (logo, search input, icon, clear). Props: { query: string }. (Session 13) Now renders NavAuth in its nav-right.
  CharacterChips.jsx               Character chip list (real photo or colored-initials fallback). Props: { characters: [{ id?, name, image?, color?, initials?, count? }] } — correctly uses backgroundImage: url(...) for real photos (this component never had the CSS bug ContentCard had)
  ArcList.jsx                     Arc-row list with sparklines, imports search.module.css directly. Props: { arcs: [{ slug, num, name, count, peak, spark[], dividerAfter? }], moreLabel? }
  NavAuth.jsx                     (Session 13) Client component — the auth-aware slice of a page's nav-right. Reads the session via lib/auth's getSession() on mount and subscribes to supabase.auth.onAuthStateChange to stay in sync; renders a "Sign in" link to /auth when signed out, or the user's email + a "Sign out" button when signed in. Props: { signInClassName? } (defaults to "btn btn-ghost", overridable per page — the arc page passes "btn btn-primary" to match its existing button styling). Used by app/page.jsx, app/arc/[slug]/page.jsx, and SearchNav.jsx (so both the search and series pages get it for free).
next.config.mjs                  images.remotePatterns allowlists i.ytimg.com and s4.anilist.co — configured but next/image isn't used anywhere yet (see "Known issues")
jsconfig.json                    Configures the "@/*" import alias
package.json                     Dependencies: next, react, react-dom, @supabase/supabase-js
```

### Supabase — full schema, RLS, and seed data (all confirmed live)

Four tables, created and seeded manually via the Supabase SQL editor (never
through a migration tool in this repo). Full current-state SQL:

```sql
-- Tables
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

-- RLS (final state, after two follow-up fixes — see Session 10/11 notes below for why)
alter table series enable row level security;
alter table arcs enable row level security;
alter table beats enable row level security;
alter table content_items enable row level security;

create policy "Public read access on series" on series for select using (true);
create policy "Public read access on arcs" on arcs for select using (true);
create policy "Public read access on beats" on beats for select using (true);
create policy "Public insert access on content_items" on content_items for insert with check (true);
create policy "Public read access on content_items" on content_items for select using (status in ('pending', 'confirmed'));
```

**No `UPDATE`/`DELETE` policy exists on any table** — those operations are
blocked for the anon/public role everywhere, by omission rather than an
explicit deny rule (this is how Postgres RLS works: no matching policy =
denied). None of the policies are scoped `to anon` specifically — they're
`PUBLIC`, a deliberate choice made after troubleshooting whether the
newer `sb_publishable_...`-format key maps to the `anon` role the same way
a legacy anon JWT does (see the Session 10 "still failing" follow-up).

**Seed data** — exactly one series/arc/beat set exists, seeded once:
- `series`: 1 row — Jujutsu Kaisen (`anilist_id: 113415`, `slug: 'jujutsu-kaisen'`)
- `arcs`: 1 row — Shibuya Incident Arc (`slug: 'shibuya-incident-arc'`, `episode_start: 38`, `episode_end: 47`, `order_index: 6`)
- `beats`: 10 rows for that arc, `order_index` 1–10: Curtain falls (28), Shibuya station (35), Gojo arrives (54), Domain battle (63), **The Sealing (87, is_peak)**, Nanami (70), **Yuji breaks (100, is_peak)**, Nobara (77), Aftermath (42), Fallout (30)
- `content_items`: however many real rows exist from actual testing/submissions through `/submit` in the live Supabase project — this repo/sandbox has no way to know that count; check directly in Supabase's Table Editor or via `select count(*) from content_items;`

**This is the only arc that can have real data** — `/submit`'s `ARC_SLUG`
constant and the arc page's fallback logic both hardcode
`"shibuya-incident-arc"`/AniList id `113415`. No other series/arc/beats
have ever been seeded.

### What's real vs. hardcoded, per page

- **`/` (home)** — 100% hardcoded (`NAV_LINKS`, `HERO_STATS`, `TRENDING_ARCS`, `POPULAR_SERIES`, `TRENDING_MOMENTS`, `FEATURES`). `HeroSearch` navigation (Enter / chip click → `/search?q=...`) is real and works. Trending arc card links all point at real slugs but only `shibuya-incident-arc` will ever show real data on the arc page.
- **`/arc/[slug]`** — Real for `shibuya-incident-arc` only: AniList series name/description/characters (keyed by hardcoded `ANILIST_SERIES_ID`, not `params.slug`), and Supabase beats/intensity-chart/content-cards (keyed by `params.slug`, this is the one place `params.slug` genuinely drives a query). Any other slug falls back entirely to the original hardcoded `ARC`/`INTENSITY_BEATS`/`BEATS`/`ARC_NAV` mockup data — the page never breaks, it just isn't real for that slug. `ARC_NAV`, `ARC`'s own fields (name, episodes, badges, stats), and `TABS` are hardcoded regardless of slug.
- **`/search`** — Real: the series panel (title, format, genres, score, popularity, episodes, poster), driven by `?q=`. Hardcoded regardless of query: `ARCS` (11-arc Chainsaw Man placeholder list), `CHARACTERS`, `TOP_CONTENT`, `FILTERS`, `ALSO_FOUND`, `RESULTS_SUMMARY`.
- **`/series/[slug]`** — Real: everything about the series itself (title, description, genres, score, format/year/episodes/status, banner/poster) and the top-10 character cast, both keyed directly by the numeric AniList id in the URL — the first (and still only) page where the URL's dynamic segment drives every real value shown. Hardcoded: `ARCS` (same placeholder list as the search page, duplicated not shared).
- **`/submit`** — Real: step 1's link detection (`/api/og-fetch` — title/thumbnail/platform/creator, debounced 500ms after typing stops), step 2's beat selector (real `beats` rows for the Shibuya arc, fetched via `getArcBeats` on mount), and the final submission (a real `content_items` insert). Hardcoded: `SERIES_DETECTED`/`ARC_DETECTED` (always Jujutsu Kaisen/Shibuya regardless of the pasted link's actual content), `INITIAL_CHARACTERS` (always one pre-checked "Gojo Satoru" chip), `CONTENT_TYPE_OPTIONS` (just labels). Structurally locked to the one seeded arc via `ARC_SLUG`. **Still not real, as of Session 13**: `submitted_by` stays hardcoded to `"anonymous"` even for a user who's genuinely signed in — nothing on this page reads the session yet (see "Suggested next phase").
- **`/auth`** (Session 13) — Real end to end: submitting an email calls the real `signInWithOtp`, with genuine loading/success/error states (error state is real, not simulated — this sandbox's network block on `*.supabase.co` reliably exercises it; success state verified against a mocked response, see the Session 13 notes below).
- **`/auth/callback`** (Session 13) — Real: exchanges the URL's `code` for a session via `exchangeCodeForSession`, or falls back to checking for an already-set session (implicit-flow magic links resolve via the URL hash instead), then redirects to `/` or shows an error. Not exercised against a real magic-link email in this project yet (see "Partially working" below).
- **Nav (all pages except `/submit`)** (Session 13) — Real: `NavAuth` reads the actual Supabase session client-side and shows "Sign in" (linking to `/auth`) when signed out, or the real signed-in email + a working "Sign out" button when signed in. `/submit`'s nav has never had a Sign in button (see its own compact nav in the Session 5 notes) and wasn't touched.

### Fully working end-to-end (verified this session and in prior sessions)

1. Home → arc card / quick-search chip / hero search → correct navigation.
2. `/search?q=<title>` → real AniList series panel for any real anime title.
3. `/series/<anilist-id>` → real series detail + real top-10 cast for any real AniList id; "Browse arcs" from a search result correctly threads the real id through.
4. `/arc/shibuya-incident-arc` → real AniList series description/characters + real Supabase beats/intensity chart/content cards, with real submitted items appearing under their correct beat.
5. Any other `/arc/<slug>` → clean fallback to the original hardcoded Shibuya mockup, no crash, no partial/mixed state.
6. `/submit` full wizard: paste a URL → real title/thumbnail/platform/creator auto-detected (TikTok/X/Instagram/Reddit via HTML scraping, YouTube via oEmbed) → pick a real story beat → review (real `ContentCard` preview, correct thumbnail rendering) → submit → real row lands in `content_items` → visible on the arc page under the correct beat on the next load (no caching in the way).
7. (Session 13) Every page's nav "Sign in" link genuinely navigates to `/auth` (confirmed by reading the rendered `href` directly on the home, arc, search, and series pages, not just visually). `/auth`'s form correctly shows the loading state, then either the real error banner (a genuine "Failed to fetch" from this sandbox's `*.supabase.co` network block — real proof the error path is wired, not simulated) or, with the OTP request mocked to succeed, the green "Check your email — we sent a magic link to `<email>`" success state with the real typed address interpolated. With a fake session injected into `localStorage` under Supabase's own storage-key convention, the nav correctly swaps to showing that session's email + a working "Sign out" button across a full page reload — proving `NavAuth`/`getSession` genuinely read persisted session state, not just in-memory state from the sign-in form.

### Partially working / needs attention

- **Submitted content only shows up if the RLS SQL above has actually been run.** This has been the source of three separate "it's not working" reports this session cycle (missing `SELECT` on `content_items`, and earlier, missing policies entirely) — if content still doesn't appear, check `pg_policies` before assuming a code bug (a ready-to-run inspection query is in the Session 10/11 follow-up notes below).
- **`/submit`'s auto-detection can fail or be slow**, and the wizard is designed to let the user proceed anyway with honest placeholders (`"Untitled link"`, a generic gradient, `platform: "other"`, `"Unknown creator"`) rather than block — but there's no way for the user to *manually* correct a wrong or missing title/creator/thumbnail. It's proceed-with-placeholder, not proceed-with-editing.
- **YouTube's oEmbed integration depends on YouTube's public endpoint staying free/unauthenticated** — it currently is, but this is an external dependency this project doesn't control.
- **`character_tags`/character detection on `/submit`** never reflects the real pasted content — always the one hardcoded Gojo Satoru chip, regardless of what's actually in the video/post.
- **Auth (Session 13) has never completed a real magic-link round trip.** Every piece was verified individually — the real `signInWithOtp` call (proven by its real network failure in this sandbox), `exchangeCodeForSession`/redirect logic (code-reviewed and exercised for the "no code, no session" error path, but never against a real Supabase-issued `code`), and the signed-in nav state (verified with an injected fake session, not a session Supabase itself issued) — but no session has actually clicked a real emailed magic link end to end, since this sandbox can't reach `*.supabase.co` or send/receive real email. Whoever picks this up next, outside this sandbox: submit a real email on `/auth`, click the link that arrives, and confirm it lands on `/auth/callback` and then `/` with the nav showing the signed-in state.
- **Nothing gates on being signed in yet.** `/submit` still writes `submitted_by: "anonymous"` regardless of whether the submitter has a real session (see "What's real vs. hardcoded, per page" above) — Session 13 built sign-in/sign-out itself, not anything that *uses* the signed-in identity.

### Known issues / cleanup needed

- **Two leftover temporary diagnostic `console.log` blocks are still in the code**, added during earlier troubleshooting sessions and never removed once the underlying issues were fixed:
  - `app/arc/[slug]/page.jsx` — a `[arc/[slug]] diagnostic:` log dumping `beatsResult`/`contentResult` status and values on every request.
  - `app/submit/page.jsx`'s `handleSubmit` — three `[submit] ...` logs around the arc lookup and insert.
  Both are genuinely harmless (server-side logs only, no secrets), but were explicitly marked "temporary" when added and should be removed as routine cleanup.
- **`next.config.mjs`'s `images.remotePatterns`** (Session 12 follow-up) allowlists `i.ytimg.com`/`s4.anilist.co` for `next/image`, but `next/image` isn't used anywhere in the codebase — all images render via plain CSS `background`/`backgroundImage` (correctly, as of the Session 12 follow-up thumbnail fix). This config is inert until/unless a future session actually adopts `next/image`.
- **`og-fetch`'s SSRF protection is a hostname-literal blocklist**, not DNS-resolution-aware — doesn't defend against a public domain that resolves to a private IP (DNS rebinding). Noted as an accepted, explicit trade-off when built, not an oversight.
- **`og-fetch` has no response-size cap**, only an 8-second timeout — a fast-but-huge response could still consume meaningful memory within that window.
- **This sandbox cannot reach `*.supabase.co` or general internet hosts**, so no session working from this environment can run a true, unmocked end-to-end verification against the live Supabase project or real third-party URLs. Every Supabase/OG-fetch-related change this project has made was verified either via mocked local servers (Playwright route interception, a local mock PostgREST/oEmbed server) or via SQL handed to the user to run and report back. Keep doing this — it's been reliable — but remember it means "verified" in this file always means "verified against a faithful mock," not "confirmed against production," unless a session note says otherwise.

### Explicitly not built

- **Auth — partially resolved in Session 13.** "Sign in" now genuinely links to `/auth`, which sends a real Supabase magic-link email and, once clicked, signs the user in (see "Fully working end-to-end" and "Partially working" above for what is and isn't verified yet). Still not built: `submitted_by` is still hardcoded to the literal string `"anonymous"` even for a signed-in user — nothing yet reads the session on `/submit` or anywhere else, so signing in doesn't currently change any app behavior beyond the nav itself.
- **No moderation workflow** — `content_items.status` defaults to `'pending'` and nothing in the app ever changes it, reads it for a moderation queue, or distinguishes `'pending'` from `'confirmed'` visually (the arc page shows both identically). `confirmation_count` is written as `0` and never incremented anywhere.
- **No tab/filter-pill filtering** on any page — clicking "Edits & Video," "Fan Art," an arc's content-type filter, etc. does nothing.
- **No pagination or "+N more" expansion** — every "+N more" affordance is static text.
- **No real per-arc/per-series routing beyond the one seeded arc** — `ARC_NAV` (arc page), `ARCS` (search + series pages) are still fully hardcoded placeholder arc lists unrelated to whatever series/arc is actually being viewed.
- **No manual correction UI on `/submit`** — no way to edit a wrong auto-detected title, pick a different series/arc, or add a character beyond the one hardcoded pre-filled chip; "+ Add character," the Series/Arc "Change" links, and "Skip this beat" are all inert.
- **No thumbnail images anywhere except real submitted content** — every hardcoded card (`BEATS` on the arc page, `TOP_CONTENT` on the search page) still uses a CSS gradient placeholder, not a real image.

### Suggested next phase (Phase 4+)

Roughly in order of "unblocks the most other things":

1. **Remove the two leftover debug `console.log` blocks** (see "Known issues") — trivial, no reason to carry them further.
2. **A real moderation view** — even a minimal one (a `/admin` or `?status=pending` view listing `content_items` where `status = 'pending'`, with buttons to flip it to `'confirmed'` or delete) would make the `status` column's existence pay off; right now every submission is invisible-but-present forever in the same way.
3. **Seed a second arc** (any real arc, doesn't have to be Jujutsu Kaisen) to prove the Supabase-backed arc/submit pipeline generalizes beyond the one hand-seeded case — right now "does this work for more than one arc" is untested by construction, not just unverified.
4. **Real arc-level routing** — replace `ARC_NAV`/search & series pages' `ARCS` with a real per-series `arcs` query (the `arcs` table already supports this; it's a `select ... where series_id = ...` away) once more than one arc exists to query.
5. **Manual correction on `/submit`** — at minimum, editable title/creator text fields that pre-fill from OG detection but can be overridden, since detection failing currently means a permanently generic placeholder with no recourse.
6. **Use the real signed-in identity now that auth (Session 13) exists** — wire `/submit`'s `submitted_by` to the real session's user id/email instead of the literal string `"anonymous"` (falling back to `"anonymous"` only when genuinely signed out), and confirm a real magic-link round trip against the live Supabase project from outside this sandbox (see the Session 13 "Partially working" note above) — this is the natural prerequisite for any moderation permissions model, not a fresh "add auth" task anymore.
7. **`next/image` adoption**, now that the `remotePatterns` config exists for it — would give real thumbnails proper optimization/lazy-loading instead of a raw CSS background.
8. **Tab/filter-pill filtering** — needs a real per-item `content_type` taxonomy decision first (right now `content_type` is a free-text string chosen from a fixed label list, not an enum/id), then straightforward client-side or query filtering.

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
  specific beat assignment. `status` (default `'pending'`) and
  `submitted_by` anticipate the moderation workflow `/submit` still has no
  backend for beyond writing the row (nothing reads `status` or shows a
  moderation queue yet); `confirmation_count` anticipates some future
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
  (**Note**: this paragraph describes Session 9's original state and is
  stale — by Session 10/11 the tables are genuinely read/written; see the
  "Current State — Handoff Audit" section at the top of this file for
  what's actually true today.)
- **Supabase Auth** (Session 13) — magic-link email sign-in, using the same
  `@supabase/supabase-js` client's `auth` namespace (no separate package).
  `lib/auth.js` exports `signInWithEmail`/`signOut`/`getSession`; see the
  Session 13 notes above for the full `/auth` + `/auth/callback` + nav
  wiring.

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
  submit/page.jsx         The 3-step "Add content" wizard. Client component; owns all wizard state (see Session 5 notes above). Step 3's submit button writes a real row to Supabase's content_items table (see Session 10 notes above). Step 1 debounces real Open Graph auto-detection via /api/og-fetch (see Session 12 notes above).
  submit/submit.module.css Styles unique to the submit page
  series/[slug]/page.jsx  The series page — [slug] is an AniList numeric id, not an aniindex slug (see Session 8 notes above)
  series/[slug]/series.module.css  Styles unique to the series page
  api/og-fetch/route.js  POST route: fetches a pasted URL server-side and extracts Open Graph metadata + platform/creator (see Session 12 notes above)
  auth/page.jsx           (Session 13) Magic-link sign-in card, client component
  auth/auth.module.css    (Session 13) Styles shared by auth/page.jsx and auth/callback/page.jsx
  auth/callback/page.jsx  (Session 13) Magic-link redirect handler, client component
lib/
  anilist.js             searchSeries / getSeriesById / getSeriesCharacters / getSeriesWithRelations — AniList GraphQL calls, cached via Next's fetch cache (see Session 6/7/8 notes above)
  supabase.js             Exports a shared Supabase client (Session 9) plus getArcBeats / getArcContent (Session 11); used by app/submit/page.jsx (Session 10) and app/arc/[slug]/page.jsx (Session 11)
  auth.js                 (Session 13) signInWithEmail / signOut / getSession — wraps the shared client's supabase.auth namespace
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
  SearchNav.jsx        Client component: search page's nav — logo link, functional search input/icon/clear. (Session 13) Also renders NavAuth.
  CharacterChips.jsx   Character chip list (photo or colored-initials fallback, optional mention count) — used by ArcHero and the series page
  ArcList.jsx          Arc-row list with sparklines (imports search.module.css) — used by the search page and the series page
  NavAuth.jsx           (Session 13) Client component: the signed-in/signed-out slice of a page's nav — used by app/page.jsx, app/arc/[slug]/page.jsx, and SearchNav.jsx
jsconfig.json           Configures the "@/*" import alias used for components (e.g. "@/components/ArcNav")
```

The top site nav bar (logo, search bar/links, Sign in/Submit content
buttons) and the footer/feature-pill content are rendered directly in
each page file rather than split into extra shared components, since nav
contents differ meaningfully between the arc, search, and home pages
(different links, different search UI). **One exception, since Session
13**: the Sign in/Sign out slice specifically is shared via `NavAuth`,
since that piece — unlike the rest of each nav — needs identical
client-side session logic everywhere it appears, not just similar-looking
markup.

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
- **NavAuth** (Session 13) — client component; the signed-in/signed-out
  slice of a page's `nav-right`. Reads the session via `lib/auth`'s
  `getSession()` on mount and subscribes to `supabase.auth.onAuthStateChange`
  to stay live. Renders a `next/link` to `/auth` reading "Sign in" (its
  class is a `signInClassName` prop, default `"btn btn-ghost"`) when
  signed out, or the session's email (`.nav-auth-email`) + a "Sign out"
  button when signed in. Used by `app/page.jsx`, `app/arc/[slug]/page.jsx`,
  and `SearchNav` (so the search and series pages get it too).

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
  `params.slug`. **`params.slug` itself is now used** (Session 11) — just
  not here yet; `getArcBeats`/`getArcContent` key off it, but `ARC_NAV`'s
  own list and `active` flag are still the fixed array above regardless of
  which slug is in the URL.
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
- `INTENSITY_BEATS` — **fallback only, as of Session 11.** When
  `params.slug` matches a seeded arc, the intensity chart is built from
  real `beats` rows via `getArcBeats` instead (see the Session 11 notes
  above); this hand-picked array only renders for a slug that isn't in
  the database yet (i.e. everything except `shibuya-incident-arc` today).
- `BEATS` — **fallback only, as of Session 11**, same as
  `INTENSITY_BEATS` above. When the arc is found in the database, the
  beat sections and their `ContentCard`s are built from real
  `content_items`/`beats` rows via `getArcContent`/`getArcBeats`
  (`buildBeatSections` in `app/arc/[slug]/page.jsx`) — one section per
  real beat, including beats with zero submitted items, rather than this
  three-section, always-populated hardcoded array. `thumbnailUrl` for
  real content items is still whatever `content_items.thumbnail_url`
  holds — currently a CSS `linear-gradient(...)` string for the one item
  seeded/submitted so far (Session 10's `/submit` flow doesn't do real
  thumbnail extraction either), same caveat as the hardcoded data it
  replaces: will need to switch to a real `background-image: url(...)`
  or an `<img>` once actual thumbnail images exist anywhere in the
  pipeline.

## Hardcoded data (in `app/submit/page.jsx`)

- ~~`RESOLVED_LINK`~~ — **removed in Session 12.** Step 1's link resolution
  is now genuinely real, via `/api/og-fetch` — see the Session 12 notes
  above. `DEFAULT_THUMBNAIL` and `PLATFORM_LABELS` remain as the honest
  fallbacks used when detection hasn't succeeded (still loading, or
  failed and the user is proceeding manually).
- `SERIES_DETECTED` / `ARC_DETECTED` — the step 2 "auto-detected" series
  and arc, always Jujutsu Kaisen / Shibuya Incident Arc regardless of the
  resolved link. A real version needs actual title/caption parsing (or
  manual series/arc pickers behind the still-inert "Change" links).
  `note` is the small "Detected from…" explainer text under each field.
  Note this is a step *behind* Session 12's link detection now — the link
  title/platform/creator are real, but which series/arc that content
  belongs to is still guessed from nothing.
- ~~`BEATS`~~ — **removed in the Session 11 follow-up.** The 10-bar beat
  selector now renders from `realBeats`, fetched live via
  `getArcBeats(ARC_SLUG)` on mount — real titles and real intensities,
  not a hand-picked hardcoded array. See the Session 11 follow-up notes
  above.
- `INITIAL_CHARACTERS` — the one pre-detected character chip (Gojo
  Satoru). A real version needs actual character detection from the
  video/caption, plus a working character picker behind "+ Add
  character" (currently inert).
- `CONTENT_TYPE_OPTIONS` — the 6 content-type pills; "Edit / AMV" is
  preselected to match the mockup. These are just labels, not IDs tied to
  any real taxonomy yet.
- `ARC_SLUG` (Session 10) — the one arc real submissions can currently be
  saved against (`"shibuya-incident-arc"`, matching the Part 1 seed
  data's `arcs.slug`). Not itself hardcoded *display* data like the
  consts above — it's the lookup key `handleSubmit` uses to find the real
  `arc_id` at submit time.

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

- **Partially resolved in Session 11**: `params.slug` now drives real
  queries (`getArcBeats`/`getArcContent`) for the intensity chart and beat
  sections — `/arc/shibuya-incident-arc` shows real data, any other slug
  falls back to the hardcoded Shibuya mockup data (see the Session 11
  notes above). Still not real: `ARC_NAV`, `ARC`'s own fields (name,
  episodes, badges, stats), and `TABS` are all still the same fixed data
  regardless of the URL's `[slug]` — the arc links clicked from the
  search page and the home page's trending arc cards
  (`/arc/introduction-arc`, `/arc/rumbling-arc`, etc.) render real beats
  only if that exact slug happens to be seeded (today, only
  `shibuya-incident-arc` is), and the hardcoded Shibuya mockup data for
  everything else on the page regardless.
- **Resolved in Session 6**: the `?q=` query param on `/search` is now
  read and drives a real AniList lookup for the series panel. What's
  still not real: the arc list, characters, "also found," and top
  content sections all stay fully hardcoded regardless of `?q=` (see the
  Session 6 notes above) — e.g. searching "Attack on Titan" shows a real
  AniList series panel over a hardcoded Chainsaw Man arc list.
- No tab/filter-pill filtering on any page — clicking a tab or a filter
  pill doesn't change which items are shown.
- No auth — the nav's "Sign in" buttons and character chip links are
  still static, non-functional markup. **Partially resolved in Sessions
  9–11**: a real database (Supabase) now exists, `/submit`'s final step
  genuinely writes to it, and the arc page reads real beats/content back
  out for seeded arcs (see below) — but there's still no login/identity
  system behind `submitted_by` (hardcoded to the string `"anonymous"`),
  and no moderation UI reads/changes a `content_items` row's `status`
  beyond the hardcoded `'pending'` every submission is written with.
  **Further resolved in Session 13**: the nav's "Sign in" button now
  genuinely links to `/auth`, which sends a real Supabase magic-link email
  and signs the user in on click-through; the nav reflects real
  signed-in/signed-out state (email + Sign out button vs. Sign in link).
  Character chip links are still inert (unrelated to auth — no character
  detail/filter page exists). `submitted_by` is still hardcoded to
  `"anonymous"` even for a signed-in user, and there's still no moderation
  UI — Session 13 built the identity layer itself, not anything that
  consumes it yet (see "Suggested next phase" in the Current State section
  above).
- No pagination/infinite scroll for the card grids, and no real
  expansion behind the "+N more" affordances on the search page.
- No real series/arc/character *detection* on `/submit` —
  `SERIES_DETECTED`, `ARC_DETECTED`, and `INITIAL_CHARACTERS` are all
  still hardcoded regardless of what URL the user actually pastes; the
  Series/Arc "Change" links, "+ Add character", "Skip this beat", and
  "How placement works" links are all still inert. **Resolved in Session
  10**: the final step's submit button is no longer disabled — clicking
  "Add to aniindex" performs a real Supabase insert into `content_items`
  using the real (typed) `source_url`, the real selected `content_type`/
  `character_tags`/beat, and a real, currently hardcoded-to-Shibuya
  `arc_id`, with genuine success/error feedback (see the Session 10 notes
  above). Submissions are real database rows now; they just can't yet be
  placed against any arc other than Shibuya, and nothing downstream (an
  arc page's moderation view) reads `status` or displays these rows by
  status yet — the arc page (Session 11) does now display them, just not
  filtered/grouped by status. **Resolved in Session 12**: link
  resolution itself is real — `/api/og-fetch` genuinely fetches the
  pasted URL and extracts its real title/thumbnail/platform/creator (see
  the Session 12 notes above), replacing what was previously a fully
  fake, always-the-same-TikTok-item stand-in.
