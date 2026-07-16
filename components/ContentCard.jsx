import YoursBadge from "@/components/YoursBadge";
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

// Falls back to a neutral, unstyled badge for any platform value that
// isn't a recognized key above — necessary as of Session 12, where
// /api/og-fetch's platform detection can genuinely come back unrecognized
// (a link from a site outside the five known platforms) and still needs
// to render, not crash.
const DEFAULT_PLATFORM_META = { className: "", compactClassName: "", icon: "🔗", label: "Link" };

// `thumbnailUrl` is either a real image URL (Session 12's real OG/oEmbed
// data) or a plain CSS value like a gradient (this app's hardcoded
// placeholder data, still the default everywhere real detection hasn't
// happened). `background: <bare URL>` is invalid CSS and gets silently
// dropped by the browser — only `url(...)` wrapped inside
// background-image actually renders an image. Detect which kind of value
// this is and apply it correctly either way. Exported since
// app/submit/page.jsx's step 1 preview card renders a thumbnail the same
// way, independent of this component.
export function getThumbnailStyle(thumbnailUrl) {
  if (!thumbnailUrl) return {};
  if (/^https?:\/\//i.test(thumbnailUrl)) {
    return {
      backgroundImage: `url(${thumbnailUrl})`,
      backgroundSize: "cover",
      backgroundPosition: "center",
    };
  }
  return { background: thumbnailUrl };
}

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
  submittedBy,
}) {
  const meta = PLATFORM_META[platform] || DEFAULT_PLATFORM_META;
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
        <div className={styles.compactThumb} style={getThumbnailStyle(thumbnailUrl)}>
          {submittedBy && <YoursBadge submittedBy={submittedBy} className={styles.compactYours} />}
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
      <div className="thumb" style={getThumbnailStyle(thumbnailUrl)}>
        {submittedBy && <YoursBadge submittedBy={submittedBy} className="yours-badge" />}
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
