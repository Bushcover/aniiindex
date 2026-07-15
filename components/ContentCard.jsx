import styles from "./ContentCard.module.css";

const PLATFORM_YT = { className: "plt-yt", compactClassName: styles.compactPltYt, icon: "▶", label: "YouTube" };
const PLATFORM_TT = { className: "plt-tt", compactClassName: styles.compactPltTt, icon: "♪", label: "TikTok" };
const PLATFORM_X = { className: "plt-x", compactClassName: styles.compactPltX, icon: "𝕏", label: "Twitter" };
const PLATFORM_IG = { className: "plt-ig", compactClassName: styles.compactPltIg, icon: "◈", label: "Instagram" };
const PLATFORM_RD = { className: "plt-rd", compactClassName: styles.compactPltRd, icon: "⬆", label: "Reddit" };

// Every hardcoded content item across the app (arc page, search page) still
// uses the short codes below, but real content_items rows from Supabase
// store the full platform name (see Session 10/11's submit form fix) —
// both representations resolve to the same meta object here so either one
// renders correctly.
const PLATFORM_META = {
  yt: PLATFORM_YT,
  youtube: PLATFORM_YT,
  tt: PLATFORM_TT,
  tiktok: PLATFORM_TT,
  x: PLATFORM_X,
  ig: PLATFORM_IG,
  instagram: PLATFORM_IG,
  rd: PLATFORM_RD,
  reddit: PLATFORM_RD,
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
