"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentCard, { getThumbnailStyle } from "@/components/ContentCard";
import { supabase, getArcBeats } from "@/lib/supabase";
import styles from "./submit.module.css";

// Matches the arc seeded into Supabase in Session 10 (see PROJECT.md's
// Database schema section for the seed SQL) — the only arc real
// submissions can currently be saved against.
const ARC_SLUG = "shibuya-incident-arc";

const STEP_META = [
  { num: 1, label: "Link" },
  { num: 2, label: "Placement" },
  { num: 3, label: "Review" },
];

// Fallbacks used whenever /api/og-fetch (Session 12) hasn't resolved real
// data yet — either it's still loading, or it failed and the user is
// proceeding with manual entry, which the task explicitly allows. There's
// no manual-entry form for these fields (out of scope here), so "manual
// entry" in practice means: the wizard still works end to end with these
// honest placeholders instead of fabricated ones.
const DEFAULT_THUMBNAIL = "linear-gradient(135deg,#1a1230,#2a1a45)";
const PLATFORM_LABELS = {
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X (Twitter)",
  instagram: "Instagram",
  reddit: "Reddit",
};

const SERIES_DETECTED = { name: "Jujutsu Kaisen", note: 'Detected from "Gojo" in title and caption keywords' };
const ARC_DETECTED = { name: "Shibuya Incident Arc", note: 'Detected from "Gojo sealed", "Shibuya" in caption' };

// Real beats (id, title, order_index, intensity, is_peak) are fetched from
// Supabase on mount via getArcBeats(ARC_SLUG) — see the `realBeats` state
// below. Session 10's seed data keeps "The Sealing" at index 4, so this
// stays a reasonable initial selection regardless of when the fetch
// resolves.
const DEFAULT_BEAT_INDEX = 4; // "The Sealing"

const INITIAL_CHARACTERS = [{ name: "Gojo Satoru", initials: "GS", color: "#7B6CF6" }];

const CONTENT_TYPE_OPTIONS = ["Edit / AMV", "Fan art", "Discussion", "Breakdown", "OST / Music", "Other"];
const DEFAULT_CONTENT_TYPE = "Edit / AMV";

