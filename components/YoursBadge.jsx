"use client";

import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";

// Renders a small "Yours" badge if the current browser session's signed-in
// user id matches this card's submittedBy. Client-only, since the arc page
// that renders ContentCard is a server component with no access to the
// browser's Supabase session — nesting this one small client component
// inside an otherwise-server-rendered card avoids making the whole page (or
// ContentCard itself) client-side just for this one check. Checked once on
// mount, not subscribed to auth changes — a card the user is currently
// looking at isn't expected to change ownership mid-view.
export default function YoursBadge({ submittedBy, className }) {
  const [isYours, setIsYours] = useState(false);

  useEffect(() => {
    if (!submittedBy) return;
    let cancelled = false;
    getSession().then((session) => {
      if (!cancelled && session?.user?.id === submittedBy) {
        setIsYours(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [submittedBy]);

  if (!isYours) return null;
  return <span className={className}>✦ Yours</span>;
}
