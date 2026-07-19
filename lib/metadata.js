// Session 46 bug fix. Next.js's Metadata API does not deep-merge
// composite fields like `openGraph` across nested layouts/pages — a
// segment that defines its own `openGraph` object replaces the parent's
// entirely, field by field, rather than merging with it. Session 45's
// arc/home/series/search pages each set their own `openGraph` (title,
// description, url, ...) without repeating the root layout's
// `siteName`/`locale`, which silently dropped `og:site_name`/`og:locale`
// from every one of those pages' actual rendered `<head>` — confirmed via
// direct `<head>` inspection, not a theoretical concern. Routing every
// page-level `openGraph` object through this helper instead of
// hand-writing siteName/locale on each one is what prevents this class of
// bug from recurring on the next page that adds its own `openGraph`.
export const SITE_NAME = "aniindex";

// Session 47: description length ceilings, requested directly after real
// AniList descriptions ran long enough (201/211 chars observed) to get
// truncated unpredictably by whichever platform/crawler renders them,
// rather than by this app deliberately. 155 matches Google's own
// search-snippet ceiling (also what most OG readers render cleanly
// without their own truncation kicking in); Twitter's card format
// tolerates more before truncating its own preview, so
// `twitter:description` gets its own, longer ceiling instead of reusing
// the same 155-char text — see each page's own generateMetadata for how
// the two are derived independently from the same raw source text, not
// one truncated version of the other.
export const MAX_META_DESCRIPTION = 155;
export const MAX_TWITTER_DESCRIPTION = 200;

// Trims arbitrary text (real AniList descriptions can run to several
// paragraphs) down to `maxLength`, cutting on a raw character count and
// adding an ellipsis rather than leaving it for whatever renders it to
// cut off mid-sentence unpredictably. Shared by every page's
// generateMetadata (for the top-level `description`/`twitter.description`
// fields) and by buildOpenGraph below (for `openGraph.description`) —
// previously duplicated per-file as a page-local `truncateDescription`
// (Session 45, app/arc/[slug]/page.jsx and app/series/[slug]/page.jsx),
// consolidated here since three different call sites now need the exact
// same logic at two different length ceilings, not just one.
//
// Slices to `maxLength - 1`, not `maxLength`, before appending the
// ellipsis — the ellipsis itself is 1 character, so slicing to the full
// `maxLength` first and then appending it produced a string one
// character *over* the stated ceiling (caught in this session's own
// verification: `truncate(text, 200)` was measured returning 201
// characters). The result is always `<= maxLength`, matching "truncated
// to N characters maximum" literally, not "N characters of content plus
// an ellipsis."
export function truncate(text, maxLength) {
  if (!text) return null;
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

// Session 46: siteName/locale, so a page's own `openGraph` object doesn't
// silently replace the root layout's (see this file's own header
// comment). Session 47: also (re-)truncates `fields.description` to
// `MAX_META_DESCRIPTION` — every call site already passes its own
// already-computed `description` in here, but truncating again here too
// (not just at the call site) is what makes this the single place that
// actually enforces the ceiling "consistently across all pages," per the
// task that added it, rather than trusting every future call site to
// remember to truncate before calling this.
export function buildOpenGraph(fields) {
  return {
    siteName: SITE_NAME,
    locale: "en_US",
    ...fields,
    ...(fields.description && { description: truncate(fields.description, MAX_META_DESCRIPTION) }),
  };
}
