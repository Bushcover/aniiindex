import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Next.js patches the global `fetch` in Server Components and, absent an
// explicit cache directive, defaults to `force-cache` — so without this,
// every request this client makes during server-side rendering (e.g. the
// arc page's getArcBeats/getArcContent) is eligible to be cached and
// reused across requests, independent of anything Supabase or RLS is
// doing. `next: { revalidate: 0 }` on every request opts all of this
// client's traffic out of that cache, so server-rendered pages always see
// current data. Harmless for the browser-side calls /submit makes too —
// this option is meaningless outside of Next's server fetch patching.
function fetchWithoutCache(url, options = {}) {
  return fetch(url, { ...options, next: { revalidate: 0 } });
}

// Falls back to placeholder values instead of throwing when the env vars
// aren't set (e.g. a build environment that hasn't configured them yet) —
// createClient() throws synchronously otherwise, which crashes the build
// during static prerendering of any page that imports this module, even
// pages like /submit that only ever call Supabase from a client event
// handler. With the fallback, the module loads fine and any real request
// just fails at call time with a normal, catchable network error.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  { global: { fetch: fetchWithoutCache } }
);

// Runs once wherever this module is evaluated — during Next's server-side
// render (visible in Vercel's function/build logs) and again in the
// browser when the client bundle loads. Only logs presence/shape, never
// the actual key, so it's safe to leave in.
console.log(
  '[lib/supabase] url:', supabaseUrl ? supabaseUrl : '(missing — using placeholder)',
  '| anon key present:', Boolean(supabaseAnonKey),
  '| using placeholder fallback:', !supabaseUrl || !supabaseAnonKey
);

// Resolves an arc's row id from its slug. Returns null when no arc
// matches (a normal, expected outcome — most slugs aren't seeded yet),
// rethrows on any other error so a genuine failure (RLS, network)
// propagates to the caller instead of silently looking identical to "arc
// doesn't exist". Uses `.limit(1).maybeSingle()` rather than `.single()`
// (Session 25) — `.single()` throws not just on zero rows but also on
// *more than one* matching row, and this project's `arcs` table is
// seeded entirely by hand via the Supabase SQL editor (see PROJECT.md),
// so an accidental duplicate-slug insert is a real, unverified-from-this-
// sandbox possibility, not a hypothetical. `.limit(1)` means a duplicate
// row degrades to "pick one" instead of throwing and taking down every
// caller (getArcBeats/getArcContent) with it.
async function getArcRowBySlug(arcSlug) {
  const { data, error } = await supabase.from('arcs').select('id').eq('slug', arcSlug).limit(1).maybeSingle();
  if (error) throw error;
  return data; // null when no row matched
}

// Fetches an arc's own row — title, episode range, and the AniList series
// id it belongs to (`arcs.anilist_series_id`, present in the schema since
// Session 9 but unused by any page until now). This is what lets the arc
// page render a correct header and correct AniList series data for any
// seeded slug, not just the original hardcoded Shibuya/Jujutsu Kaisen
// case. Returns null if the slug doesn't match any seeded arc (caller
// should fall back to hardcoded data), matching getArcBeats/
// getArcContent's same null-means-"not seeded" convention. Same
// `.limit(1).maybeSingle()` duplicate-row defense as getArcRowBySlug
// above (Session 25).
export async function getArcMeta(arcSlug) {
  const { data, error } = await supabase
    .from('arcs')
    .select('title, episode_start, episode_end, anilist_series_id')
    .eq('slug', arcSlug)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data; // null when no row matched
}

