// Handles the actual content_items insert server-side — Session 48
// (Phase 8, Session 2). Moved here from app/submit/page.jsx's own
// client-side supabase.from('content_items').insert(...) call
// specifically so this route can rate-limit submissions by IP before
// writing; a client-side insert talks directly to Supabase's own REST
// endpoint from the browser, with no server request in between to
// rate-limit at all. No auth check here (matches the client-side insert
// this replaces, and this project's existing "Public insert access on
// content_items" RLS policy — see PROJECT.md's Database schema section)
// — rate limiting is the only new gate this route adds, not an auth
// requirement.

import { createContentItem } from "@/lib/supabase";
import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

// Session 49 (Phase 8, Session 3): the daily limit is now configurable
// via a real Vercel environment variable, SUBMIT_DAILY_LIMIT, instead of
// a hardcoded 5 — so this project's own maintainer can temporarily raise
// it (e.g. while seeding a batch of real content from one IP) without a
// code deploy. Parsed once at module load, same timing as every other
// env-var read in this app (lib/supabase.js's NEXT_PUBLIC_SUPABASE_URL/
// ANON_KEY) — a Vercel env var change takes effect on the next deploy or
// cold start, not instantly on every request, same as those. Falls back
// to 5 (Session 48's original hardcoded default) both when the variable
// is unset and when it's set to something that doesn't parse to a
// positive integer (e.g. left blank, or a typo like "five") — the task
// only asked for the "unset" case, but a silently-NaN or silently-zero
// limit would either break every submission or disable rate limiting
// entirely, so this guards both failure modes the same graceful-fallback
// way lib/supabase.js already treats a missing/malformed config value,
// rather than trusting the parsed number without checking it.
const parsedSubmitLimit = parseInt(process.env.SUBMIT_DAILY_LIMIT, 10);
const SUBMIT_LIMIT = Number.isInteger(parsedSubmitLimit) && parsedSubmitLimit > 0 ? parsedSubmitLimit : 5;
const SUBMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const submitLimiter = createRateLimiter({ limit: SUBMIT_LIMIT, windowMs: SUBMIT_WINDOW_MS });

// Presence-checked, not type/shape-validated beyond that — this route's
// caller (app/submit/page.jsx) already only ever sends real values here
// (a selected arc/beat's own real ids, the resolved-or-fallback link
// fields), so this is the same "catch an obviously malformed request"
// baseline app/api/confirm and app/api/flag already use (`if (!id)`),
// not a full schema-validation pass — a genuinely invalid arc_id/beat_id
// (e.g. one that doesn't exist) still fails at the database's own
// foreign-key constraint, surfaced below as a real Postgres error.
const REQUIRED_FIELDS = ["arc_id", "beat_id", "source_url", "title", "creator", "platform", "content_type"];

export async function POST(request) {
  const ip = getClientIp(request);
  const rate = submitLimiter.check(ip);
  if (!rate.allowed) {
    const retryAfterSec = Math.ceil(rate.retryAfterMs / 1000);
    const retryAfterHr = Math.max(1, Math.ceil(retryAfterSec / 3600));
    return Response.json(
      {
        error: `You've reached the limit of ${SUBMIT_LIMIT} submissions per day from this IP. Try again in about ${retryAfterHr} hour${retryAfterHr === 1 ? "" : "s"}.`,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const missing = REQUIRED_FIELDS.filter((field) => !body?.[field]);
  if (missing.length > 0) {
    return Response.json({ error: `Missing required field(s): ${missing.join(", ")}.` }, { status: 400 });
  }

  // Built explicitly, field by field, rather than spreading `body`
  // directly into the insert — this is what stops a caller from setting
  // `status` (or any other column) to anything other than what this
  // route intends, regardless of what the request body contains.
  // `status` in particular is always 'pending': the old client-side
  // insert also always sent 'pending' literally, but trusted the
  // client's own JS to keep sending it — this version no longer reads
  // `status` from the request at all, so it can't be overridden even by
  // a request built by hand outside the UI.
  const payload = {
    arc_id: body.arc_id,
    beat_id: body.beat_id,
    source_url: body.source_url,
    title: body.title,
    creator: body.creator,
    platform: body.platform,
    thumbnail_url: body.thumbnail_url ?? null,
    content_type: body.content_type,
    character_tags: Array.isArray(body.character_tags) ? body.character_tags : [],
    status: "pending",
    // Trusted as-sent, same as the client-side insert this route
    // replaces — the client resolves its own session (supabase.auth.
    // getSession()) and sends whatever user id that returns; this route
    // has no server-side session of its own to check it against (this
    // project has no @supabase/ssr-style cookie-based auth on the
    // server, only the browser client). Not a new gap this task
    // introduced — the old direct-from-browser insert had exactly the
    // same trust level, since content_items' own insert RLS policy is
    // `with check (true)`, not `submitted_by = auth.uid()`. Out of this
    // task's scope (rate limiting, not auth hardening) to close.
    submitted_by: typeof body.submitted_by === "string" && body.submitted_by ? body.submitted_by : "anonymous",
  };

  try {
    await createContentItem(payload);
    return Response.json({ ok: true });
  } catch (err) {
    // Intentional, permanent operational logging — same pattern as
    // app/api/confirm and app/api/flag's own catch blocks.
    console.error("[api/submit] insert failed", err);
    const message = err.message ? `${err.message}${err.code ? ` [${err.code}]` : ""}` : "Couldn't submit this content.";
    return Response.json({ error: message }, { status: 500 });
  }
}
