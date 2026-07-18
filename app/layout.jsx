import "./globals.css";

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

// Phase 8 (Session 45): real per-page SEO metadata and Open Graph/Twitter
// previews, layered on top of these site-wide defaults. `title.template`
// lets every page below set just its own short title (e.g. "Sign in")
// and get " · Aniindex" appended automatically; a page that doesn't
// export its own title (the home page) falls back to `title.default`
// instead of being templated against itself. `openGraph`/`twitter` here
// are just the shared site-level fields (name/type/locale/card) — no
// site-wide `images` default, deliberately: this app has no logo/social-
// card image asset anywhere in the repo (no `public/` directory exists
// at all), and per this project's "omit rather than fabricate"
// convention, pages with a real per-item image (arc/series/search, via
// AniList's own poster/banner) set their own `openGraph.images`/
// `twitter.images` instead of this file inventing a placeholder graphic.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Aniindex — Fan Content Index for Anime Arcs",
    template: "%s · Aniindex",
  },
  description:
    "A fan content index for anime series, arcs, and characters — fan edits, art, breakdowns, and discussion, organized by story beat.",
  openGraph: {
    siteName: "Aniindex",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
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
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