// A short, hand-maintained map of AniList ids known to represent the
// same underlying show as another id this project's arcs are actually
// seeded under. AniList gives some anime a separate Media entry per
// season — Jujutsu Kaisen Season 1 is 113415 (what `arcs.
// anilist_series_id` is seeded with for both Shibuya Incident Arc and
// Vs. Mahito Arc), Season 2 is a completely different id, 145064
// ("Jujutsu Kaisen 2nd Season" / "JUJUTSU KAISEN Season 2", confirmed
// live against AniList's API, Session 30). A user who searches "JJK
// Season 2" specifically reaches 145064 and, without this map, would
// see zero real arcs on the series page — not because nothing is
// seeded, but because the exact id doesn't match what's stored.
//
// Deliberately a small hardcoded lookup rather than a live call to
// AniList's own `relations` field (which could discover this
// dynamically): that would mean an extra network request on every
// series-page view just to resolve a case this project has only ever
// hit once, for one show. A short, explicit map is simpler and matches
// this codebase's existing preference for small hardcoded lookups over
// speculative abstraction (see ARC_NAV, TABS, CONTENT_TYPE_OPTIONS,
// etc.) — extend it if/when another split-season case actually comes
// up, same as any of those.
const ANILIST_ID_ALIASES = {
  145064: [113415], // Jujutsu Kaisen Season 2 -> arcs seeded under Season 1's id
};

// Fetches every seeded arc belonging to a given AniList series id,
// ordered by order_index — added Session 25 for the arc page's nav strip
// and the series page's arc list, both of which previously showed a
// fixed hardcoded placeholder list regardless of which series/arc was
// actually being viewed. Unlike getArcMeta/getArcBeats/getArcContent,
// there's no single-row "not found" case here to distinguish with null —
// an AniList series with genuinely zero seeded arcs and one that errored
// look the same to a caller either way, so this always returns an array
// (empty if nothing matches or on any query error), and it's up to the
// caller to fall back to hardcoded data when that array is empty.
// Session 30: also checks ANILIST_ID_ALIASES so a known alternate id for
// the same show (e.g. a different season's own AniList entry) still
// finds the real arcs.
export async function getArcsBySeries(anilistSeriesId) {
  const ids = [anilistSeriesId, ...(ANILIST_ID_ALIASES[anilistSeriesId] ?? [])];
  const { data, error } = await supabase
    .from('arcs')
    .select('slug, title, episode_start, episode_end, order_index')
    .in('anilist_series_id', ids)
    .order('order_index', { ascending: true });
  if (error) {
    console.error('[getArcsBySeries] query failed for anilist_series_id', anilistSeriesId, error);
    return [];
  }
  return data ?? [];
}

