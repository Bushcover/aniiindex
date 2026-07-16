// Confirms a pending content_items row (Session 18/Phase 5's quality
// control layer) — powers the arc page's "Confirm placement" button
// (components/ConfirmButton.jsx). No auth required, matching the task:
// any viewer of a pending card can confirm it. All the actual logic
// (increment, threshold, no-op if not pending) lives in
// lib/supabase.js's confirmContentItem, same split as every other real
// write path in this app.

import { confirmContentItem } from "@/lib/supabase";

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
    return Response.json(item);
  } catch (err) {
    return Response.json({ error: err.message || "Couldn't confirm this item." }, { status: 500 });
  }
}
