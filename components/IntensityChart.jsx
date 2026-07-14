export default function IntensityChart({ beats }) {
  return (
    <div className="intensity-wrap">
      <div className="intensity-eyebrow">Community response by story beat</div>
      <div className="intensity-bars">
        {beats.map((beat) => (
          <div
            key={beat.label}
            className={`ibar${beat.tier === "high" ? " high" : ""}${beat.tier === "peak" ? " peak" : ""}`}
            style={{ height: `${beat.heightPct}%` }}
          >
            {beat.tier === "peak" && <div className="pdot"></div>}
          </div>
        ))}
      </div>
      <div className="ibar-lbls">
        {beats.map((beat) => (
          <div key={beat.label} className={`ibar-lbl${beat.tier === "peak" ? " peak" : ""}`}>
            {beat.label}
          </div>
        ))}
      </div>
    </div>
  );
}
