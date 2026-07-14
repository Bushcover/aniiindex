import ContentCard from "@/components/ContentCard";

export default function BeatSection({ beat }) {
  return (
    <div className="beat">
      <div className="beat-head">
        <div className="beat-title">{beat.title}</div>
        <div className="beat-ct">{beat.count.toLocaleString("en-US")} items</div>
        {beat.peakLabel && <div className="peak-pill">✦ {beat.peakLabel}</div>}
      </div>
      <div className="cards">
        {beat.items.map((item, i) => (
          <ContentCard key={i} beatLabel={beat.title} {...item} />
        ))}
      </div>
    </div>
  );
}
