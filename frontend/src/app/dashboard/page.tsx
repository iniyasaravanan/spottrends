"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { api, type TopTrack, type TopArtistEntry } from "@/lib/api";
import { loginWithSpotify } from "@/lib/auth";

type TimeRange = "short_term" | "medium_term" | "long_term";

const RANGE_LABELS: Record<TimeRange, string> = {
  short_term: "Last 4 weeks",
  medium_term: "Last 6 months",
  long_term: "All time",
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [range, setRange] = useState<TimeRange>("medium_term");
  const [tracks, setTracks] = useState<TopTrack[]>([]);
  const [artists, setArtists] = useState<TopArtistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"tracks" | "artists">("tracks");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    api.user
      .top(range)
      .then(({ tracks, artists }) => {
        setTracks(tracks);
        setArtists(artists);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, range]);

  if (authLoading) {
    return <div className="h-64 flex items-center justify-center text-spotify-light">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-20 space-y-4">
        <h1 className="text-3xl font-bold">My Dashboard</h1>
        <p className="text-spotify-light">Log in with Spotify to see your top tracks and artists.</p>
        <button onClick={loginWithSpotify} className="btn-primary">
          Login with Spotify
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* User header */}
      <div className="flex items-center gap-4">
        {user.imageUrl && (
          <Image
            src={user.imageUrl}
            alt={user.displayName}
            width={64}
            height={64}
            className="rounded-full"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold">Hi, {user.displayName}</h1>
          <p className="text-spotify-light text-sm">Your Spotify listening stats</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {(Object.keys(RANGE_LABELS) as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-sm px-4 py-2 rounded-full transition ${
                range === r
                  ? "bg-spotify-green text-black font-semibold"
                  : "bg-white/10 text-spotify-light hover:bg-white/20"
              }`}
            >
              {RANGE_LABELS[r]}
            </button>
          ))}
        </div>
        <div className="flex gap-2 ml-auto">
          {(["tracks", "artists"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm px-4 py-2 rounded-full capitalize transition ${
                tab === t
                  ? "bg-white/20 text-white"
                  : "text-spotify-light hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="card flex gap-4 animate-pulse">
              <div className="w-12 h-12 bg-white/10 rounded-lg" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-3 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : tab === "tracks" ? (
        <div className="space-y-2">
          {tracks.map((track) => (
            <div key={track.id} className="card flex items-center gap-4">
              <span className="w-6 text-center text-sm text-spotify-muted flex-shrink-0">
                {track.rank}
              </span>
              {track.imageUrl ? (
                <Image
                  src={track.imageUrl}
                  alt={track.name}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-white/10 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{track.name}</p>
                <p className="text-sm text-spotify-light truncate">{track.artistName}</p>
              </div>
              <span className="text-xs text-spotify-muted flex-shrink-0">
                {track.popularity}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {artists.map(({ id, rank, artist }) => (
            <div key={id} className="card flex items-center gap-4">
              <span className="w-6 text-center text-sm text-spotify-muted flex-shrink-0">
                {rank}
              </span>
              {artist.imageUrl ? (
                <Image
                  src={artist.imageUrl}
                  alt={artist.name}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-white/10 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/artist/${artist.id}`}
                  className="font-medium hover:text-spotify-green transition truncate block"
                >
                  {artist.name}
                </Link>
                {artist.genres.length > 0 && (
                  <p className="text-sm text-spotify-light truncate">
                    {artist.genres.slice(0, 2).join(", ")}
                  </p>
                )}
              </div>
              <span className="text-xs text-spotify-muted flex-shrink-0">
                {artist.popularity}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
