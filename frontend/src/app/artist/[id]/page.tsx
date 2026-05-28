"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, type Artist, type PopularitySnapshot, type AudioFeatures } from "@/lib/api";
import PopularityChart from "@/components/PopularityChart";
import AudioFeaturesRadar from "@/components/AudioFeaturesRadar";
import PopularityBar from "@/components/PopularityBar";

const DAY_OPTIONS = [7, 30, 90];

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [history, setHistory] = useState<PopularitySnapshot[]>([]);
  const [features, setFeatures] = useState<AudioFeatures | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [a, h] = await Promise.all([
          api.artists.get(id),
          api.artists.history(id, days),
        ]);
        setArtist(a);
        setHistory(h);
        if (a.audioFeatures) {
          setFeatures(a.audioFeatures);
        } else {
          api.artists.audioFeatures(id).then(setFeatures).catch(() => {});
        }
      } catch {
        // artist not found
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, days]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex gap-5">
          <div className="w-32 h-32 rounded-xl bg-white/10" />
          <div className="flex-1 space-y-3 py-2">
            <div className="h-7 bg-white/10 rounded w-1/3" />
            <div className="h-4 bg-white/10 rounded w-1/4" />
          </div>
        </div>
        <div className="card h-64 bg-white/5" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-xl text-spotify-light">Artist not found.</p>
        <Link href="/search" className="btn-primary">
          Search Artists
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-6">
        {artist.imageUrl ? (
          <Image
            src={artist.imageUrl}
            alt={artist.name}
            width={128}
            height={128}
            className="rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-32 h-32 rounded-xl bg-white/10 flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <h1 className="text-4xl font-bold">{artist.name}</h1>
          <p className="text-spotify-light">
            {artist.followers.toLocaleString()} followers
          </p>
          {artist.genres.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {artist.genres.map((g) => (
                <span key={g} className="badge">
                  {g}
                </span>
              ))}
            </div>
          )}
          <div className="max-w-xs pt-2">
            <PopularityBar value={artist.popularity} label="Popularity" />
          </div>
        </div>
        <Link
          href={`/compare?a=${artist.id}`}
          className="btn-secondary text-sm flex-shrink-0"
        >
          Compare
        </Link>
      </div>

      {/* Popularity history */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Popularity Over Time</h2>
          <div className="flex gap-2">
            {DAY_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`text-xs px-3 py-1.5 rounded-full transition ${
                  days === d
                    ? "bg-spotify-green text-black font-semibold"
                    : "bg-white/10 text-spotify-light hover:bg-white/20"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {history.length > 1 ? (
          <PopularityChart data={history} />
        ) : (
          <p className="text-spotify-light text-sm py-8 text-center">
            Not enough data yet — snapshots are taken daily.
          </p>
        )}
      </div>

      {/* Audio features */}
      {features && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-lg">Audio Features Profile</h2>
          <p className="text-xs text-spotify-light">
            Averaged across top 5 tracks
          </p>
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <AudioFeaturesRadar
              artists={[{ name: artist.name, features, color: "#1DB954" }]}
            />
            <div className="space-y-3">
              {[
                { key: "energy", label: "Energy" },
                { key: "danceability", label: "Danceability" },
                { key: "valence", label: "Valence (mood)" },
                { key: "acousticness", label: "Acousticness" },
                { key: "liveness", label: "Liveness" },
              ].map(({ key, label }) => (
                <PopularityBar
                  key={key}
                  label={label}
                  value={Math.round(
                    (features as unknown as Record<string, number>)[key] * 100
                  )}
                />
              ))}
              <div className="flex justify-between text-xs text-spotify-light pt-1">
                <span>Tempo</span>
                <span>{Math.round(features.tempo)} BPM</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