// Fetches an arc's story beats (id, title, order_index, intensity,
// is_peak), ordered by order_index ascending. Returns null if the slug
// doesn't match any seeded arc (caller should fall back to hardcoded
// data), or an array (possibly empty) if the arc exists.
export async function getArcBeats(arcSlug) {
  const arc = await getArcRowBySlug(arcSlug);
  if (!arc) return null;

  const { data, error } = await supabase
    .from('beats')
    .select('id, title, order_index, intensity, is_peak')
    .eq('arc_id', arc.id)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Fetches an arc's submitted content (status 'confirmed' or 'pending'),
// joined with each item's beat to sort by the beat's order_index
// ascending, then by created_at descending within a beat. Returns null
// if the slug doesn't match any seeded arc, or an array (possibly empty)
// if the arc exists but has no matching content yet.
//
// The `.in('status', ['confirmed', 'pending'])` allowlist is also what
// keeps flagged items off the arc page (Session 18/Phase 5) — 'flagged'
// simply isn't in the list, so a flagged row silently drops out of the
// result set the moment app/api/flag/route.js sets it, with no separate
// exclusion needed.
export async function getArcContent(arcSlug) {
  const arc = await getArcRowBySlug(arcSlug);
  if (!arc) return null;

  const { data, error } = await supabase
    .from('content_items')
    .select(
      'id, source_url, title, creator, platform, thumbnail_url, content_type, character_tags, status, submitted_by, created_at, beat_id, beats(order_index)'
    )
    .eq('arc_id', arc.id)
    .in('status', ['confirmed', 'pending'])
    .order('created_at', { ascending: false });
  if (error) throw error;

  const items = data ?? [];
  items.sort((a, b) => {
    const orderA = a.beats?.order_index ?? Number.POSITIVE_INFINITY;
    const orderB = b.beats?.order_index ?? Number.POSITIVE_INFINITY;
    if (orderA !== orderB) return orderA - orderB;
    return new Date(b.created_at) - new Date(a.created_at);
  });
  return items;
}

// Fetches up to `limit` arcs that have real submitted content, ordered by
// most recently added content — the home page's "Trending arcs" section
// (Session 37; previously a fully hardcoded list of 6 fake arcs from other
// shows entirely). Supabase's query builder can't order rows by an
// aggregate ("this arc's most recent content_items row") directly, so this
// instead pulls a batch of the most recent visible content_items (500 is
// far more than this project's current real data volume, so in practice
// this captures every real item, not just a sample), embedding each item's
// arc/series in the same round trip, then collapses to one entry per
// arc_id in JS. Because the underlying query is already ordered newest-
// first, the *first* time an arc_id is seen is exactly that arc's most
// recent item, so a plain Map (which preserves insertion order) gives the
// right "most recently active arc" ordering for free, with no separate
// aggregate query needed.
//
// A second query fetches real beats for just the resulting arc ids, so the
// card's intensity chart and "Peak: ..." label are real per-arc data too,
// not the fake per-card intensity arrays the old hardcoded list used —
// same `heightPct`/`tier` shape the arc page's own `intensityBeats` already
// derives from `beats.intensity`/`is_peak` (see getArcBeats/ArcPage above).
//
// Returns fewer than `limit` entries (possibly zero) when fewer real arcs
// have content yet — deliberately not padded with anything fake; the home
// page is responsible for rendering an honest empty state for any
// remaining slots, not this function inventing placeholder arcs.
export async function getTrendingArcs(limit = 6) {
  const { data, error } = await supabase
    .from('content_items')
    .select('arc_id, platform, created_at, arcs(slug, title, episode_start, episode_end, series_id, series(title))')
    .in('status', ['confirmed', 'pending'])
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    console.error('[getTrendingArcs] content_items query failed', error);
    return [];
  }

  const byArc = new Map();
  for (const row of data ?? []) {
    // An arc_id can, in principle, point at a since-deleted arcs row (no
    // FK cascade is defined) — skip rather than render a card with no
    // real title/slug to link to.
    if (!row.arcs) continue;
    if (!byArc.has(row.arc_id)) {
      byArc.set(row.arc_id, { arc: row.arcs, count: 0, platforms: [] });
    }
    const entry = byArc.get(row.arc_id);
    entry.count += 1;
    if (row.platform && !entry.platforms.includes(row.platform)) entry.platforms.push(row.platform);
  }

  const topArcs = Array.from(byArc.entries())
    .slice(0, limit)
    .map(([arcId, entry]) => ({
      id: arcId,
      slug: entry.arc.slug,
      title: entry.arc.title,
      episodeStart: entry.arc.episode_start,
      episodeEnd: entry.arc.episode_end,
      seriesTitle: entry.arc.series?.title ?? null,
      count: entry.count,
      platforms: entry.platforms.slice(0, 3),
    }));

  if (topArcs.length === 0) return [];

  const { data: beatsData, error: beatsError } = await supabase
    .from('beats')
    .select('arc_id, title, order_index, intensity, is_peak')
    .in('arc_id', topArcs.map((a) => a.id))
    .order('order_index', { ascending: true });

  if (beatsError) {
    console.error('[getTrendingArcs] beats query failed', beatsError);
  }

  const beatsByArc = new Map();
  for (const beat of beatsData ?? []) {
    if (!beatsByArc.has(beat.arc_id)) beatsByArc.set(beat.arc_id, []);
    beatsByArc.get(beat.arc_id).push(beat);
  }

  return topArcs.map((a) => {
    const beats = beatsByArc.get(a.id) ?? [];
    const peakBeat = beats.find((b) => b.is_peak);
    return {
      ...a,
      spark: beats.map((b) => ({
        heightPct: b.intensity,
        tier: b.is_peak ? "peak" : b.intensity >= 50 ? "high" : "normal",
      })),
      peakLabel: peakBeat ? `Peak: ${peakBeat.title}` : null,
    };
  });
}

