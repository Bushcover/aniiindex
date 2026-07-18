const ANILIST_API_URL = "https://graphql.anilist.co";

function stripHtmlTags(html) {
  if (typeof html !== "string") return html;
  return html.replace(/<[^>]*>/g, "");
}

async function postToAniList(query, variables) {
  const response = await fetch(ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`AniList request failed with status ${response.status}`);
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message || "AniList returned an error");
  }

  return json.data;
}

// Minimum AniList popularity a search result must have to be returned at
// all — see searchSeries' own comment for the real bug this was added to
// fix. 1000 comfortably excludes genuinely obscure/unrelated entries
// (AniList's own "Onigiri," id 21612, sits at ~8.8K anyway — the real
// fix for that specific case is the sort change below, not this
// threshold — but this still guards against a lower-popularity
// coincidental title match on some other search).
const MIN_SEARCH_POPULARITY = 1000;

const SEARCH_SERIES_QUERY = `
  query ($search: String, $perPage: Int, $minPopularity: Int) {
    Page(page: 1, perPage: $perPage) {
      media(search: $search, type: ANIME, sort: POPULARITY_DESC, popularity_greater: $minPopularity) {
        id
        title {
          romaji
          english
        }
        format
        seasonYear
        genres
        coverImage {
          large
        }
        bannerImage
        averageScore
        popularity
        episodes
      }
    }
  }
`;

/**
 * Searches AniList for anime series matching `query`, ranked by real
 * popularity (descending) rather than AniList's own SEARCH_MATCH
 * relevance score.
 *
 * SEARCH_MATCH used to rank a closer literal title match ahead of the
 * series a search almost always actually means — e.g. searching "Demon
 * Slayer" returned "Onigiri" (AniList id 21612, an obscure short whose
 * alternate titles happen to include "Demon Slayer") as the first result,
 * ahead of "Kimetsu no Yaiba" (id 101922, the real Demon Slayer TV
 * series, ~100x more popular). Sorting by `popularity` directly instead
 * fixes this: the real, popular series a user means wins regardless of
 * exact title-string closeness. `popularity_greater: $minPopularity`
 * (see MIN_SEARCH_POPULARITY above) additionally excludes any result
 * below that threshold outright, not just ranks it lower.
 *
 * `type: ANIME` (unchanged, already present before this fix) is what
 * restricts results to anime rather than manga — AniList's separate
 * `format` field (TV/TV_SHORT/MOVIE/OVA/ONA/SPECIAL/MUSIC) has no
 * `ANIME` value and isn't a meaningful "anime vs. not anime" filter on
 * its own, so it isn't used here.
 *
 * Cached via Next.js's built-in fetch cache (`next.revalidate`), so the
 * same query won't hit AniList again until the cache entry expires —
 * there's no separate Supabase/in-memory cache layer on top of this.
 *
 * `bannerImage` (Phase 8, Session 45) was added alongside the
 * already-fetched `coverImage.large` so the search page's Open Graph
 * preview has a real landscape image to use — `coverImage` is a
 * portrait poster, `bannerImage` is the widescreen image social
 * platforms actually expect; matches `getSeriesById`/
 * `getSeriesWithRelations` below, which already fetch both for the same
 * reason.
 *
 * Returns an array of media objects (empty array if nothing matches).
 * Throws if the request fails or AniList returns a GraphQL error, so
 * callers can distinguish "no results" from "the request failed."
 */
export async function searchSeries(query, { perPage = 5 } = {}) {
  const trimmed = typeof query === "string" ? query.trim() : "";
  if (!trimmed) return [];

  const data = await postToAniList(SEARCH_SERIES_QUERY, {
    search: trimmed,
    perPage,
    minPopularity: MIN_SEARCH_POPULARITY,
  });
  return data.Page.media;
}

const SERIES_BY_ID_QUERY = `
  query ($id: Int) {
    Media(id: $id) {
      id
      title {
        romaji
        english
      }
      description
      genres
      coverImage {
        large
      }
      bannerImage
      seasonYear
      format
      episodes
      status
    }
  }
`;

/**
 * Fetches a single series by its AniList numeric id — title, description,
 * genres, cover/banner images, season year, format, episodes, and status.
 *
 * Same caching (`next.revalidate: 3600`) and error-throwing contract as
 * `searchSeries`. `description` has AniList's HTML markup (`<br>`, `<i>`,
 * etc.) stripped so callers can render it as plain text directly.
 *
 * Returns `null` if `anilistId` is falsy; throws on request/GraphQL failure.
 */
export async function getSeriesById(anilistId) {
  if (!anilistId) return null;

  const data = await postToAniList(SERIES_BY_ID_QUERY, { id: anilistId });
  const media = data.Media;
  if (!media) return null;

  return { ...media, description: stripHtmlTags(media.description) };
}

const SERIES_CHARACTERS_QUERY = `
  query ($id: Int, $perPage: Int) {
    Media(id: $id) {
      characters(sort: [ROLE, FAVOURITES_DESC], perPage: $perPage) {
        nodes {
          id
          name {
            full
          }
          image {
            large
          }
        }
      }
    }
  }
`;

/**
 * Fetches the top `perPage` characters (default 10) for a series by its
 * AniList numeric id, ranked main-role-first (MAIN before SUPPORTING),
 * then by favourites count descending within each role group, so the
 * most prominent characters always surface first — not just the ones
 * AniList happens to have logged first within a role. Each character has
 * `id`, `name` (full name string), and `image` (large portrait URL, or
 * null if AniList has none).
 *
 * Same caching/error contract as `searchSeries`. Returns `[]` if
 * `anilistId` is falsy or the series has no characters listed; throws on
 * request/GraphQL failure.
 */
export async function getSeriesCharacters(anilistId, { perPage = 10 } = {}) {
  if (!anilistId) return [];

  const data = await postToAniList(SERIES_CHARACTERS_QUERY, { id: anilistId, perPage });
  const nodes = data.Media?.characters?.nodes ?? [];

  return nodes.map((node) => ({
    id: node.id,
    name: node.name?.full ?? "Unknown",
    image: node.image?.large ?? null,
  }));
}

const SERIES_WITH_RELATIONS_QUERY = `
  query ($id: Int) {
    Media(id: $id) {
      id
      title {
        romaji
        english
      }
      description
      coverImage {
        large
      }
      bannerImage
      seasonYear
      format
      status
      genres
      averageScore
      popularity
      episodes
    }
  }
`;

/**
 * Fetches a series (by AniList numeric id) for the series page — title,
 * description (HTML stripped), cover/banner images, season year, format,
 * status, genres, averageScore, popularity, and episodes.
 *
 * This overlaps with `getSeriesById` (used by the arc page), but is kept
 * separate: the series page needs `averageScore`/`popularity` that the
 * arc page doesn't fetch, and the two pages' fallback behavior differs
 * (the arc page falls back to hardcoded arc data on failure; the series
 * page has no sensible hardcoded series to fall back to, so it shows an
 * error state instead) — sharing one function would blur those two
 * call sites' contracts.
 *
 * Same caching/error contract as the other functions here. Returns `null`
 * if `anilistId` is falsy; throws on request/GraphQL failure.
 */
export async function getSeriesWithRelations(anilistId) {
  if (!anilistId) return null;

  const data = await postToAniList(SERIES_WITH_RELATIONS_QUERY, { id: anilistId });
  const media = data.Media;
  if (!media) return null;

  return { ...media, description: stripHtmlTags(media.description) };
}
