const ENDPOINT = "https://graphql.anilist.co";

export type AniMediaListItem = {
  id: number;
  title: { romaji: string; english: string | null };
  coverImage: { large: string; extraLarge?: string; color?: string | null };
  bannerImage: string | null;
  averageScore: number | null;
  seasonYear: number | null;
  episodes: number | null;
  genres: string[];
  format?: string | null;
};

export type AniRelationEdge = {
  relationType: string;
  node: {
    id: number;
    title: { romaji: string; english: string | null };
    coverImage: { large: string };
    seasonYear: number | null;
    format: string | null;
    type: string;
  };
};

export type AniReview = {
  id: number;
  score: number;
  summary: string;
  createdAt: number;
  user: { name: string; avatar: { large: string | null } | null };
};

export type AniMediaDetail = AniMediaListItem & {
  description: string | null;
  status: string | null;
  studios: { nodes: { name: string }[] };
  staff: { nodes: { name: { full: string } }[] };
  relations: { edges: AniRelationEdge[] };
  reviews: { nodes: AniReview[] };
};

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    throw new Error(json.errors?.[0]?.message || `AniList ${res.status}`);
  }
  return json.data as T;
}

const LIST_FIELDS = `
  id
  title { romaji english }
  coverImage { large extraLarge color }
  bannerImage
  averageScore
  seasonYear
  episodes
  genres
  format
`;

export async function fetchAnimeList(opts: {
  sort?: string[];
  search?: string;
  genre?: string;
  perPage?: number;
}) {
  const query = `
    query ($page: Int, $perPage: Int, $sort: [MediaSort], $search: String, $genre: String) {
      Page(page: $page, perPage: $perPage) {
        media(type: ANIME, sort: $sort, search: $search, genre: $genre, isAdult: false) {
          ${LIST_FIELDS}
        }
      }
    }
  `;
  const data = await gql<{ Page: { media: AniMediaListItem[] } }>(query, {
    page: 1,
    perPage: opts.perPage ?? 24,
    sort: opts.sort ?? ["POPULARITY_DESC"],
    search: opts.search?.trim() || undefined,
    genre: opts.genre && opts.genre !== "All" ? opts.genre : undefined,
  });
  return data.Page.media;
}

export async function fetchAnimeByIds(ids: number[]) {
  if (ids.length === 0) return [];
  const query = `
    query ($ids: [Int]) {
      Page(perPage: 50) {
        media(id_in: $ids, type: ANIME) {
          ${LIST_FIELDS}
        }
      }
    }
  `;
  const data = await gql<{ Page: { media: AniMediaListItem[] } }>(query, { ids });
  // Preserve input order
  const map = new Map(data.Page.media.map((m) => [m.id, m]));
  return ids.map((id) => map.get(id)).filter(Boolean) as AniMediaListItem[];
}

export async function fetchAnimeDetail(id: number) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${LIST_FIELDS}
        description(asHtml: false)
        status
        studios(isMain: true) { nodes { name } }
        staff(perPage: 1, sort: RELEVANCE) { nodes { name { full } } }
        relations {
          edges {
            relationType
            node {
              id
              title { romaji english }
              coverImage { large }
              seasonYear
              format
              type
            }
          }
        }
        reviews(perPage: 5, sort: RATING_DESC) {
          nodes {
            id
            score
            summary
            createdAt
            user { name avatar { large } }
          }
        }
      }
    }
  `;
  const data = await gql<{ Media: AniMediaDetail }>(query, { id });
  return data.Media;
}

export const titleOf = (t: { romaji: string; english: string | null }) =>
  t.english || t.romaji;

export const stripHtml = (s: string | null | undefined) =>
  (s ?? "").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");

export const ANILIST_GENRES = [
  "All",
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Sports",
  "Supernatural",
  "Thriller",
];