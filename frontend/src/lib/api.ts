const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("spottrends_token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ---------- Types ----------

export interface Artist {
  id: string;
  spotifyId: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
  followers: number;
  popularity: number;
  updatedAt: string;
  audioFeatures?: AudioFeatures | null;
}

export interface AudioFeatures {
  id: string;
  artistId: string;
  energy: number;
  danceability: number;
  valence: number;
  tempo: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
}

export interface PopularitySnapshot {
  id: string;
  artistId: string;
  popularity: number;
  followers: number;
  snappedAt: string;
}

export interface UserProfile {
  id: string;
  spotifyId: string;
  displayName: string;
  email: string | null;
  imageUrl: string | null;
  createdAt: string;
  _count: { topTracks: number; topArtists: number };
}

export interface TopTrack {
  id: string;
  spotifyId: string;
  name: string;
  artistName: string;
  albumName: string | null;
  imageUrl: string | null;
  popularity: number;
  rank: number;
}

export interface TopArtistEntry {
  id: string;
  rank: number;
  artist: {
    id: string;
    name: string;
    imageUrl: string | null;
    genres: string[];
    popularity: number;
  };
}

// ---------- Artist endpoints ----------

export const api = {
  artists: {
    search: (q: string) =>
      request<Artist[]>(`/api/artist/search?q=${encodeURIComponent(q)}`),

    track: (spotifyId: string) =>
      request<Artist>("/api/artist/track", {
        method: "POST",
        body: JSON.stringify({ spotifyId }),
      }),

    get: (id: string) => request<Artist>(`/api/artist/${id}`),

    list: () => request<Artist[]>("/api/artist"),

    history: (id: string, days = 30) =>
      request<PopularitySnapshot[]>(`/api/artist/${id}/history?days=${days}`),

    audioFeatures: (id: string) =>
      request<AudioFeatures>(`/api/artist/${id}/audio-features`),
  },

  user: {
    profile: () => request<UserProfile>("/api/user/profile"),

    top: (timeRange: "short_term" | "medium_term" | "long_term" = "medium_term") =>
      request<{ tracks: TopTrack[]; artists: TopArtistEntry[] }>(
        `/api/user/top?time_range=${timeRange}`
      ),

    me: () =>
      request<{ id: string; displayName: string; imageUrl: string | null }>(
        "/api/auth/me"
      ),
  },
};
