import Link from "next/link";
import NavAuth from "@/components/NavAuth";

// Route-level loading UI — the Next.js "loading.jsx" convention. Next
// automatically wraps app/arc/[slug]/page.jsx in a <Suspense> boundary
// with this as the fallback, shown immediately on navigation while the
// page's own async data fetch (getArcMeta/getArcBeats/getArcContent, the
// Supabase+AniList Promise.allSettled calls) is still in flight, instead
// of a blank tab until everything resolves — the point of this session's
// pairing with the arc page's own caching change (revalidate 0 -> 300):
// most loads will now be served from cache and this will barely flash,
// but the first request after each 5-minute window (or any slow
// connection) is exactly when this actually matters.
//
// The nav is real, not a placeholder — same markup app/arc/[slug]/
// page.jsx itself renders, including a genuinely working NavAuth (a
// client component; loading.jsx is a perfectly normal place to render
// one). Nothing about the nav depends on this page's own data, so
// there's no reason to fake it. Everything below it is a simple skeleton
// (globals.css's .skel* classes, shared with app/series/[slug]/
// loading.jsx) shaped roughly like the real hero/tabs/card-grid layout —
// not a pixel-exact replica of it.
export default function ArcLoading() {
  return (
    <>
      <nav>
        <Link href="/" className="logo">
          ani<span>index</span>
        </Link>
        <div className="search-bar">
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Search series, arcs, characters…
        </div>
        <div className="nav-right">
          <button className="btn btn-ghost nav-browse-btn">Browse</button>
          <NavAuth signInClassName="btn btn-primary" />
        </div>
      </nav>

      <div className="arc-strip-wrap">
        <div className="arc-strip">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skel skel-chip" />
          ))}
        </div>
      </div>

      <div className="container">
        <div className="hero">
          <div className="skel skel-line" style={{ width: 160, height: 12, marginBottom: 14 }} />
          <div className="skel skel-title" />
          <div className="skel skel-line" style={{ width: 220, height: 13, marginBottom: 22 }} />
          <div style={{ maxWidth: 600, marginBottom: 22 }}>
            <div className="skel skel-line" />
            <div className="skel skel-line" />
            <div className="skel skel-line" style={{ width: "70%" }} />
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skel skel-stat" />
            ))}
          </div>
        </div>
      </div>

      <div className="tabs-wrap">
        <div className="container">
          <div className="tabs" style={{ padding: "12px 0" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skel skel-chip" style={{ width: 100 }} />
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
        <div className="cards">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ cursor: "default" }}>
              <div className="skel skel-thumb" />
              <div style={{ padding: 12 }}>
                <div className="skel skel-line" />
                <div className="skel skel-line" style={{ width: "60%" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
