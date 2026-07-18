"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentCard, { getThumbnailStyle } from "@/components/ContentCard";
import { supabase, getArcBeats, searchSeries, getAllArcsForSeries } from "@/lib/supabase";
import styles from "./submit.module.css";

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

// Real beats (id, title, order_index, intensity, is_peak) are fetched from
// Supabase once an arc is selected, via getArcBeats(selectedArc.slug) — see
// the `realBeats` state below. There's no reasonable arc-agnostic default
// beat anymore (Session 5/10's old default assumed the Shibuya arc's own
// beat order), so selection always starts at index 0 and the user picks.

const CONTENT_TYPE_OPTIONS = ["Edit / AMV", "Fan art", "Discussion", "Breakdown", "OST / Music", "Other"];
const DEFAULT_CONTENT_TYPE = "Edit / AMV";

function cx(...classNames) {
  return classNames.filter(Boolean).join(" ");
}

export default function SubmitPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [seriesQuery, setSeriesQuery] = useState("");
  const [seriesResults, setSeriesResults] = useState([]);
  const [seriesSearchStatus, setSeriesSearchStatus] = useState("idle"); // idle | loading | success
  const [selectedSeries, setSelectedSeries] = useState(null); // { id, anilist_id, title, slug } | null
  const [arcsForSeries, setArcsForSeries] = useState([]);
  const [arcsLoadStatus, setArcsLoadStatus] = useState("idle"); // idle | loading | success
  const [selectedArc, setSelectedArc] = useState(null); // { id, slug, title, episode_start, episode_end } | null
  const [selectedBeatIndex, setSelectedBeatIndex] = useState(0);
  const [characters, setCharacters] = useState([]); // free-text names, no auto-detection
  const [characterInput, setCharacterInput] = useState("");
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

  // Debounced series search: waits 300ms after the user stops typing before
  // querying Supabase, and skips the query entirely once a series is
  // already selected (the input itself is replaced by the selected-series
  // summary at that point, so seriesQuery can't change anymore anyway —
  // this guard is what stops a stale in-flight search from repopulating
  // seriesResults after handleChangeSeries clears the query back to "").
  useEffect(() => {
    if (selectedSeries) return;

    const trimmed = seriesQuery.trim();
    if (trimmed.length === 0) {
      setSeriesResults([]);
      setSeriesSearchStatus("idle");
      return;
    }

    setSeriesSearchStatus("loading");
    let cancelled = false;
    const timeoutId = setTimeout(() => {
      searchSeries(trimmed).then((results) => {
        if (cancelled) return;
        setSeriesResults(results);
        setSeriesSearchStatus("success");
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [seriesQuery, selectedSeries]);

  // Loads every arc for the selected series once it's chosen — the second
  // tier of Step 2's manual placement picker (Phase 7). Resets back to
  // nothing the moment the series selection is cleared, since an arc from
  // the old series would otherwise linger selected against a new one.
  useEffect(() => {
    if (!selectedSeries) {
      setArcsForSeries([]);
      setArcsLoadStatus("idle");
      setSelectedArc(null);
      return;
    }

    let cancelled = false;
    setArcsLoadStatus("loading");
    getAllArcsForSeries(selectedSeries.id).then((arcs) => {
      if (cancelled) return;
      setArcsForSeries(arcs);
      setArcsLoadStatus("success");
    });
    return () => {
      cancelled = true;
    };
  }, [selectedSeries]);

  // Loads real beats for the selected arc — replaces Sessions 5/10's
  // mount-time fetch against the single hardcoded ARC_SLUG. Resets the
  // beat selection back to index 0 on every arc change, since a beat index
  // that made sense for one arc's beat list is meaningless against another
  // arc's own list.
  useEffect(() => {
    setSelectedBeatIndex(0);
    if (!selectedArc) {
      setRealBeats(null);
      setBeatsLoadError("");
      return;
    }

    let cancelled = false;
    setRealBeats(null);
    setBeatsLoadError("");
    getArcBeats(selectedArc.slug)
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
  }, [selectedArc]);

  const selectedBeat = realBeats?.[selectedBeatIndex] ?? null;

  function handleSelectSeries(series) {
    setSelectedSeries(series);
    setSeriesQuery("");
    setSeriesResults([]);
  }

  function handleChangeSeries() {
    setSelectedSeries(null);
  }

  function handleChangeArc() {
    setSelectedArc(null);
  }

  function getBarTier(i) {
    if (i === selectedBeatIndex) return "selected";
    if (i === selectedBeatIndex + 1 || i === selectedBeatIndex + 2) return "nearby";
    return "dim";
  }

  function handleRemoveCharacter(name) {
    setCharacters((prev) => prev.filter((c) => c !== name));
  }

  function addCharacterFromInput() {
    const name = characterInput.trim();
    if (!name) return;
    setCharacters((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setCharacterInput("");
  }

  function handleCharacterInputKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCharacterFromInput();
    }
  }

  async function handleSubmit() {
    setSubmitStatus("submitting");
    setSubmitError("");

    try {
      const { error: insertError } = await supabase.from("content_items").insert({
        arc_id: selectedArc.id,
        beat_id: selectedBeat.id,
        source_url: url,
        title: effectiveLink.title,
        creator: effectiveLink.creator,
        platform: effectiveLink.platform,
        thumbnail_url: effectiveLink.thumbnailUrl,
        content_type: contentType,
        character_tags: characters,
        status: "pending",
        submitted_by: session?.user?.id || "anonymous",
      });
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
                Paste a link to fan content — we&rsquo;ll try to detect the title, thumbnail, and creator
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
                Choose the series, arc, and story beat this content belongs to
              </div>
            </div>

            <div className={styles.stepBody}>
              <div className={styles.field}>
                <div className={styles.fieldLabel}>Series</div>
                {selectedSeries ? (
                  <div className={styles.fieldRow}>
                    <div className={cx(styles.detectedVal, styles.detectedValConfirmed)}>
                      <div className={styles.detectedText}>{selectedSeries.title}</div>
                      <div className={styles.selectedBadge}>✓ selected</div>
                    </div>
                    <button className={styles.changeLink} onClick={handleChangeSeries}>
                      Change
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      className={styles.searchInput}
                      type="text"
                      placeholder="Search for a series…"
                      value={seriesQuery}
                      onChange={(e) => setSeriesQuery(e.target.value)}
                    />
                    {seriesSearchStatus === "loading" && <div className={styles.detectNote}>Searching…</div>}
                    {seriesSearchStatus === "success" && seriesResults.length === 0 && (
                      <div className={styles.detectNote}>No matching series found.</div>
                    )}
                    {seriesResults.length > 0 && (
                      <div className={styles.searchResults}>
                        {seriesResults.map((series) => (
                          <button
                            key={series.id}
                            className={styles.searchChip}
                            onClick={() => handleSelectSeries(series)}
                          >
                            {series.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedSeries && (
                <div className={styles.field}>
                  <div className={styles.fieldLabel}>Arc</div>
                  {selectedArc ? (
                    <div className={styles.fieldRow}>
                      <div className={cx(styles.detectedVal, styles.detectedValConfirmed)}>
                        <div className={styles.detectedText}>{selectedArc.title}</div>
                        <div className={styles.selectedBadge}>✓ selected</div>
                      </div>
                      <button className={styles.changeLink} onClick={handleChangeArc}>
                        Change
                      </button>
                    </div>
                  ) : (
                    <>
                      {arcsLoadStatus === "loading" && <div className={styles.detectNote}>Loading arcs…</div>}
                      {arcsLoadStatus === "success" && arcsForSeries.length === 0 && (
                        <div className={styles.detectNote}>This series has no arcs seeded yet.</div>
                      )}
                      {arcsForSeries.length > 0 && (
                        <div className={styles.arcList}>
                          {arcsForSeries.map((arc) => (
                            <button
                              key={arc.id}
                              className={styles.arcListItem}
                              onClick={() => setSelectedArc(arc)}
                            >
                              <span className={styles.arcListItemTitle}>{arc.title}</span>
                              {(arc.episode_start || arc.episode_end) && (
                                <span className={styles.arcListItemMeta}>
                                  Ep. {arc.episode_start}–{arc.episode_end}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {selectedArc && (
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
              )}

              <div className={styles.field}>
                <div className={styles.fieldLabel}>Characters in this content</div>
                <div className={styles.charChips}>
                  {characters.map((name) => (
                    <div key={name} className={styles.charChip}>
                      {name}
                      <button
                        className={styles.charChipRemove}
                        onClick={() => handleRemoveCharacter(name)}
                        aria-label={`Remove ${name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <input
                    className={styles.charInput}
                    type="text"
                    placeholder="Type a character name…"
                    value={characterInput}
                    onChange={(e) => setCharacterInput(e.target.value)}
                    onKeyDown={handleCharacterInputKeyDown}
                  />
                </div>
                <div className={styles.detectNote} style={{ marginTop: 4 }}>
                  Press Enter to add
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
              <button
                className={styles.btnContinue}
                onClick={() => setStep(3)}
                disabled={!selectedSeries || !selectedArc || !selectedBeat}
              >
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
                {selectedSeries?.title} · {selectedArc?.title} · {selectedBeat?.title}
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
              Choose the series, arc, and story beat once the link is resolved
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
                    characterTags={characters}
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
              {submitStatus === "success" && selectedArc && (
                <div className={styles.successActions}>
                  <Link href={`/arc/${selectedArc.slug}`} className={styles.btnContinue}>
                    View arc page →
                  </Link>
                  <Link href="/" className="btn btn-ghost">
                    Back to home
                  </Link>
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
