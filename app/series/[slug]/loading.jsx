import SearchNav from "@/components/SearchNav";
import styles from "./series.module.css";

// Route-level loading UI — same Next.js "loading.jsx" convention as
// app/arc/[slug]/loading.jsx (see that file's own comment for the full
// explanation). The nav here is the real SearchNav (a client component;
// loading.jsx can render one same as any other component) — nothing
// about it depends on this page's own data. The hero/arc-list/character
// sections below reuse this page's own series.module.css classes for a
// closer visual match than globals.css's shared classes alone would give
// (this page's hero — poster + info block — has no equivalent shape on
// the arc page), filled with globals.css's shared `.skel*` shimmer
// blocks instead of real content.
export default function SeriesLoading() {
  return (
    <>
      <SearchNav query="" />

      <div className={styles.hero}>
        <div className={styles.heroInner}>
          <div className="skel skel-poster" />
          <div className={styles.info}>
            <div className="skel skel-line" style={{ width: 70, height: 11, marginBottom: 8 }} />
            <div className="skel skel-title" style={{ width: "45%" }} />
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div className="skel skel-line" style={{ width: 60, height: 13, marginBottom: 0 }} />
              <div className="skel skel-line" style={{ width: 60, height: 13, marginBottom: 0 }} />
              <div className="skel skel-line" style={{ width: 90, height: 13, marginBottom: 0 }} />
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skel skel-chip" style={{ width: 70, height: 22 }} />
              ))}
            </div>
            <div style={{ maxWidth: 640 }}>
              <div className="skel skel-line" />
              <div className="skel skel-line" style={{ width: "80%" }} />
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className="skel skel-line" style={{ width: 60, height: 16, marginBottom: 6 }} />
            <div className="skel skel-line" style={{ width: 260, height: 12, marginBottom: 0 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skel" style={{ height: 48, width: "100%" }} />
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <div className="skel skel-line" style={{ width: 90, height: 16, marginBottom: 6 }} />
            <div className="skel skel-line" style={{ width: 200, height: 12, marginBottom: 0 }} />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skel skel-chip" style={{ width: 110 }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
