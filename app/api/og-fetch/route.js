// Resolves Open Graph metadata for a pasted content URL — powers the
// submit form's step 1 auto-detection (Session 12). Fetches the target
// page server-side (so no CORS issues, and no client-side credentials
// are exposed to third-party sites) and scrapes og:title/og:image/
// og:description/og:site_name out of the raw HTML with regex rather than
// a DOM/HTML-parsing dependency, matching this project's no-external-
// libraries convention (see PROJECT.md's Stack section).

import { createRateLimiter, getClientIp } from "@/lib/rateLimit";

// Session 48 (Phase 8, Session 2): 10 lookups per IP per hour. This is
// the more spam-prone of the two routes this task asked to rate-limit —
// every call makes a real outbound fetch to whatever URL a client hands
// it (SSRF-guarded below, but still a real network call this app pays
// for and exposes to abuse), unlike a rejected submission which never
// reaches Supabase at all. See lib/rateLimit.js for the sliding-window
// implementation and its own real caveats (in-memory only, not durable
// across Vercel's serverless instances).
const OG_FETCH_LIMIT = 10;
const OG_FETCH_WINDOW_MS = 60 * 60 * 1000;
const ogFetchLimiter = createRateLimiter({ limit: OG_FETCH_LIMIT, windowMs: OG_FETCH_WINDOW_MS });

const PLATFORM_HOSTS = [
  { platform: "tiktok", hosts: ["tiktok.com"] },
  { platform: "youtube", hosts: ["youtube.com", "youtu.be"] },
  { platform: "x", hosts: ["twitter.com", "x.com"] },
  { platform: "instagram", hosts: ["instagram.com"] },
  { platform: "reddit", hosts: ["reddit.com"] },
];

// Basic SSRF guard: reject obviously-local/internal hostnames before ever
// fetching. This is a hostname-literal check, not a DNS-resolution check —
// it won't catch a public domain that resolves to a private IP (DNS
// rebinding), which would need resolving DNS ourselves and validating the
// IP before connecting. Out of scope for this feature; noted here rather
// than silently assumed away.
const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^169\.254\./,
  /^\[?::1\]?$/,
];

function isBlockedHost(hostname) {
  return BLOCKED_HOSTNAME_PATTERNS.some((re) => re.test(hostname));
}

function detectPlatform(hostname) {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  const match = PLATFORM_HOSTS.find(({ hosts }) => hosts.some((h) => host === h || host.endsWith(`.${h}`)));
  return match ? match.platform : null;
}

// YouTube is handled entirely by fetchYouTubeOEmbed below, so this never
// sees a "youtube" platform in practice — kept scoped to the platforms
// that still go through the HTML-scraping path.
function detectCreator(platform, parsedUrl) {
  if (platform === "tiktok") {
    const match = parsedUrl.pathname.match(/\/@([^/?#]+)/);
    if (match) return `@${match[1]}`;
  }
  return parsedUrl.hostname.replace(/^www\./, "");
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

// Meta tags can appear as `<meta property="og:x" content="...">` or with
// the attributes in the opposite order — some sites also (non-standardly)
// use `name=` instead of `property=` for OG tags, so both are checked.
function extractMetaTag(html, property) {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*property=["']${escaped}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*name=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtmlEntities(match[1]);
  }
  return null;
}

async function fetchHtml(targetUrl) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; aniindexBot/1.0; +https://aniindex.app)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) {
      throw new Error(`The link responded with ${res.status}.`);
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new Error("That link didn't return a web page.");
    }
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

// YouTube actively blocks/serves incomplete markup to server-side scraping
// (confirmed: real YouTube submissions were coming back as "Untitled link"
// with no thumbnail via the regular og:* scrape), so YouTube uses its own
// public oEmbed endpoint instead — no API key required, and it's a fixed,
// known host we're fetching (`www.youtube.com`), not the user-supplied URL
// itself, so this doesn't need the SSRF hostname check that guards the
// general scrape path (the raw `targetUrl` is only ever passed along as an
// encoded query *value*, never fetched directly).
async function fetchYouTubeOEmbed(targetUrl) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(targetUrl)}&format=json`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`YouTube's oEmbed endpoint responded with ${res.status}.`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function POST(request) {
  const ip = getClientIp(request);
  const rate = ogFetchLimiter.check(ip);
  if (!rate.allowed) {
    const retryAfterSec = Math.ceil(rate.retryAfterMs / 1000);
    const retryAfterMin = Math.max(1, Math.ceil(retryAfterSec / 60));
    return Response.json(
      {
        error: `Too many link lookups from this IP — limit is ${OG_FETCH_LIMIT} per hour. Try again in about ${retryAfterMin} minute${retryAfterMin === 1 ? "" : "s"}.`,
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

  const rawUrl = body?.url;
  if (!rawUrl || typeof rawUrl !== "string") {
    return Response.json({ error: "A url field is required." }, { status: 400 });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return Response.json({ error: "That doesn't look like a valid URL." }, { status: 400 });
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return Response.json({ error: "Only http/https links are supported." }, { status: 400 });
  }

  if (isBlockedHost(parsedUrl.hostname)) {
    return Response.json({ error: "This URL can't be fetched." }, { status: 400 });
  }

  const platform = detectPlatform(parsedUrl.hostname);

  if (platform === "youtube") {
    let oembed;
    try {
      oembed = await fetchYouTubeOEmbed(parsedUrl.toString());
    } catch (err) {
      const message =
        err.name === "AbortError"
          ? "That link took too long to respond."
          : err.message || "Couldn't reach YouTube's oEmbed endpoint.";
      return Response.json({ error: message }, { status: 502 });
    }
    return Response.json({
      title: oembed.title ?? null,
      thumbnailUrl: oembed.thumbnail_url ?? null,
      platform: "youtube",
      creator: oembed.author_name ?? null,
    });
  }

  let html;
  try {
    html = await fetchHtml(parsedUrl.toString());
  } catch (err) {
    const message =
      err.name === "AbortError"
        ? "That link took too long to respond."
        : err.message || "Couldn't reach that link.";
    return Response.json({ error: message }, { status: 502 });
  }

  const ogTitle = extractMetaTag(html, "og:title");
  const ogImageRaw = extractMetaTag(html, "og:image");
  // Both extracted per spec but not currently surfaced in the response or
  // used in creator detection (og:site_name's only consumer, YouTube, is
  // now handled entirely by the oEmbed branch above) — no consumer needs
  // them yet; kept here so a future caller doesn't have to re-add the
  // extraction.
  const ogDescription = extractMetaTag(html, "og:description");
  const ogSiteName = extractMetaTag(html, "og:site_name");
  void ogDescription;
  void ogSiteName;

  // A handful of real-world sites emit a relative og:image path, which
  // technically violates the OG spec but is common enough to be worth
  // resolving against the page's own origin rather than dropping it.
  let thumbnailUrl = null;
  if (ogImageRaw) {
    try {
      thumbnailUrl = new URL(ogImageRaw, parsedUrl).toString();
    } catch {
      thumbnailUrl = null;
    }
  }

  const creator = detectCreator(platform, parsedUrl);

  return Response.json({
    title: ogTitle,
    thumbnailUrl,
    platform,
    creator,
  });
}
