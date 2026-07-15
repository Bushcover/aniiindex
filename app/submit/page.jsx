"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ContentCard from "@/components/ContentCard";
import { supabase } from "@/lib/supabase";
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

// Same TikTok item already hardcoded on the Shibuya Incident Arc page (Session 1's
// "The Sealing" beat) — this flow simulates submitting that exact piece of content.
const RESOLVED_LINK = {
  platform: "tt",
  thumbnailUrl: "linear-gradient(135deg,#0f0820,#1a0f3a)",
  title: "The moment Gojo got sealed and the internet broke in real time 💔",
  creator: "@jjkmoments_ · 8.4M views",
  sourceMeta: "@jjkmoments_ · 8.4M views · tiktok.com",
};

const SERIES_DETECTED = { name: "Jujutsu Kaisen", note: 'Detected from "Gojo" in title and caption keywords' };
const ARC_DETECTED = { name: "Shibuya Incident Arc", note: 'Detected from "Gojo sealed", "Shibuya" in caption' };

const BEATS = [
  { label: "Curtain falls", heightPct: 28, count: 156 },
  { label: "Station", heightPct: 35, count: 178 },
  { label: "Gojo arrives", heightPct: 54, count: 245 },
  { label: "Domain", heightPct: 63, count: 312 },
  { label: "The Sealing", heightPct: 87, count: 891 },
  { label: "Nanami", heightPct: 70, count: 402 },
  { label: "Yuji breaks", heightPct: 100, count: 1102 },
  { label: "Nobara", heightPct: 77, count: 298 },
  { label: "Aftermath", heightPct: 42, count: 134 },
  { label: "Fallout", heightPct: 30, count: 89 },
];
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

  const selectedBeat = BEATS[selectedBeatIndex];

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

      console.log('[submit] querying beats: select id from beats where arc_id =', arc.id);
      const { data: beats, error: beatsError } = await supabase
        .from("beats")
        .select("id")
        .eq("arc_id", arc.id)
        .order("order_index", { ascending: true });
      console.log('[submit] beats query result:', { beats, beatsError });
      if (beatsError) {
        throw new Error(
          `Couldn't load story beats for this arc (${beatsError.message}${beatsError.code ? ` [${beatsError.code}]` : ""}).`
        );
      }
      const beatId = beats?.[selectedBeatIndex]?.id ?? null;

      const { error: insertError } = await supabase.from("content_items").insert({
        arc_id: arc.id,
        beat_id: beatId,
        source_url: url,
        title: RESOLVED_LINK.title,
        creator: RESOLVED_LINK.creator,
        platform: RESOLVED_LINK.platform,
        thumbnail_url: RESOLVED_LINK.thumbnailUrl,
        content_type: contentType,
        character_tags: characters.map((c) => c.name),
        status: "pending",
        submitted_by: "anonymous",
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
                <div className={styles.detectNote}>
                  Works with TikTok, YouTube, X (Twitter), Instagram, and Reddit links
                </div>
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
            <div className={styles.completedThumb} style={{ background: RESOLVED_LINK.thumbnailUrl }}>
              <div className={styles.completedPlt}>TikTok</div>
            </div>
            <div className={styles.completedInfo}>
              <div className={styles.completedTitle}>{RESOLVED_LINK.title}</div>
              <div className={styles.completedMeta}>{RESOLVED_LINK.sourceMeta}</div>
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

                <div className={styles.beatSelector}>
                  <div className={styles.beatChartWrap}>
                    <div className={styles.beatBars}>
                      {BEATS.map((beat, i) => {
                        const tier = getBarTier(i);
                        return (
                          <button
                            key={beat.label}
                            className={cx(
                              styles.bbar,
                              tier === "dim" && styles.bbarDim,
                              tier === "nearby" && styles.bbarNearby,
                              tier === "selected" && styles.bbarSelected
                            )}
                            style={{ height: `${beat.heightPct}%` }}
                            onClick={() => setSelectedBeatIndex(i)}
                            aria-label={beat.label}
                          ></button>
                        );
                      })}
                    </div>
                    <div className={styles.beatLabels}>
                      {BEATS.map((beat, i) => (
                        <button
                          key={beat.label}
                          className={cx(styles.blabel, i === selectedBeatIndex && styles.blabelSelected)}
                          onClick={() => setSelectedBeatIndex(i)}
                        >
                          {beat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={styles.beatSelectedRow}>
                    <div className={styles.beatSelectedIcon}>✦</div>
                    <div className={styles.beatSelectedName}>{selectedBeat.label}</div>
                    <div className={styles.beatSelectedCount}>{selectedBeat.count} items already here</div>
                  </div>

                  <div className={styles.beatUnsure}>
                    Not sure which beat? <a>Skip this and the community can help place it</a>
                  </div>
                </div>
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
              <button className={styles.btnContinue} onClick={() => setStep(3)}>
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
                {SERIES_DETECTED.name} · {ARC_DETECTED.name} · {selectedBeat.label}
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
                    title={RESOLVED_LINK.title}
                    creator={RESOLVED_LINK.creator}
                    platform={RESOLVED_LINK.platform}
                    thumbnailUrl={RESOLVED_LINK.thumbnailUrl}
                    contentType={[contentType]}
                    characterTags={characters.map((c) => c.name)}
                    sourceUrl={url || "#"}
                    beatLabel={selectedBeat.label}
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
