"use client";

// Session 20: this became a client component so confirming/flagging could
// hide the pending badge and card instantly, without waiting for a full
// page reload. As of a later bug fix, the confirm optimism itself moved
// up to ArcContent (see its own comment) — this component is now purely
// prop-driven (`locallyConfirmed`/`onConfirmed`) rather than owning that
// state directly — but it's kept a client component since it renders
// ConfirmButton/FlagButton (both client components) and is imported
// directly by app/submit/page.jsx (a client component). Also imported by
// app/search/page.jsx (a server component) — a Server Component rendering
// a Client Component descendant is normal, supported App Router behavior,
// not a boundary violation.
import YoursBadge from "@/components/YoursBadge";
import ConfirmButton from "@/components/ConfirmButton";
import FlagButton from "@/components/FlagButton";
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
  id,
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
  status,
  confirmationCount,
  onFlagged,
  locallyConfirmed = false,
  onConfirmed,
}) {
  const meta = PLATFORM_META[platform] || DEFAULT_PLATFORM_META;
  const genTags = [].concat(contentType ?? []);
  const charTags = [].concat(characterTags ?? []);
  const ariaLabel = beatLabel ? `${title} — ${beatLabel}` : title;
  // Only real Supabase-backed cards carry an id — hardcoded fallback/mockup
  // data (and the submit wizard's live preview) has none, so the pending
  // badge and the confirm/flag controls simply never render there, the
  // same "omit rather than fabricate" convention this project already uses
  // for the Yours badge.
  //
  // `locallyConfirmed` (owned by ArcContent, not this component — see its
  // own comment) is optimistic by design (Session 20): it flips the
  // instant *this* browser's own confirm click succeeds, regardless of
  // whether the real content_items row actually reached the
  // 2-confirmation threshold yet (a first confirmation leaves the DB
  // status genuinely 'pending', still waiting on a second contributor).
  // The pending badge/confirm button disappearing here is "you confirmed
  // it," not "it's now fully confirmed." This used to be a local
  // useState seeded once from the `status` prop, but that reset back to
  // "pending" every time the arc page's content-tab filter unmounted and
  // remounted this exact card (see ArcContent.jsx) — lifting it above
  // that remount boundary is the actual fix.
  const isPending = Boolean(id) && status === "pending" && !locallyConfirmed;
  // Session 53: `confirmation_count` is now returned by getArcContent
  // (lib/supabase.js) — used here purely to distinguish "no one has
  // confirmed this yet" from "one confirmation already landed, it's
  // waiting on a second" after a page refresh, when `locallyConfirmed`
  // (ArcContent.jsx's client-side, in-memory optimistic state) has
  // necessarily been lost. Passed straight through to ConfirmButton,
  // which is what actually changes its idle-state label/styling — see
  // that component's own comment for why this still has to stay
  // clickable rather than becoming an inert label (this app has no
  // per-visitor confirmation ledger, so there's no way to tell "the
  // browser that already confirmed, reloading" apart from "a genuinely
  // different visitor who still needs to provide the second
  // confirmation" — replacing the control outright for everyone once
  // count reaches 1 would permanently strand every item at "pending,
  // one confirmation," since nothing else in this app can ever supply
  // the second one).
  const awaitingSecondConfirmation = isPending && confirmationCount === 1;

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
        {isPending ? (
          <span className="pending-badge">⏳ Pending review</span>
        ) : (
          submittedBy && <YoursBadge submittedBy={submittedBy} className="yours-badge" />
        )}
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
        {id && (
          <div className="card-actions">
            {isPending && (
              <ConfirmButton id={id} onConfirmed={onConfirmed} awaitingSecond={awaitingSecondConfirmation} />
            )}
            <FlagButton id={id} onFlagged={onFlagged} />
          </div>
        )}
      </div>
    </a>
  );
}
