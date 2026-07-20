// Confirms a pending content_items row (Session 18/Phase 5's quality
// control layer) — powers the arc page's "Confirm placement" button
// (components/ConfirmButton.jsx). No auth required, matching the task:
// any viewer of a pending card can confirm it. All the actual logic
// (increment, threshold, no-op if not pending) lives in
// lib/supabase.js's confirmContentItem, same split as every other real
// write path in this app.

import { revalidateTag } from "next/cache";
import { confirmContentItem, ARC_DATA_CACHE_TAG } from "@/lib/supabase";

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
    const item = await confirmContentItem(id);
    // Session 54: same fix as app/api/flag/route.js — getArcContent
    // reads through a 5-minute-cached client (Session 50), so without
    // this a just-confirmed item's `status`/`confirmation_count` could
    // read stale for up to 5 minutes on the arc page's own next load
    // (Session 53's own "Awaiting second confirmation" label depends on
    // a fresh `confirmation_count`, which this also fixes as a direct
    // consequence, not a separate change).
    revalidateTag(ARC_DATA_CACHE_TAG);
    return Response.json(item);
  } catch (err) {
    // Intentional, permanent operational logging (not a leftover debug
    // log) — added in Session 19 after a real bug report ("Confirm
    // placement" wasn't persisting) turned out to be a Supabase RLS write
    // silently doing nothing rather than erroring. This is what actually
    // surfaces a failure in Vercel's function logs; see
    // confirmContentItem in lib/supabase.js for the deeper diagnostic.
    console.error("[api/confirm] failed for id", id, err);
    return Response.json({ error: err.message || "Couldn't confirm this item." }, { status: 500 });
  }
}
