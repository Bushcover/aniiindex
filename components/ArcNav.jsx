export default function ArcNav({ arcs }) {
  return (
    <div className="arc-strip-wrap">
      <div className="arc-strip">
        {arcs.map((arc) => (
          <div key={arc.slug} className={`arc-chip${arc.active ? " active" : ""}`}>
            {arc.name} <span className="num">{arc.count.toLocaleString("en-US")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
