// Flags a content_items row (Session 18/Phase 5's quality control layer) —
// powers the arc page's flag button (components/FlagButton.jsx). No auth
// required. A flagged item is never removed here — lib/supabase.js's
// getArcContent already excludes anything outside
// `status in ('confirmed', 'pending')`, so a flagged row just stops
// appearing on the arc page's *next* load — see the `revalidateTag` call
// below for what actually makes that happen promptly rather than up to
// 5 minutes late.

import { revalidateTag } from "next/cache";
import { flagContentItem, ARC_DATA_CACHE_TAG } from "@/lib/supabase";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const id = body?.id;
  if (!id) {
    return Response.json({ error: "An id field is required." }, { status: 400 });
  }

  try {
    const item = await flagContentItem(id);
    // Session 54: fixes a real, reproduced bug — getArcContent
    // (lib/supabase.js) reads through a 5-minute-cached Supabase client
    // (Session 50), so a just-flagged item could keep rendering on the
    // arc page for up to 5 minutes after this write already succeeded,
    // even though its own `status in ('confirmed', 'pending')` filter
    // was (and always was) correct — the query was never the bug, the
    // cached response predating this write was. Busting the tag here
    // forces the very next read fresh, without giving up the 5-minute
    // cache's benefit for every read that *isn't* immediately following
    // a flag.
    revalidateTag(ARC_DATA_CACHE_TAG);
    return Response.json(item);
  } catch (err) {
    // Intentional, permanent operational logging (not a leftover debug
    // log) — see the matching comment in app/api/confirm/route.js. Same
    // Session 19 bug report covered both routes.
    console.error("[api/flag] failed for id", id, err);
    return Response.json({ error: err.message || "Couldn't flag this item." }, { status: 500 });
  }
}