// Searches the series table by title (case-insensitive partial match) —
// added for /submit's Step 2 series picker (Phase 7), since a submission
// can now target any seeded series, not just the one hardcoded arc. A
// blank/whitespace-only query returns [] without querying at all, rather
// than matching every row (the caller debounces on every keystroke,
// including the empty string right after a character is deleted). Never
// throws — a failed query returns [] and logs, matching this file's other
// best-effort read functions (getArcsBySeries, getTrendingArcs) rather
// than getArcMeta/getArcBeats/getArcContent's throw-on-error convention,
// since this one only ever backs a live-typing search box, not a page's
// core data.
export async function searchSeries(query) {
  const trimmed = (query ?? '').trim();
  if (trimmed.length === 0) return [];

  const { data, error } = await supabase
    .from('series')
    .select('id, anilist_id, title, slug')
    .ilike('title', `%${trimmed}%`)
    .order('title', { ascending: true })
    .limit(10);

  if (error) {
    console.error('[searchSeries] query failed for', trimmed, error);
    return [];
  }
  return data ?? [];
}

// Fetches every arc belonging to a series's own row id (arcs.series_id),
// ordered by order_index — the second step of /submit's Step 2 picker,
// populated once searchSeries's caller has a real `series` row selected.
// Deliberately distinct from getArcsBySeries above: that one is keyed by
// `anilist_series_id` (used by the arc page's nav strip and the series
// page's arc list, both of which only ever have an AniList id in hand,
// via params.slug/the series page's own [slug] param); this one is keyed
// by the aniindex `series.id` foreign key instead, since /submit's series
// search resolves a real `series` row — with its own id — rather than an
// AniList id. Always returns an array, [] on no match or query error.
export async function getAllArcsForSeries(seriesId) {
  const { data, error } = await supabase
    .from('arcs')
    .select('id, slug, title, episode_start, episode_end, order_index')
    .eq('series_id', seriesId)
    .order('order_index', { ascending: true });

  if (error) {
    console.error('[getAllArcsForSeries] query failed for series_id', seriesId, error);
    return [];
  }
  return data ?? [];
}

// Increments a content item's confirmation_count by 1 and, once it reaches
// 2, flips status to 'confirmed' — the two-contributor threshold
// app/submit/page.jsx's own copy already promises ("Content stays pending
// review until a second contributor confirms the placement"). No-op
// (returns the row unchanged) if the item isn't currently 'pending', so a
// stray duplicate click or a confirm on an already-confirmed/flagged item
// can't double-count. Select-then-update, not a single atomic statement —
// a real race is possible if two confirms land on the exact same row at
// the same instant (the same accepted-trade-off style as this project's
// other no-auth, best-effort writes; see PROJECT.md's Known issues).
//
// Requires the Session 18/Phase 5 "confirm/flag" column grant + RLS policy
// (see PROJECT.md's Database schema section) to have been run — until
// then, Postgres's RLS silently matches zero rows for the update below
// instead of raising a permission error (this is real Postgres RLS
// behavior, not a bug in this function: a blocked UPDATE just looks like
// "no matching row" — there's nothing to distinguish "not permitted" from
// "doesn't exist" at the wire level). Session 19 fixed this function
// swallowing that exact case silently: the update below now chains
// `.select().maybeSingle()` and explicitly checks for a null result, so a
// blocked write is logged and thrown as a real error instead of being
// reported back as a false success.
export async function confirmContentItem(id) {
  const { data: current, error: selectError } = await supabase
    .from('content_items')
    .select('confirmation_count, status')
    .eq('id', id)
    .single();
  if (selectError) {
    console.error('[confirmContentItem] select failed for id', id, selectError);
    throw selectError;
  }

  if (current.status !== 'pending') {
    return { id, confirmationCount: current.confirmation_count, status: current.status };
  }

  const newCount = current.confirmation_count + 1;
  const newStatus = newCount >= 2 ? 'confirmed' : 'pending';

  const { data: updated, error: updateError } = await supabase
    .from('content_items')
    .update({ confirmation_count: newCount, status: newStatus })
    .eq('id', id)
    .select('id, confirmation_count, status')
    .maybeSingle();

  if (updateError) {
    console.error('[confirmContentItem] update failed for id', id, updateError);
    throw updateError;
  }

  if (!updated) {
    console.error(
      '[confirmContentItem] update matched zero rows for id',
      id,
      '— likely blocked by RLS. Check that the Session 18 "grant update (confirmation_count, status)" + "Public can confirm or flag content_items" policy (PROJECT.md, Database schema section) has actually been run against this Supabase project.'
    );
    throw new Error(`No row was updated for content_items.id=${id} (likely blocked by RLS — see server logs).`);
  }

  return { id, confirmationCount: updated.confirmation_count, status: updated.status };
}

