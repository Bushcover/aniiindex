// Session 48 (Phase 8, Session 2). A simple in-memory sliding-window rate
// limiter, keyed by client IP — this project has no Redis or external
// cache (the only real runtime dependency is `@supabase/supabase-js`,
// see PROJECT.md's Stack section), so this is a deliberately minimal,
// in-process alternative, not a production-grade distributed limiter.
//
// Real limitation, not a theoretical one: Vercel serverless functions
// don't guarantee one warm, shared instance across requests — under
// concurrent load, or after a cold start/redeploy, a request can land on
// a fresh instance with an empty in-memory store, silently resetting
// that instance's own view of who's already hit the limit. This still
// meaningfully deters the casual/scripted spam this task is actually
// for, but it is not a hard guarantee against a determined attacker
// spreading requests across enough concurrent invocations, or a
// redeploy resetting every instance's state. A real guarantee would need
// a shared external store (Redis, Vercel KV, etc.) — explicitly out of
// scope per this task's own "simple in-memory store" instruction.

const DEFAULT_LIMIT = 10;
const DEFAULT_WINDOW_MS = 60 * 60 * 1000;

// Creates an independent limiter with its own private store. Callers
// that need different limits (og-fetch's 10/hour vs. submit's 5/24h)
// each make their own createRateLimiter() call, rather than sharing one
// Map keyed by a route+IP composite — this is what keeps two limiters
// from ever colliding on the same key by accident.
export function createRateLimiter({ limit = DEFAULT_LIMIT, windowMs = DEFAULT_WINDOW_MS } = {}) {
  // ip -> array of request timestamps (ms) within the current window.
  const store = new Map();

  return {
    // Records one request attempt for `key` and reports whether it's
    // within the limit. A true sliding window, not a fixed bucket: on
    // every call, timestamps older than `windowMs` are dropped before
    // counting, so the window continuously slides with real time rather
    // than resetting at fixed clock boundaries.
    check(key) {
      const now = Date.now();
      const windowStart = now - windowMs;
      const existing = store.get(key) ?? [];
      const recent = existing.filter((t) => t > windowStart);

      if (recent.length >= limit) {
        // Still writes the pruned array back — this is what keeps the
        // store from accumulating stale timestamps forever for an IP
        // that keeps hammering the limit. A rejected request's own
        // timestamp is deliberately not recorded, since it didn't count
        // against real usage.
        store.set(key, recent);
        const retryAfterMs = Math.max(0, recent[0] + windowMs - now);
        return { allowed: false, remaining: 0, retryAfterMs };
      }

      recent.push(now);
      store.set(key, recent);
      return { allowed: true, remaining: limit - recent.length, retryAfterMs: 0 };
    },
  };
}

// Extracts the client's IP from the standard `x-forwarded-for` header —
// the header Vercel's edge network sets to the real client IP (this repo
// has no other proxy/CDN in front of it). The header can be a
// comma-separated chain when multiple proxies were involved; the first
// entry is the original client. Falls back to a shared "unknown" bucket
// rather than throwing when the header is absent (e.g. local dev without
// a proxy in front) — every request with no header shares one bucket, a
// known, accepted weak spot for that specific case rather than disabling
// rate limiting entirely when the header is missing.
export function getClientIp(request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0].trim();
    if (first) return first;
  }
  return "unknown";
}
