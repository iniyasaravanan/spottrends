import axios from "axios";

const SPOTIFY_API = "https://api.spotify.com/v1";
const SPOTIFY_AUTH = "https://accounts.spotify.com";

// ---------- Client Credentials (app-level, no user) ----------

let appToken: string | null = null;
let appTokenExpiry = 0;

async function getAppToken(): Promise<string> {
  if (appToken && Date.now() < appTokenExpiry) return appToken;

  const res = await axios.post(
    `${SPOTIFY_AUTH}/api/token`,
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64"),
      },
    }
  );

  appToken = res.data.access_token as string;
  appTokenExpiry = Date.now() + (res.data.expires_in - 60) * 1000;
  return appToken;
}

// ---------- OAuth helpers ----------

export function getAuthUrl(state: string): string {
  const scopes = [
    "user-top-read",
    "user-read-email",
    "user-read-private",
  ].join(" ");

  const params = new URLSearchParams({
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    response_type: "code",
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    scope: scopes,
    state,
  });

  return `${SPOTIFY_AUTH}/authorize?${params}`;
}

export async function exchangeCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const res = await axios.post(
    `${SPOTIFY_AUTH}/api/token`,
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64"),
      },
    }
  );
  return res.data;
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await axios.post(
    `${SPOTIFY_AUTH}/api/token`,
    new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64"),
      },
    }
  );
  return res.data;
}

// ---------- Spotify API wrappers ----------

export async function searchArtists(query: string, limit = 10) {
  const token = await getAppToken();
  const res = await axios.get(`${SPOTIFY_API}/search`, {
    params: { q: query, type: "artist", limit },
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.artists.items as SpotifyArtist[];
}

export async function getArtist(spotifyId: string): Promise<SpotifyArtist> {
  const token = await getAppToken();
  const res = await axios.get(`${SPOTIFY_API}/artists/${spotifyId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getArtistTopTracks(spotifyId: string) {
  const token = await getAppToken();
  const res = await axios.get(
    `${SPOTIFY_API}/artists/${spotifyId}/top-tracks`,
    {
      params: { market: "US" },
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data.tracks as SpotifyTrack[];
}

export async function getAudioFeatures(
  trackIds: string[]
): Promise<SpotifyAudioFeatures[]> {
  const token = await getAppToken();
  const res = await axios.get(`${SPOTIFY_API}/audio-features`, {
    params: { ids: trackIds.join(",") },
    headers: { Authorization: `Bearer ${token}` },
  });
  return (res.data.audio_features as SpotifyAudioFeatures[]).filter(Boolean);
}

export async function getSpotifyUser(accessToken: string) {
  const res = await axios.get(`${SPOTIFY_API}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data as SpotifyUser;
}

export async function getUserTopTracks(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit = 20
) {
  const res = await axios.get(`${SPOTIFY_API}/me/top/tracks`, {
    params: { time_range: timeRange, limit },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.items as SpotifyTrack[];
}

export async function getUserTopArtists(
  accessToken: string,
  timeRange: "short_term" | "medium_term" | "long_term" = "medium_term",
  limit = 20
) {
  const res = await axios.get(`${SPOTIFY_API}/me/top/artists`, {
    params: { time_range: timeRange, limit },
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.data.items as SpotifyArtist[];
}

// ---------- Types ----------

export interface SpotifyArtist {
  id: string;
  name: string;
  images: { url: string; width: number; height: number }[];
  genres: string[];
  followers: { total: number };
  popularity: number;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { id: string; name: string }[];
  album: { name: string; images: { url: string }[] };
  popularity: number;
}

export interface SpotifyAudioFeatures {
  id: string;
  energy: number;
  danceability: number;
  valence: number;
  tempo: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  speechiness: number;
}

export interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: { url: string }[];
}