// Sets a content item's status to 'flagged' — a one-way action with no
// undo UI (no moderation workflow exists yet, see PROJECT.md). Once
// flagged, getArcContent's own status allowlist (`in('status', ['confirmed',
// 'pending'])`, above) excludes the row from every future arc-page read.
// Same Session 18/Phase 5 grant/policy requirement as confirmContentItem.
//
// Session 21 correction: Sessions 19 and 20 both tried to independently
// re-verify that the flag actually took effect (first via
// `.select().maybeSingle()` chained onto the update, then via a separate
// before/after select comparison), on the theory that a blocked write
// fails *silently* (0 rows, no error) rather than raising a real error.
// That theory turned out to be wrong for this project's actual Supabase
// setup, and it was actively causing a *new* bug: a real production report
// showed the flag write itself genuinely succeeding (confirmed by the row
// disappearing from the arc page on the next load) while this function
// still reported failure, because the *verification* re-select — a plain
// `select('status').eq('id', id)` against a row whose status is now
// 'flagged', which isn't in the read policy's allowlist — was itself
// throwing a genuine Postgres `42501` (insufficient_privilege) error, not
// silently returning zero rows the way Session 19/20 assumed RLS-filtered
// reads always would. Chasing that error was the bug, not a signal of one.
//
// The fix is to stop second-guessing the write: `.update()` already
// returns `{ error }`, and if PostgREST accepted the request without
// error, the write happened — full stop. No follow-up select, no
// RETURNING, no reading the row back at all (which is also what avoids
// ever touching a 'flagged' row through the read policy in the first
// place). This does mean a hypothetical future "RLS silently swallows the
// write" failure mode (Session 19's original bug, before this project's
// real behavior turned out to differ) would no longer be independently
// caught here — but `updateError` below still catches any error Postgres
// actually raises, which per Session 21's own evidence is what a real
// permission problem on this table actually looks like.
export async function flagContentItem(id) {
  // Confirms the id exists and is currently readable before attempting to
  // write — a nonexistent id fails here with a clear PGRST116, rather than
  // an update that matches zero rows falling through silently.
  const { error: selectError } = await supabase.from('content_items').select('status').eq('id', id).single();
  if (selectError) {
    console.error('[flagContentItem] select failed for id', id, selectError);
    throw selectError;
  }

  const { error: updateError } = await supabase.from('content_items').update({ status: 'flagged' }).eq('id', id);
  if (updateError) {
    console.error('[flagContentItem] update failed for id', id, updateError);
    throw updateError;
  }

  return { id, status: 'flagged' };
}
