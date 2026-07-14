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

const SEARCH_SERIES_QUERY = `
  query ($search: String, $perPage: Int) {
    Page(page: 1, perPage: $perPage) {
      media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
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
        averageScore
        popularity
        episodes
      }
    }
  }
`;

/**
 * Searches AniList for anime series matching `query`.
 *
 * Cached via Next.js's built-in fetch cache (`next.revalidate`), so the
 * same query won't hit AniList again until the cache entry expires —
 * there's no separate Supabase/in-memory cache layer on top of this.
 *
 * Returns an array of media objects (empty array if nothing matches).
 * Throws if the request fails or AniList returns a GraphQL error, so
 * callers can distinguish "no results" from "the request failed."
 */
export async function searchSeries(query, { perPage = 5 } = {}) {
  const trimmed = typeof query === "string" ? query.trim() : "";
  if (!trimmed) return [];

  const data = await postToAniList(SEARCH_SERIES_QUERY, { search: trimmed, perPage });
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
