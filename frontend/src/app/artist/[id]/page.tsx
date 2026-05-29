"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  api,
  type Artist,
  type ArtistTrack,
  type AudioFeatures,
  type PopularitySnapshot,
} from "@/lib/api";
import AudioFeaturesRadar, { type RadarAxis } from "@/components/AudioFeaturesRadar";
import PopularityChart from "@/components/PopularityChart";

// ─── Feature config ────────────────────────────────────────────────────────────

const RADAR_AXES: RadarAxis[] = [
  { key: "energy", label: "Energy" },
  { key: "danceability", label: "Dance" },
  { key: "valence", label: "Mood" },
  { key: "acousticness", label: "Acoustic" },
  { key: "tempo", label: "Tempo" },
];

const FEATURE_BARS = [
  {
    key: "energy",
    label: "Energy",
    icon: "⚡",
    color: "#FF6B35",
    desc: (v: number) =>
      v >= 80 ? "Very intense" : v >= 60 ? "Energetic" : v >= 40 ? "Moderate" : "Laid-back",
  },
  {
    key: "danceability",
    label: "Danceability",
    icon: "🕺",
    color: "#A855F7",
    desc: (v: number) =>
      v >= 80 ? "Irresistible groove" : v >= 60 ? "Easy to dance to" : v >= 40 ? "Moderate rhythm" : "Not very danceable",
  },
  {
    key: "valence",
    label: "Mood",
    icon: "😊",
    color: "#EAB308",
    desc: (v: number) =>
      v >= 75 ? "Euphoric" : v >= 50 ? "Upbeat" : v >= 30 ? "Bittersweet" : "Melancholic",
  },
  {
    key: "acousticness",
    label: "Acousticness",
    icon: "🎸",
    color: "#14B8A6",
    desc: (v: number) =>
      v >= 75 ? "Purely acoustic" : v >= 50 ? "Mostly acoustic" : v >= 25 ? "Partly acoustic" : "Electronic",
  },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function FeatureBar({
  icon,
  label,
  value,
  desc,
  color,
}: {
  icon: string;
  label: string;
  value: number;
  desc: string;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">
          {icon} {label}
        </span>
        <span className="text-xs text-spotify-muted flex-shrink-0">{desc}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function TrackRow({ track }: { track: ArtistTrack }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition group">
      <span className="w-5 text-right text-xs text-spotify-muted flex-shrink-0 tabular-nums">
        {track.rank}
      </span>
      {track.imageUrl ? (
        <Image
          src={track.imageUrl}
          alt={track.albumName}
          width={40}
          height={40}
          className="rounded flex-shrink-0 object-cover"
        />
      ) : (
        <div className="w-10 h-10 rounded bg-white/10 flex-shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate leading-tight">{track.name}</p>
        <p className="text-xs text-spotify-light truncate leading-snug">
          {track.artists.join(", ")}
        </p>
      </div>
      <p className="text-xs text-spotify-muted truncate max-w-[120px] hidden sm:block">
        {track.albumName}
      </p>
    </div>
  );
}

// ─── Skeletons ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex gap-6">
        <div className="w-36 h-36 rounded-2xl bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <div className="h-8 bg-white/10 rounded w-2/5" />
          <div className="h-4 bg-white/10 rounded w-1/4" />
          <div className="flex gap-2 pt-1">
            <div className="h-5 bg-white/10 rounded-full w-16" />
            <div className="h-5 bg-white/10 rounded-full w-20" />
          </div>
        </div>
      </div>
      <div className="card h-80 bg-white/5" />
      <div className="card h-64 bg-white/5" />
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

const DAY_OPTIONS = [7, 30, 90];

export default function ArtistPage() {
  const { id } = useParams<{ id: string }>();

  const [artist, setArtist] = useState<Artist | null>(null);
  const [features, setFeatures] = useState<AudioFeatures | null>(null);
  const [tracks, setTracks] = useState<ArtistTrack[]>([]);
  const [history, setHistory] = useState<PopularitySnapshot[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [tracksLoading, setTracksLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Load artist + features + top tracks on mount
  useEffect(() => {
    async function load() {
      setLoading(true);
      setTracksLoading(true);
      setNotFound(false);
      try {
        const a = await api.artists.get(id);
        setArtist(a);

        // Resolve features (may already be embedded in the artist response)
        const feat = a.audioFeatures
          ?? await api.artists.audioFeatures(id).catch(() => null);
        setFeatures(feat);

        // Top tracks and history can race independently
        api.artists
          .topTracks(id)
          .then(setTracks)
          .catch(() => {})
          .finally(() => setTracksLoading(false));
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // Re-fetch history when day range changes
  useEffect(() => {
    if (!artist) return;
    api.artists.history(id, days).then(setHistory).catch(() => {});
  }, [id, artist, days]);

  if (loading) return <PageSkeleton />;

  if (notFound || !artist) {
    return (
      <div className="text-center py-24 space-y-4">
        <p className="text-2xl">🎵</p>
        <p className="text-xl text-spotify-light">Artist not found.</p>
        <Link href="/search" className="btn-primary">
          Search Artists
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* ── Header ── */}
      <div className="flex items-end gap-6">
        {artist.imageUrl ? (
          <Image
            src={artist.imageUrl}
            alt={artist.name}
            width={144}
            height={144}
            className="rounded-2xl object-cover flex-shrink-0 shadow-2xl"
          />
        ) : (
          <div className="w-36 h-36 rounded-2xl bg-white/10 flex-shrink-0" />
        )}

        <div className="flex-1 space-y-2 pb-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-spotify-light">
            Artist
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold leading-none">{artist.name}</h1>
          {(artist.genres?.length ?? 0) > 0 && (
            <div className="flex gap-1.5 flex-wrap pt-1">
              {artist.genres.slice(0, 4).map((g) => (
                <span key={g} className="badge">{g}</span>
              ))}
            </div>
          )}
        </div>

        <Link
          href={`/compare?a=${artist.id}`}
          className="btn-secondary text-sm flex-shrink-0 self-start"
        >
          Compare
        </Link>
      </div>

      {/* ── Sound Profile (audio features) ── */}
      <div className="card space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Sound Profile</h2>
          <p className="text-xs text-spotify-muted mt-0.5">
            Averaged across top tracks · Powered by Spotify audio analysis
          </p>
        </div>

        {features ? (
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Radar */}
            <AudioFeaturesRadar
              artists={[{ name: artist.name, features, color: "#1DB954" }]}
              axes={RADAR_AXES}
            />

            {/* Feature bars */}
            <div className="space-y-5">
              {FEATURE_BARS.map(({ key, label, icon, color, desc }) => {
                const raw = (features as unknown as Record<string, number>)[key];
                const pct = Math.round(
                  key === "tempo" ? Math.min((raw / 200) * 100, 100) : raw * 100
                );
                return (
                  <FeatureBar
                    key={key}
                    icon={icon}
                    label={label}
                    value={pct}
                    desc={desc(pct)}
                    color={color}
                  />
                );
              })}

              {/* Tempo shown as raw BPM */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5">
                <span className="text-sm font-medium">🥁 Tempo</span>
                <span className="text-sm font-mono text-spotify-light">
                  {Math.round(features.tempo)}{" "}
                  <span className="text-xs text-spotify-muted">BPM</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center text-spotify-muted text-sm">
            Audio features not yet available for this artist.
          </div>
        )}
      </div>

      {/* ── Top Tracks ── */}
      <div className="card space-y-3">
        <h2 className="text-lg font-semibold">Top Tracks</h2>

        {tracksLoading ? (
          <div className="space-y-1">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 animate-pulse">
                <div className="w-5 h-3 bg-white/10 rounded flex-shrink-0" />
                <div className="w-10 h-10 bg-white/10 rounded flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-white/10 rounded w-1/2" />
                  <div className="h-2.5 bg-white/10 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : tracks.length > 0 ? (
          <div>
            {tracks.map((track) => (
              <TrackRow key={track.spotifyId} track={track} />
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-spotify-muted text-sm">
            No tracks available.
          </p>
        )}
      </div>

      {/* ── Popularity History (secondary) ── */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Popularity History</h2>
            <p className="text-xs text-spotify-muted mt-0.5">
              Internally tracked daily snapshots
            </p>
          </div>
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
          <div className="py-8 text-center space-y-1">
            <p className="text-spotify-light text-sm">Not enough data yet.</p>
            <p className="text-spotify-muted text-xs">
              Snapshots are taken daily — check back tomorrow.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
