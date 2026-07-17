import Link from "next/link";
import Sparkline from "@/components/Sparkline";
import styles from "@/app/search/search.module.css";

export default function ArcList({ arcs, moreLabel }) {
  return (
    <div className={styles.arcList}>
      {arcs.map((arc) => (
        <div key={arc.slug}>
          <Link href={`/arc/${arc.slug}`} className={styles.arcRow}>
            <div className={styles.arcNum}>{arc.num}</div>
            <div className={styles.arcRowName}>{arc.name}</div>
            {arc.spark && <Sparkline bars={arc.spark} />}
            {typeof arc.count === "number" && (
              <div className={styles.arcRowCount}>{arc.count.toLocaleString("en-US")}</div>
            )}
            {arc.peak && (
              <div className={styles.arcRowPeak}>
                <div className={styles.arcPeakDot}></div>
              </div>
            )}
            <div className={styles.arcRowArrow}>›</div>
          </Link>
          {arc.dividerAfter && <div className={styles.arcDivider}></div>}
        </div>
      ))}

      {moreLabel && (
        <div className={styles.showMore}>
          <span>{moreLabel}</span>
        </div>
      )}
    </div>
  );
}
