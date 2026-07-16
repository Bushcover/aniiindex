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

// Resolves an arc's row id from its slug. Returns null specifically when
// no arc matches (a normal, expected outcome — most slugs aren't seeded
// yet), but rethrows on any other error so a genuine failure (RLS,
// network) propagates to the caller instead of silently looking
// identical to "arc doesn't exist".
async function getArcRowBySlug(arcSlug) {
  const { data, error } = await supabase.from('arcs').select('id').eq('slug', arcSlug).single();
  if (error) {
    if (error.code === 'PGRST116') return null; // no matching row
    throw error;
  }
  return data;
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
// 'pending'])`, above) excludes the row from every future arc-page read, so
// this function doesn't need to do anything beyond the status write
// itself. Same Session 18/Phase 5 grant/policy requirement, and same
// Session 19 "detect a silently-blocked write" fix, as confirmContentItem
// above — chains `.select().maybeSingle()` and treats a null result as a
// real error rather than a false success.
//
// The `.select()` here only works because Session 19 also widened the
// "Public read access on content_items" policy to include 'flagged' (see
// PROJECT.md) — RLS filters UPDATE...RETURNING through the SELECT policy
// against the row's *new* values, so without that widening, a genuinely
// successful flag would look identical (empty result) to a blocked one.
export async function flagContentItem(id) {
  const { data: updated, error: updateError } = await supabase
    .from('content_items')
    .update({ status: 'flagged' })
    .eq('id', id)
    .select('id, status')
    .maybeSingle();

  if (updateError) {
    console.error('[flagContentItem] update failed for id', id, updateError);
    throw updateError;
  }

  if (!updated) {
    console.error(
      '[flagContentItem] update matched zero rows for id',
      id,
      '— likely blocked by RLS. Check that the Session 18 "grant update (confirmation_count, status)" + "Public can confirm or flag content_items" policy, and the Session 19 widened "Public read access on content_items" policy (PROJECT.md, Database schema section), have actually been run against this Supabase project.'
    );
    throw new Error(`No row was updated for content_items.id=${id} (likely blocked by RLS — see server logs).`);
  }

  return { id, status: updated.status };
}
