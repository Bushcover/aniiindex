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
export async function getArcContent(arcSlug) {
  const arc = await getArcRowBySlug(arcSlug);
  if (!arc) return null;

  const { data, error } = await supabase
    .from('content_items')
    .select(
      'id, source_url, title, creator, platform, thumbnail_url, content_type, character_tags, status, created_at, beat_id, beats(order_index)'
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