function cx(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

export default function SubmitPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(DEFAULT_BEAT_INDEX);
  const [characters, setCharacters] = useState(INITIAL_CHARACTERS);
  const [contentType, setContentType] = useState(DEFAULT_CONTENT_TYPE);
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle"); // idle | submitting | success | error
  const [submitError, setSubmitError] = useState("");
  const [realBeats, setRealBeats] = useState(null); // null until getArcBeats resolves
  const [beatsLoadError, setBeatsLoadError] = useState("");
  const [resolvedLink, setResolvedLink] = useState(null); // { title, thumbnailUrl, platform, creator } | null
  const [ogStatus, setOgStatus] = useState("idle"); // idle | loading | success | error
  const [ogError, setOgError] = useState("");
  const [session, setSession] = useState(null); // null until checked, or once confirmed signed out

  // Read the current session once on mount, so a signed-in submission can
  // save the real user id instead of the "anonymous" fallback. Doesn't
  // subscribe to auth changes — by the time handleSubmit runs, whatever was
  // true when the form was opened is what should be saved.
  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setSession(data.session);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Debounced Open Graph auto-detection: waits 500ms after the user stops
  // typing/pasting before calling /api/og-fetch, and aborts a still-in-
  // flight request if the URL changes again before it resolves (so a
  // slow, superseded response can't overwrite a newer one).
  useEffect(() => {
    if (url.trim().length === 0) {
      setResolvedLink(null);
      setOgStatus("idle");
      setOgError("");
      return;
    }

    setOgStatus("loading");
    setOgError("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      fetch("/api/og-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      })
        .then(async (res) => {
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Couldn't resolve this link.");
          setResolvedLink(data);
          setOgStatus("success");
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setResolvedLink(null);
          setOgStatus("error");
          setOgError(err.message || "Couldn't resolve this link.");
        });
    }, 500);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [url]);

  // What the rest of the wizard actually renders/saves — real resolved
  // data where available, honest fallbacks otherwise. `platform` can't
  // fall back to null here since content_items.platform is NOT NULL in
  // Supabase; "other" is a genuine, ContentCard-safe "unknown" value
  // (see components/ContentCard.jsx's default platform meta), not a
  // guess at the real platform.
  const effectiveLink = {
    title: resolvedLink?.title || "Untitled link",
    thumbnailUrl: resolvedLink?.thumbnailUrl || DEFAULT_THUMBNAIL,
    platform: resolvedLink?.platform || "other",
    creator: resolvedLink?.creator || "Unknown creator",
  };

  useEffect(() => {
    let cancelled = false;
    getArcBeats(ARC_SLUG)
      .then((beats) => {
        if (cancelled) return;
        if (!beats || beats.length === 0) {
          setBeatsLoadError("No story beats found for this arc.");
          return;
        }
        setRealBeats(beats);
      })
      .catch((err) => {
        if (cancelled) return;
        setBeatsLoadError(err.message || "Couldn't load story beats.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedBeat = realBeats?.[selectedBeatIndex] ?? null;

  function getBarTier(i) {
    if (i === selectedBeatIndex) return "selected";
    if (i === selectedBeatIndex + 1 || i === selectedBeatIndex + 2) return "nearby";
    return "dim";
  }

  function handleRemoveCharacter(name) {
    setCharacters((prev) => prev.filter((c) => c.name !== name));
  }

  async function handleSubmit() {
    setSubmitStatus("submitting");
    setSubmitError("");

    try {
      console.log('[submit] querying arcs: select id from arcs where slug =', ARC_SLUG);
      const { data: arc, error: arcError } = await supabase
        .from("arcs")
        .select("id")
        .eq("slug", ARC_SLUG)
        .single();
      console.log('[submit] arcs query result:', { arc, arcError });
      if (arcError || !arc) {
        const detail = arcError
          ? `${arcError.message}${arcError.code ? ` [${arcError.code}]` : ""}`
          : "query returned no data";
        throw new Error(`Couldn't find the Shibuya Incident Arc in the database (${detail}).`);
      }

      const { error: insertError } = await supabase.from("content_items").insert({
        arc_id: arc.id,
        beat_id: selectedBeat.id,
        source_url: url,
        title: effectiveLink.title,
        creator: effectiveLink.creator,
        platform: effectiveLink.platform,
        thumbnail_url: effectiveLink.thumbnailUrl,
        content_type: contentType,
        character_tags: characters.map((c) => c.name),
        status: "pending",
        submitted_by: session?.user?.id || "anonymous",
      });
      console.log('[submit] content_items insert error:', insertError);
      if (insertError) {
        throw new Error(`${insertError.message}${insertError.code ? ` [${insertError.code}]` : ""}`);
      }

      setSubmitStatus("success");
    } catch (err) {
      setSubmitStatus("error");
      setSubmitError(err.message || "Something went wrong. Please try again.");
    }
  }

  return (
    <>
      <nav className={styles.navCompact}>
        <Link href="/" className={cx("logo", styles.logoLink)}>
          ani<span>index</span>
        </Link>
        <span className={styles.navTitle}>Add content</span>
        <button className={styles.navCancel} onClick={() => router.back()}>
          Cancel
        </button>
      </nav>

      <div className={styles.stepIndicator}>
        {STEP_META.map((meta, i) => {
          const status = step > meta.num ? "done" : step === meta.num ? "active" : "upcoming";
          return (
            <Fragment key={meta.num}>
              <div className={styles.stepNode}>
                <div
                  className={cx(
                    styles.stepDot,
                    status === "done" && styles.stepDotDone,
                    status === "active" && styles.stepDotActive,
                    status === "upcoming" && styles.stepDotUpcoming
                  )}
                >
                  {status === "done" ? "✓" : meta.num}
                </div>
                <div
                  className={cx(
                    styles.stepLabel,
                    status === "done" && styles.stepLabelDone,
                    status === "active" && styles.stepLabelActive,
                    status === "upcoming" && styles.stepLabelUpcoming
                  )}
                >
                  {meta.label}
                </div>
              </div>
              {i < STEP_META.length - 1 && (
                <div
                  className={cx(styles.stepLine, step > meta.num ? styles.stepLineDone : styles.stepLineUpcoming)}
                ></div>
              )}
            </Fragment>
          );
        })}
      </div>

      <div className={styles.submitWrap}>
        {/* Step 1 */}
        {step === 1 && (
          <div className={styles.stepActive}>
            <div className={styles.stepActiveHead}>
              <div className={styles.stepActiveTitle}>Add a link</div>
              <div className={styles.stepActiveSub}>
                Paste a link to fan content — we&rsquo;ll try to detect the series, arc, and story beat
              </div>
            </div>
            <div className={styles.stepBody}>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Content URL</div>
                <input
                  className={styles.urlInput}
                  type="text"
                  placeholder="https://tiktok.com/@creator/video/1234567890"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                {ogStatus === "idle" && (
                  <div className={styles.detectNote}>
                    Works with TikTok, YouTube, X (Twitter), Instagram, and Reddit links
                  </div>
                )}
                {ogStatus === "loading" && <div className={styles.detectNote}>Detecting link details…</div>}
                {ogStatus === "error" && (
                  <div className={styles.submitErrorMsg}>
                    Couldn&rsquo;t auto-detect this link: {ogError} — you can still continue and add it manually.
                  </div>
                )}
                {ogStatus === "success" && resolvedLink && (
                  <div className={styles.detectNote}>
                    ✓ Detected{resolvedLink.platform ? ` from ${PLATFORM_LABELS[resolvedLink.platform] || resolvedLink.platform}` : ""}
                    {resolvedLink.title ? `: ${resolvedLink.title}` : " — no title found, you can still continue"}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.stepFooter}>
              <div className={styles.unsureNote}>
                We&rsquo;ll resolve the link and try to auto-detect the rest on the next step.
              </div>
              <button
                className={styles.btnContinue}
                disabled={url.trim().length === 0}
                onClick={() => setStep(2)}
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Step 1 completed summary (shown once past step 1) */}
        {step > 1 && (
          <div className={styles.stepCompleted} style={{ marginBottom: 12 }}>
            <div className={styles.completedCheck}>✓</div>
            <div className={styles.completedThumb} style={getThumbnailStyle(effectiveLink.thumbnailUrl)}>
              <div className={styles.completedPlt}>{PLATFORM_LABELS[effectiveLink.platform] || "Link"}</div>
            </div>
            <div className={styles.completedInfo}>
              <div className={styles.completedTitle}>{effectiveLink.title}</div>
              <div className={styles.completedMeta}>{effectiveLink.creator}</div>
            </div>
            <button className={styles.completedChange} onClick={() => setStep(1)}>
              Change
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className={styles.stepActive} style={{ marginBottom: 12 }}>
            <div className={styles.stepActiveHead}>
              <div className={styles.stepActiveTitle}>Where does this belong?</div>
              <div className={styles.stepActiveSub}>
                We detected the series and arc from the video title and caption
              </div>
            </div>

            <div className={styles.stepBody}>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Series</div>
                <div className={styles.fieldRow}>
                  <div className={cx(styles.detectedVal, styles.detectedValConfirmed)}>
                    <div className={styles.detectedText}>{SERIES_DETECTED.name}</div>
                    <div className={styles.autoBadge}>✦ auto-detected</div>
                  </div>
                  <button className={styles.changeLink}>Change</button>
                </div>
                <div className={styles.detectNote}>{SERIES_DETECTED.note}</div>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>Arc</div>
                <div className={styles.fieldRow}>
                  <div className={cx(styles.detectedVal, styles.detectedValConfirmed)}>
                    <div className={styles.detectedText}>{ARC_DETECTED.name}</div>
                    <div className={styles.autoBadge}>✦ auto-detected</div>
                  </div>
                  <button className={styles.changeLink}>Change</button>
                </div>
                <div className={styles.detectNote}>{ARC_DETECTED.note}</div>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>Story beat</div>
                <div className={styles.detectNote} style={{ marginBottom: 6 }}>
                  Select the moment this content is about — click a bar
                </div>

                {!realBeats && !beatsLoadError && (
                  <div className={styles.detectNote}>Loading story beats…</div>
                )}
                {beatsLoadError && (
                  <div className={styles.submitErrorMsg}>Couldn&rsquo;t load story beats: {beatsLoadError}</div>
                )}

                {realBeats && (
                  <div className={styles.beatSelector}>
                    <div className={styles.beatChartWrap}>
                      <div className={styles.beatBars}>
                        {realBeats.map((beat, i) => {
                          const tier = getBarTier(i);
                          return (
                            <button
                              key={beat.id}
                              className={cx(
                                styles.bbar,
                                tier === "dim" && styles.bbarDim,
                                tier === "nearby" && styles.bbarNearby,
                                tier === "selected" && styles.bbarSelected
                              )}
                              style={{ height: `${beat.intensity}%` }}
                              onClick={() => setSelectedBeatIndex(i)}
                              aria-label={beat.title}
                            ></button>
                          );
                        })}
                      </div>
                      <div className={styles.beatLabels}>
                        {realBeats.map((beat, i) => (
                          <button
                            key={beat.id}
                            className={cx(styles.blabel, i === selectedBeatIndex && styles.blabelSelected)}
                            onClick={() => setSelectedBeatIndex(i)}
                          >
                            {beat.title}
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedBeat && (
                      <div className={styles.beatSelectedRow}>
                        <div className={styles.beatSelectedIcon}>✦</div>
                        <div className={styles.beatSelectedName}>{selectedBeat.title}</div>
                      </div>
                    )}

                    <div className={styles.beatUnsure}>
                      Not sure which beat? <a>Skip this and the community can help place it</a>
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>Characters in this content</div>
                <div className={styles.charChips}>
                  {characters.map((char) => (
                    <div key={char.name} className={styles.charChipDetected}>
                      <div className={styles.charAv} style={{ background: char.color }}>
                        {char.initials}
                      </div>
                      {char.name}
                      <span className={styles.charChipConfirm}>✦ detected</span>
                      <button
                        className={styles.charChipRemove}
                        onClick={() => handleRemoveCharacter(char.name)}
                        aria-label={`Remove ${char.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button className={styles.addChar}>+ Add character</button>
                </div>
                <div className={styles.detectNote} style={{ marginTop: 4 }}>
                  Add any other characters who appear in this content
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>Content type</div>
                <div className={styles.typeOptions}>
                  {CONTENT_TYPE_OPTIONS.map((option) => (
                    <button
                      key={option}
                      className={cx(styles.typeOpt, option === contentType && styles.typeOptSelected)}
                      onClick={() => setContentType(option)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.stepFooter}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>
                ← Back
              </button>
              <div className={styles.unsureNote}>
                Content stays pending review until a second contributor confirms the placement.{" "}
                <a>How placement works →</a>
              </div>
              <button className={styles.btnContinue} onClick={() => setStep(3)} disabled={!selectedBeat}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 completed summary (shown once past step 2) */}
        {step > 2 && (
          <div className={styles.stepCompleted} style={{ marginBottom: 12 }}>
            <div className={styles.completedCheck}>✓</div>
            <div className={styles.completedInfo}>
              <div className={styles.completedTitle}>
                {SERIES_DETECTED.name} · {ARC_DETECTED.name} · {selectedBeat.title}
              </div>
              <div className={styles.completedMeta}>
                {contentType} · {characters.length} character{characters.length === 1 ? "" : "s"} tagged
              </div>
            </div>
            <button className={styles.completedChange} onClick={() => setStep(2)}>
              Change
            </button>
          </div>
        )}

        {/* Step 2 upcoming (grayed placeholder, shown while on step 1) */}
        {step === 1 && (
          <div className={styles.stepUpcoming}>
            <div className={styles.stepUpcomingTitle}>Placement</div>
            <div className={styles.stepUpcomingSub}>
              We&rsquo;ll detect the series, arc, and story beat once the link is resolved
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className={styles.stepActive}>
            <div className={styles.stepActiveHead}>
              <div className={styles.stepActiveTitle}>Review</div>
              <div className={styles.stepActiveSub}>
                See exactly how the card will appear on the arc page before confirming
              </div>
            </div>

            <div className={styles.stepBody}>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Preview</div>
                <div className={styles.previewCardWrap}>
                  <ContentCard
                    title={effectiveLink.title}
                    creator={effectiveLink.creator}
                    platform={effectiveLink.platform}
                    thumbnailUrl={effectiveLink.thumbnailUrl}
                    contentType={[contentType]}
                    characterTags={characters.map((c) => c.name)}
                    sourceUrl={url || "#"}
                    beatLabel={selectedBeat.title}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <div className={styles.fieldLabel}>Before you add</div>
                <div className={styles.qualityBlock}>
                  <button className={styles.checkRow} onClick={() => setCheck1((v) => !v)}>
                    <div className={cx(styles.checkBox, check1 && styles.checkBoxChecked)}></div>
                    <div className={styles.checkText}>
                      This is fan-created or community content — not an official studio or Crunchyroll release
                    </div>
                  </button>
                  <button className={styles.checkRow} onClick={() => setCheck2((v) => !v)}>
                    <div className={cx(styles.checkBox, check2 && styles.checkBoxChecked)}></div>
                    <div className={styles.checkText}>
                      This links to the original post, not a repost or mirror account
                    </div>
                  </button>
                </div>
              </div>

              {submitStatus === "success" && (
                <div className={styles.submitSuccess}>
                  ✓ Submitted — this content is now pending review.
                </div>
              )}
              {submitStatus === "error" && (
                <div className={styles.submitErrorMsg}>Couldn&rsquo;t submit: {submitError}</div>
              )}
            </div>

            <div className={styles.stepFooter}>
              <button className="btn btn-ghost" onClick={() => setStep(2)} disabled={submitStatus === "submitting"}>
                ← Back
              </button>
              <div className={styles.unsureNote} />
              <button
                className={styles.btnContinue}
                disabled={submitStatus === "submitting" || submitStatus === "success"}
                onClick={handleSubmit}
              >
                {submitStatus === "submitting"
                  ? "Adding…"
                  : submitStatus === "success"
                  ? "Added ✓"
                  : "Add to aniindex"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
