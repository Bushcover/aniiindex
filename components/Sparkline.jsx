import styles from "./Sparkline.module.css";

export default function Sparkline({ bars, width = "34px", height = "20px", gap = "1.5px" }) {
  return (
    <div className={styles.sparkline} style={{ width, height, gap }}>
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
