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

export function buildOpenGraph(fields) {
  return {
    siteName: SITE_NAME,
    locale: "en_US",
    ...fields,
  };
}
