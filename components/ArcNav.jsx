import Link from "next/link";

export default function ArcNav({ arcs }) {
  return (
    <div className="arc-strip-wrap">
      <div className="arc-strip">
        {arcs.map((arc) => (
          <Link key={arc.slug} href={`/arc/${arc.slug}`} className={`arc-chip${arc.active ? " active" : ""}`}>
            {arc.name}
            {typeof arc.count === "number" && (
              <span className="num">{arc.count.toLocaleString("en-US")}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
