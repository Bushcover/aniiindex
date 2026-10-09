// Lets a submitter edit their own content_items row's beat assignment and
// content type (Session 63) — powers the arc page's small "Edit" control
// (components/EditSubmissionButton.jsx), shown only next to a card's own
// "Yours" badge. Unlike app/api/confirm and app/api/flag (deliberately
// anonymous — any viewer can act on any pending item), this route has to
// actually know *who* is calling, which this app's client-side-only
// Supabase session can't give it for free: there's no server cookie or
// @supabase/ssr middleware anywhere in this codebase (see lib/supabase.js's
// own comments), so a plain POST body carries no session on its own — the
// way app/api/submit's `submitted_by` is just trusted as a string, with no
// verification, works for an anonymous-friendly insert but isn't good
// enough for "only the actual owner can edit this."
//
// Instead, the client reads its own current access_token (via
// supabase.auth.getSession(), right before calling this route — see
// EditSubmissionButton's own comment) and sends it in the request body.
// This route verifies it server-side with supabase.auth.getUser(token) —
// which validates the JWT's signature against Supabase Auth itself, using
// nothing more than the already-public anon-key client — and uses the
// user id *that call returns*, never a client-supplied id, as the identity
// checked against the row's own submitted_by in
// lib/supabase.js's updateContentItemPlacement.
import { revalidateTag } from "next/cache";
import { supabase, updateContentItemPlacement, ARC_DATA_CACHE_TAG } from "@/lib/supabase";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { id, beat_id, content_type, access_token } = body ?? {};

  if (!id) {
    return Response.json({ error: "An id field is required." }, { status: 400 });
  }
  if (!content_type) {
    return Response.json({ error: "A content_type field is required." }, { status: 400 });
  }
  if (!access_token) {
    return Response.json({ error: "You must be signed in to edit a submission." }, { status: 401 });
  }

  const { data: userData, error: authError } = await supabase.auth.getUser(access_token);
  if (authError || !userData?.user) {
    return Response.json({ error: "Your session has expired — sign in again and retry." }, { status: 401 });
  }

  try {
    const item = await updateContentItemPlacement(
      id,
      { beatId: beat_id ?? null, contentType: content_type },
      userData.user.id
    );
    // Same reason as app/api/confirm and app/api/flag's own
    // revalidateTag calls: getArcContent reads through a 5-minute-cached
    // client (Session 50), so without this a just-edited item's new
    // beat_id/content_type could read stale on the arc page's next load
    // for up to the full cache window.
    revalidateTag(ARC_DATA_CACHE_TAG);
    return Response.json(item);
  } catch (err) {
    console.error("[api/edit-submission] failed for id", id, err);
    const status = err.statusCode || 500;
    return Response.json({ error: err.message || "Couldn't save your changes." }, { status });
  }
}
