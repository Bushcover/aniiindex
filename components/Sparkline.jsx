import styles from "./Sparkline.module.css";

export default function Sparkline({ bars }) {
  return (
    <div className={styles.sparkline}>
      {bars.map((bar, i) => (
        <div
          key={i}
          className={[
            styles.spark,
            bar.tier === "high" ? styles.sparkHigh : "",
            bar.tier === "peak" ? styles.sparkPeak : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ height: `${bar.heightPct}%` }}
        />
      ))}
    </div>
  );
}
