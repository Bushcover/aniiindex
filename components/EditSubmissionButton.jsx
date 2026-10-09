"use client";

// Session 63: a small "Edit" control next to a card's own "Yours" badge,
// letting a submitter change their own item's beat assignment or content
// type after the fact. Does its own ownership check (same getSession()
// pattern as YoursBadge — kept independent rather than sharing state
// across sibling components, matching this codebase's existing small-
// component independence, e.g. ConfirmButton/FlagButton each own their
// own request/state) rather than trusting the parent to only render this
// for the right card — ContentCard already gates rendering on
// `!isPending`, but the actual ownership check (does this browser's
// session really match submittedBy) only happens here.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";

// Duplicated from app/submit/page.jsx's own CONTENT_TYPE_OPTIONS rather
// than shared — the same small, static-array duplication this project
// already accepts elsewhere (e.g. formatLabel, independently defined in
// both the search and series pages) rather than introducing a new shared
// module for six literal strings.
const CONTENT_TYPE_OPTIONS = ["Edit / AMV", "Fan art", "Discussion", "Breakdown", "OST / Music", "Other"];

export default function EditSubmissionButton({ id, submittedBy, beatId, contentType, arcBeats }) {
  const router = useRouter();
  const [isOwner, setIsOwner] = useState(false);
  const [editing, setEditing] = useState(false);
  const [beatSel, setBeatSel] = useState(beatId != null ? String(beatId) : "");
  const [typeSel, setTypeSel] = useState(contentType || CONTENT_TYPE_OPTIONS[0]);
  const [state, setState] = useState("idle"); // idle | saving | error
  const [error, setError] = useState("");

  useEffect(() => {
    if (!submittedBy) return;
    let cancelled = false;
    getSession().then((session) => {
      if (!cancelled && session?.user?.id === submittedBy) setIsOwner(true);
    });
    return () => {
      cancelled = true;
    };
  }, [submittedBy]);

  if (!isOwner) return null;

  // Every handler below stops the click from bubbling into the card's own
  // <a> (the whole card links to sourceUrl) — same requirement as
  // ConfirmButton/FlagButton, see either's own comment.
  function openEdit(e) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(true);
  }

  function cancelEdit(e) {
    e.preventDefault();
    e.stopPropagation();
    setEditing(false);
    setState("idle");
    setError("");
  }

  async function saveEdit(e) {
    e.preventDefault();
    e.stopPropagation();
    setState("saving");
    setError("");
    try {
      // getSession() (lib/auth.js) is read fresh right before the call,
      // not cached from mount — a session that expired since this card
      // first rendered should fail here with a clear message rather than
      // sending a stale token the server would reject anyway.
      const session = await getSession();
      if (!session?.access_token) {
        throw new Error("Your session has expired — sign in again and retry.");
      }
      const res = await fetch("/api/edit-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          beat_id: beatSel ? Number(beatSel) : null,
          content_type: typeSel,
          access_token: session.access_token,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save your changes.");
      setEditing(false);
      setState("idle");
      // A beat change needs to actually move this card into a different
      // beat section's list — not something local component state can do
      // cleanly from here (BeatSection owns which list this card is
      // rendered in). router.refresh() re-runs the arc page's own server
      // fetch (getArcContent), which the route above already revalidated
      // via revalidateTag, so this reflects the edit immediately rather
      // than needing a 5-minute cache window or a manual reload.
      router.refresh();
    } catch (err) {
      setState("error");
      setError(err.message || "Couldn't save your changes.");
    }
  }

  function stopClick(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (!editing) {
    return (
      <button type="button" className="edit-btn" onClick={openEdit}>
        ✎ Edit
      </button>
    );
  }

  return (
    <div className="edit-form" onClick={stopClick}>
      <select
        className="edit-select"
        value={beatSel}
        onChange={(e) => setBeatSel(e.target.value)}
        onClick={stopClick}
      >
        <option value="">No specific beat</option>
        {(arcBeats || []).map((b) => (
          <option key={b.id} value={b.id}>
            {b.title}
          </option>
        ))}
      </select>
      <select
        className="edit-select"
        value={typeSel}
        onChange={(e) => setTypeSel(e.target.value)}
        onClick={stopClick}
      >
        {CONTENT_TYPE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {state === "error" && <div className="edit-error">{error}</div>}
      <div className="edit-actions">
        <button type="button" className="edit-save" onClick={saveEdit} disabled={state === "saving"}>
          {state === "saving" ? "Saving…" : "Save"}
        </button>
        <button type="button" className="edit-cancel" onClick={cancelEdit} disabled={state === "saving"}>
          Cancel
        </button>
      </div>
    </div>
  );
}
