const PLATFORM_META = {
  yt: { className: "plt-yt", icon: "▶", label: "YouTube" },
  tt: { className: "plt-tt", icon: "♪", label: "TikTok" },
  x: { className: "plt-x", icon: "𝕏", label: "Twitter" },
  ig: { className: "plt-ig", icon: "◈", label: "Instagram" },
  rd: { className: "plt-rd", icon: "⬆", label: "Reddit" },
};

export default function BeatSection({ beat }) {
  return (
    <div className="beat">
      <div className="beat-head">
        <div className="beat-title">{beat.title}</div>
        <div className="beat-ct">{beat.count.toLocaleString("en-US")} items</div>
        {beat.peakLabel && <div className="peak-pill">✦ {beat.peakLabel}</div>}
      </div>
      <div className="cards">
        {beat.items.map((item, i) => {
          const platform = PLATFORM_META[item.platform];
          return (
            <a key={i} className="card" href={item.href || "#"} target="_blank" rel="noreferrer">
              <div className="thumb" style={{ background: item.thumbGradient }}>
                <div className={`plt ${platform.className}`}>
                  {platform.icon} {platform.label}
                </div>
              </div>
              <div className="cbody">
                <div className="ctitle">{item.title}</div>
                <div className="ccreator">{item.creator}</div>
                <div className="tags">
                  {item.tags.map((tag) => (
                    <span
                      key={tag.label}
                      className={`tag ${tag.type === "char" ? "tag-char" : "tag-gen"}`}
                    >
                      {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
