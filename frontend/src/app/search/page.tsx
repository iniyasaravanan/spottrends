"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { api, type Artist } from "@/lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const [tracking, setTracking] = useState<Record<string, boolean>>({});
  const [tracked, setTracked] = useState<Record<string, Artist>>({});
  const [error, setError] = useState("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setError("");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.artists.search(val.trim());
        setResults(res);
      } catch {
        setError("Search failed. Check API connectivity.");
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  async function handleTrack(spotifyId: string) {
    setTracking((prev) => ({ ...prev, [spotifyId]: true }));
    try {
      const artist = await api.artists.track(spotifyId);
      setTracked((prev) => ({ ...prev, [spotifyId]: artist }));
    } catch {
      setError("Failed to track artist.");
    } finally {
      setTracking((prev) => ({ ...prev, [spotifyId]: false }));
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Artist Search</h1>
      <p className="text-spotify-light">
        Search for an artist to start tracking their popularity history and
        audio features.
      </p>

      <input
        className="input"
        placeholder="Search by artist name…"
        value={query}
        onChange={handleChange}
        autoFocus
      />

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card flex gap-4 animate-pulse">
              <div className="w-16 h-16 bg-white/10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-white/10 rounded w-1/2" />
                <div className="h-3 bg-white/10 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((artist) => {
            const isTracked = !!tracked[artist.spotifyId];
            const isTracking = tracking[artist.spotifyId];

            return (
              <div
                key={artist.spotifyId}
                className="card flex items-center gap-4"
              >
                {artist.imageUrl ? (
                  <Image
                    src={artist.imageUrl}
                    alt={artist.name}
                    width={64}
                    height={64}
                    className="rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-white/10 flex-shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{artist.name}</p>
                  <p className="text-xs text-spotify-light mt-0.5">
                  </p>
                  {(artist.genres?.length ?? 0) > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {artist.genres?.slice(0, 3).map((g) => (
                        <span key={g} className="badge">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0">
                  {isTracked ? (
                    <a
                      href={`/artist/${tracked[artist.spotifyId].id}`}
                      className="btn-primary text-sm py-2"
                    >
                      View
                    </a>
                  ) : (
                    <button
                      onClick={() => handleTrack(artist.spotifyId)}
                      disabled={isTracking}
                      className="btn-secondary text-sm py-2 disabled:opacity-50"
                    >
                      {isTracking ? "Tracking…" : "Track"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <p className="text-center text-spotify-light py-8">
          No artists found for &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}
