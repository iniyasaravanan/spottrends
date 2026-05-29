const API_KEY =
  process.env.NEXT_PUBLIC_LASTFM_API_KEY ?? "9f3da47b9e70ea2bd326c7bb603b0892";
const BASE = "https://ws.audioscrobbler.com/2.0/";

// ─── Raw fetch ────────────────────────────────────────────────────────────────

async function call<T>(
  params: Record<string, string>,
  revalidate = 3600
): Promise<T> {
  const url = new URL(BASE);
  Object.entries({ ...params, api_key: API_KEY, format: "json" }).forEach(
    ([k, v]) => url.searchParams.set(k, v)
  );

  const res = await fetch(url.toString(), { next: { revalidate } });
  if (!res.ok) throw new Error(`Last.fm HTTP ${res.status}`);

  const data = await res.json();
  if (data.error) throw new Error(data.message ?? `Last.fm error ${data.error}`);
  return data as T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LfmImage {
  "#text": string;
  size: "small" | "medium" | "large" | "extralarge" | "mega" | "";
}

export interface LfmTag {
  name: string;
  url: string;
}

export interface LfmArtistStub {
  name: string;
  listeners: string;
  mbid: string;
  url: string;
  streamable: string;
  image: LfmImage[];
}

export interface LfmSimilarArtist {
  name: string;
  match: string; // float string e.g. "0.942383"
  url: string;
  image: LfmImage[];
}

export interface LfmArtistInfo {
  name: string;
  mbid?: string;
  url: string;
  image: LfmImage[];
  stats: {
    listeners: string;
    playcount: string;
  };
  tags: {
    tag: LfmTag[] | LfmTag; // Last.fm returns single object when only one tag
  };
  bio: {
    summary: string;
    content: string;
    published?: string;
  };
  similar: {
    artist: LfmSimilarArtist[] | LfmSimilarArtist;
  };
  ontour?: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function searchArtists(
  query: string,
  limit = 20
): Promise<LfmArtistStub[]> {
  const data = await call<{
    results: { artistmatches: { artist: LfmArtistStub[] | LfmArtistStub } };
  }>(
    { method: "artist.search", artist: query, limit: String(limit) },
    60 // search results cache for 1 min
  );
  const raw = data.results?.artistmatches?.artist ?? [];
  return normaliseArray(raw);
}

export async function getArtistInfo(name: string): Promise<LfmArtistInfo> {
  const data = await call<{ artist: LfmArtistInfo }>({
    method: "artist.getInfo",
    artist: name,
    autocorrect: "1",
  });
  return data.artist;
}

export async function getSimilarArtists(
  name: string,
  limit = 12
): Promise<LfmSimilarArtist[]> {
  const data = await call<{
    similarartists: { artist: LfmSimilarArtist[] | LfmSimilarArtist };
  }>({
    method: "artist.getSimilar",
    artist: name,
    limit: String(limit),
    autocorrect: "1",
  });
  const raw = data.similarartists?.artist ?? [];
  return normaliseArray(raw);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Last.fm returns a single object instead of a 1-element array — normalise. */
function normaliseArray<T>(v: T | T[]): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/**
 * Last.fm returns this MD5 hash as the placeholder when an artist has no image.
 * Filter it out so we can fall back to our own avatar instead of a grey box.
 */
const LASTFM_PLACEHOLDER_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

function isRealImage(url: string): boolean {
  return !!url && !url.includes(LASTFM_PLACEHOLDER_HASH);
}

/** Pick the best non-empty, non-placeholder image URL, preferring larger sizes. */
export function getImage(
  images: LfmImage[] | undefined,
  preferred: "extralarge" | "large" | "medium" = "extralarge"
): string | null {
  if (!images?.length) return null;
  const order =
    preferred === "extralarge"
      ? (["extralarge", "mega", "large", "medium", "small"] as const)
      : preferred === "large"
      ? (["large", "extralarge", "mega", "medium", "small"] as const)
      : (["medium", "large", "extralarge", "small"] as const);
  for (const size of order) {
    const img = images.find((i) => i.size === size && isRealImage(i["#text"]));
    if (img?.["#text"]) return img["#text"];
  }
  return null;
}

/** Strip HTML tags and decode entities from Last.fm bio text. */
export function cleanBio(raw: string): string {
  return raw
    .replace(/<a[^>]*>.*?<\/a>/gi, "") // remove all anchor links
    .replace(/<[^>]+>/g, "")           // strip remaining tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Normalise the tags field which may be a single object or array. */
export function getTags(artist: LfmArtistInfo): LfmTag[] {
  return normaliseArray(artist.tags?.tag);
}

/** Normalise the similar.artist field which may be a single object or array. */
export function getEmbeddedSimilar(artist: LfmArtistInfo): LfmSimilarArtist[] {
  return normaliseArray(artist.similar?.artist);
}
