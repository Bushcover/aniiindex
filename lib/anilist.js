const ANILIST_API_URL = "https://graphql.anilist.co";

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

  const response = await fetch(ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      query: SEARCH_SERIES_QUERY,
      variables: { search: trimmed, perPage },
    }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`AniList request failed with status ${response.status}`);
  }

  const json = await response.json();

  if (json.errors?.length) {
    throw new Error(json.errors[0].message || "AniList returned an error");
  }

  return json.data.Page.media;
}
