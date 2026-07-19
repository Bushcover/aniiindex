import "./globals.css";
import { buildOpenGraph } from "@/lib/metadata";

// Resolves the absolute origin `metadataBase` needs (required for Next to
// turn a page's relative `alternates.canonical`/`openGraph.url` into a
// real absolute URL). No custom domain is configured anywhere in this
// project (confirmed against PROJECT.md/package.json — Vercel serves this
// app on its own default *.vercel.app domain), so this prefers an
// explicit NEXT_PUBLIC_SITE_URL (unset today, but lets a future custom
// domain be pinned without another code change), falls back to Vercel's
// own build-time VERCEL_URL (a bare host, no protocol — hence the
// prepended "https://"), and finally a localhost dev default — same
// graceful-fallback shape as lib/supabase.js's own placeholder-URL
// convention, rather than throwing when nothing is configured.
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

// Phase 8 (Session 45, fixed Session 46): real per-page SEO metadata and
// Open Graph/Twitter previews, layered on top of these site-wide
// defaults. `title.template` lets every page below set just its own
// short title (e.g. "Sign in") and get " · Aniindex" appended
// automatically; a page that doesn't export its own title (the home
// page) falls back to `title.default` instead of being templated against
// itself. `openGraph`/`twitter` here are the shared site-level fields
// (name/type/locale/card) — no site-wide `images` default, deliberately:
// this app has no logo/social-card image asset anywhere in the repo (no
// `public/` directory exists at all), and per this project's "omit
// rather than fabricate" convention, pages with a real per-item image
// (arc/series/search, via AniList's own poster/banner) set their own
// `openGraph.images`/`twitter.images` instead of this file inventing a
// placeholder graphic.
//
// Session 46 fix: `openGraph` here uses `buildOpenGraph` (lib/metadata.js)
// purely so this root object and every page-level one share one literal
// `siteName` value — Next does NOT deep-merge a page's own `openGraph`
// object with this one (a page that defines its own `openGraph` replaces
// this whole object, not just the fields it overrides), so this root
// declaration alone does not make `og:site_name` show up on any page that
// sets its own `openGraph` (arc/home/series/search all do) — see each of
// those files' own `generateMetadata`/`metadata` for the actual fix.
// `twitter.card` changed from "summary" to "summary_large_image"
// (requested directly) — every page now claims the large-image card even
// when it has no image to back it up with; pages that also don't define
// their own `twitter` object inherit this default as-is.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Aniindex — Fan Content Index for Anime Arcs",
    template: "%s · Aniindex",
  },
  description:
    "A fan content index for anime series, arcs, and characters — fan edits, art, breakdowns, and discussion, organized by story beat.",
  openGraph: buildOpenGraph({ type: "website" }),
  twitter: {
    card: "summary_large_image",
  },
};

// Session 30: this was missing entirely. Without it, a real mobile
// browser doesn't render at the device's actual CSS pixel width — it
// assumes a desktop-sized layout viewport (~980px on iOS Safari) and
// zooms the whole page out to fit the screen. Chrome DevTools' and
// Playwright's viewport emulation both bypass this (they set the
// rendering viewport directly), which is exactly why Session 29's mobile
// testing found zero overflow there while real devices still showed it —
// every `@media (max-width: 768px)`/`(max-width: 480px)` rule added that
// session was very likely never matching on an actual phone at all,
// since the browser's layout viewport stayed near 980px regardless of
// the physical screen size.
export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        {/* Session 51: Bebas Neue added for the home page's hero headline
            only (see app/page.module.css's own .hero h1 rule) — Syne stays
            the display font everywhere else, unchanged. Bebas Neue ships a
            single real weight on Google Fonts (no :wght@ axis, unlike
            Syne/Inter above), so it's requested plainly by family name. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Bebas+Neue&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
