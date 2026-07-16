// Flags a content_items row (Session 18/Phase 5's quality control layer) —
// powers the arc page's flag button (components/FlagButton.jsx). No auth
// required. A flagged item is never removed here — lib/supabase.js's
// getArcContent already excludes anything outside
// `status in ('confirmed', 'pending')`, so a flagged row just stops
// appearing on the arc page's next load.

import { flagContentItem } from "@/lib/supabase";

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
    return Response.json(item);
  } catch (err) {
    return Response.json({ error: err.message || "Couldn't flag this item." }, { status: 500 });
  }
}
