const PLATFORM_META = {
  yt: { className: "plt-yt", icon: "▶", label: "YouTube" },
  tt: { className: "plt-tt", icon: "♪", label: "TikTok" },
  x: { className: "plt-x", icon: "𝕏", label: "Twitter" },
  ig: { className: "plt-ig", icon: "◈", label: "Instagram" },
  rd: { className: "plt-rd", icon: "⬆", label: "Reddit" },
};

export default function ContentCard({
  title,
  creator,
  platform,
  thumbnailUrl,
  contentType,
  characterTags,
  sourceUrl,
  beatLabel,
}) {
  const meta = PLATFORM_META[platform];
  const genTags = [].concat(contentType ?? []);
  const charTags = [].concat(characterTags ?? []);

  return (
    <a
      className="card"
      href={sourceUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={beatLabel ? `${title} — ${beatLabel}` : title}
    >
      <div className="thumb" style={{ background: thumbnailUrl }}>
        <div className={`plt ${meta.className}`}>
          {meta.icon} {meta.label}
        </div>
      </div>
      <div className="cbody">
        <div className="ctitle">{title}</div>
        <div className="ccreator">{creator}</div>
        <div className="tags">
          {genTags.map((tag) => (
            <span key={tag} className="tag tag-gen">
              {tag}
            </span>
          ))}
          {charTags.map((tag) => (
            <span key={tag} className="tag tag-char">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}
