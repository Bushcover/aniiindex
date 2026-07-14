import styles from "./ContentCard.module.css";

const PLATFORM_META = {
  yt: { className: "plt-yt", compactClassName: styles.compactPltYt, icon: "▶", label: "YouTube" },
  tt: { className: "plt-tt", compactClassName: styles.compactPltTt, icon: "♪", label: "TikTok" },
  x: { className: "plt-x", compactClassName: styles.compactPltX, icon: "𝕏", label: "Twitter" },
  ig: { className: "plt-ig", compactClassName: styles.compactPltIg, icon: "◈", label: "Instagram" },
  rd: { className: "plt-rd", compactClassName: styles.compactPltRd, icon: "⬆", label: "Reddit" },
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
  compact = false,
}) {
  const meta = PLATFORM_META[platform];
  const genTags = [].concat(contentType ?? []);
  const charTags = [].concat(characterTags ?? []);
  const ariaLabel = beatLabel ? `${title} — ${beatLabel}` : title;

  if (compact) {
    return (
      <a
        className={styles.compactCard}
        href={sourceUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={ariaLabel}
      >
        <div className={styles.compactThumb} style={{ background: thumbnailUrl }}>
          <div className={`${styles.compactPlt} ${meta.compactClassName}`}>
            {meta.icon} {meta.label}
          </div>
        </div>
        <div className={styles.compactInfo}>
          <div className={styles.compactTitle}>{title}</div>
          <div className={styles.compactMeta}>{creator}</div>
          <div className={styles.compactTags}>
            {genTags.map((tag) => (
              <span key={tag} className={`${styles.compactTag} ${styles.compactTagGen}`}>
                {tag}
              </span>
            ))}
            {charTags.map((tag) => (
              <span key={tag} className={`${styles.compactTag} ${styles.compactTagChar}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </a>
    );
  }

  return (
    <a className="card" href={sourceUrl} target="_blank" rel="noreferrer" aria-label={ariaLabel}>
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
