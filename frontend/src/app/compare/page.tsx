"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { api, type Artist, type AudioFeatures, type PopularitySnapshot } from "@/lib/api";
import AudioFeaturesRadar from "@/components/AudioFeaturesRadar";
import PopularityChart from "@/components/PopularityChart";
import PopularityBar from "@/components/PopularityBar";

interface SelectedArtist {
  artist: Artist;
  features: AudioFeatures | null;
  history: PopularitySnapshot[];
}

const COLORS = ["#1DB954", "#FF6B6B"];

function ArtistSelector({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: SelectedArtist | null;
  onSelect: (a: SelectedArtist) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<NodeJS.Timeout | null>(null);

  function handleSearch(q: string) {
    setQuery(q);
    if (debounce.current) clearTimeout(debounce.current);
    if (!q.trim()) { setResults([]); return; }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        setResults(await api.artists.search(q));
      } finally {
        setSearching(false);
      }
    }, 400);
  }

  async function pick(artist: Artist) {
    setResults([]);
    setQuery(artist.name);
    // Ensure tracked
    let tracked = artist;
    if (!artist.id) {
      tracked = await api.artists.track(artist.spotifyId);
    } else if (!artist.spotifyId.startsWith("clue")) {
      // Already have a DB id — use it
    }
    const [features, history] = await Promise.all([
      api.artists.audioFeatures(tracked.id).catch(() => null),
      api.artists.history(tracked.id, 30).catch(() => [] as PopularitySnapshot[]),
    ]);
    onSelect({ artist: tracked, features, history });
  }

  return (
    <div className="flex-1 space-y-3">
      <p className="text-xs text-spotify-light font-medium uppercase tracking-wide">
        {label}
      </p>
      {selected ? (
        <div className="card flex items-center gap-3">
          {selected.artist.imageUrl && (
            <Image
              src={selected.artist.imageUrl}
              alt={selected.artist.name}
              width={48}
              height={48}
              className="rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{selected.artist.name}</p>
            <p className="text-xs text-spotify-light">Popularity: {selected.artist.popularity}</p>
          </div>
          <button
            onClick={() => { setQuery(""); }}
            className="text-xs text-spotify-muted hover:text-white"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            className="input"
            placeholder={`Search ${label}…`}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {(searching || results.length > 0) && (
            <div className="absolute z-10 top-full mt-1 w-full bg-spotify-card border border-white/10 rounded-xl overflow-hidden shadow-xl">
              {searching && (
                <p className="text-xs text-spotify-light px-4 py-3">Searching…</p>
              )}
              {results.map((a) => (
                <button
                  key={a.spotifyId}
                  onClick={() => pick(a)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left"
                >
                  {a.imageUrl && (
                    <Image src={a.imageUrl} alt={a.name} width={32} height={32} className="rounded" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <p className="text-xs text-spotify-light">{a.followers.toLocaleString()} followers</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const [left, setLeft] = useState<SelectedArtist | null>(null);
  const [right, setRight] = useState<SelectedArtist | null>(null);

  // Pre-load artist from URL param ?a=<id>
  useEffect(() => {
    const aId = searchParams.get("a");
    if (!aId) return;
    async function prefill() {
      try {
        const artist = await api.artists.get(aId!);
        const [features, history] = await Promise.all([
          api.artists.audioFeatures(artist.id).catch(() => null),
          api.artists.history(artist.id, 30).catch(() => [] as PopularitySnapshot[]),
        ]);
        setLeft({ artist, features, history });
      } catch {}
    }
    prefill();
  }, [searchParams]);

  const both = left && right;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Compare Artists</h1>

      <div className="flex gap-4">
        <ArtistSelector label="Artist A" selected={left} onSelect={setLeft} />
        <div className="flex items-center text-spotify-muted font-bold text-lg pt-6">vs</div>
        <ArtistSelector label="Artist B" selected={right} onSelect={setRight} />
      </div>

      {both && (
        <>
          {/* Popularity bars */}
          <div className="card space-y-5">
            <h2 className="font-semibold text-lg">Popularity</h2>
            <div className="space-y-3">
              <PopularityBar
                value={left.artist.popularity}
                color={COLORS[0]}
                label={left.artist.name}
              />
              <PopularityBar
                value={right.artist.popularity}
                color={COLORS[1]}
                label={right.artist.name}
              />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              {[left, right].map((s, i) => (
                <div key={s.artist.id} className="space-y-1">
                  <p className="text-xs font-medium" style={{ color: COLORS[i] }}>
                    {s.artist.name}
                  </p>
                  <p className="text-2xl font-bold">{s.artist.popularity}</p>
                  <p className="text-xs text-spotify-light">
                    {s.artist.followers.toLocaleString()} followers
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Audio features radar */}
          {(left.features || right.features) && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-lg">Audio Features</h2>
              <AudioFeaturesRadar
                artists={[left, right]
                  .filter((s) => s.features)
                  .map((s, i) => ({
                    name: s.artist.name,
                    features: s.features!,
                    color: COLORS[i],
                  }))}
              />
            </div>
          )}

          {/* Popularity history overlay */}
          {(left.history.length > 1 || right.history.length > 1) && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-lg">Popularity History (30 days)</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {[left, right].map((s, i) => (
                  <div key={s.artist.id} className="space-y-2">
                    <p className="text-sm font-medium" style={{ color: COLORS[i] }}>
                      {s.artist.name}
                    </p>
                    {s.history.length > 1 ? (
                      <PopularityChart data={s.history} color={COLORS[i]} />
                    ) : (
                      <p className="text-xs text-spotify-light py-4">Not enough data yet.</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!both && (
        <div className="text-center py-16 text-spotify-light">
          Select two artists above to compare them.
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense>
      <CompareContent />
    </Suspense>
  );
}
