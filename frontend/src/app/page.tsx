"use client";

import { useState, useRef, useCallback } from "react";
import { searchArtists, type LfmArtistStub } from "@/lib/lastfm";
import ArtistCard from "@/components/ArtistCard";
import { artistHref } from "@/lib/utils";
import Link from "next/link";

// ─── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { name: "Radiohead",       emoji: "🎸" },
  { name: "The Beatles",     emoji: "🎵" },
  { name: "Kendrick Lamar",  emoji: "🎤" },
  { name: "Taylor Swift",    emoji: "✨" },
  { name: "Daft Punk",       emoji: "🤖" },
  { name: "Miles Davis",     emoji: "🎺" },
  { name: "Björk",           emoji: "🌸" },
  { name: "Frank Ocean",     emoji: "🌊" },
  { name: "Led Zeppelin",    emoji: "⚡" },
  { name: "Amy Winehouse",   emoji: "🌹" },
  { name: "Portishead",      emoji: "🌙" },
  { name: "Kanye West",      emoji: "🎹" },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {Array.from({ length: 10 }).map((_, i) => (
        <div
          key={i}
          className="bg-white border border-cream-300 rounded-sm animate-pulse"
          style={{ transform: `rotate(${(i % 5) - 2}deg)` }}
        >
          <div className="mx-3 mt-3 aspect-square bg-cream-200 rounded-sm" />
          <div className="px-3 pt-2 pb-5 space-y-2">
            <div className="h-4 bg-cream-200 rounded w-3/4" />
            <div className="h-3 bg-cream-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [query,    setQuery]    = useState("");
  const [results,  setResults]  = useState<LfmArtistStub[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [searched, setSearched] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    setLoading(true);
    setError("");
    try {
      const res = await searchArtists(q.trim(), 20);
      setResults(res);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed — check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => runSearch(val), 400);
  }

  function handleClear() {
    setQuery(""); setResults([]); setSearched(false); setError("");
  }

  const showResults  = !loading && results.length > 0;
  const showEmpty    = !loading && searched && results.length === 0;
  const showSuggest  = !loading && !searched;

  return (
    <div className="space-y-10">

      {/* ── Hero ── */}
      <div className="text-center space-y-3 pt-4">
        {/* Decorative doodles */}
        <div className="flex justify-center gap-8 text-2xl text-brown-300 select-none">
          <span className="-rotate-12">♩</span>
          <span className="rotate-6">★</span>
          <span className="-rotate-3">♪</span>
          <span className="rotate-12">✦</span>
          <span className="-rotate-6">♫</span>
        </div>

        <h1 className="font-hand text-5xl sm:text-6xl text-brown-800 leading-tight">
          Music Genre Explorer
        </h1>
        <p className="font-sans text-brown-500 max-w-md mx-auto text-sm sm:text-base">
          Search any artist · explore their genres &amp; bio · click through a web of similar musicians
        </p>
      </div>

      {/* ── Search bar ── */}
      <div className="max-w-lg mx-auto">
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brown-400 text-lg select-none">
            ✏️
          </span>
          <input
            className="input-scrapbook pl-12 pr-12"
            placeholder="Search for an artist…"
            value={query}
            onChange={handleChange}
            autoFocus
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 font-hand text-brown-400 hover:text-brown-700 transition text-lg"
            >
              ✕
            </button>
          )}
        </div>
        {error && (
          <p className="mt-2 text-center font-hand text-base text-washi-red">
            ✕ {error}
          </p>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && <SkeletonGrid />}

      {/* ── Results ── */}
      {showResults && (
        <div className="space-y-4 animate-fade-up">
          <p className="font-hand text-lg text-brown-500 text-center">
            ✦ {results.length} artists found for &ldquo;{query}&rdquo; ✦
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map((a) => (
              <ArtistCard key={a.mbid || a.name} artist={a} />
            ))}
          </div>
        </div>
      )}

      {/* ── No results ── */}
      {showEmpty && (
        <div className="text-center py-12 space-y-2">
          <p className="text-3xl">🎵</p>
          <p className="font-hand text-xl text-brown-500">
            No artists found for &ldquo;{query}&rdquo;
          </p>
          <p className="font-sans text-sm text-brown-400">Try a different spelling?</p>
        </div>
      )}

      {/* ── Suggestions ── */}
      {showSuggest && (
        <div className="space-y-5">
          <div className="divider-tape">
            <span className="font-hand text-base text-brown-400 px-3 whitespace-nowrap">
              ✦ start here ✦
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {SUGGESTIONS.map(({ name, emoji }) => (
              <Link
                key={name}
                href={artistHref(name)}
                className="group flex items-center gap-2 bg-white border border-cream-300 rounded-lg
                           px-4 py-2 font-hand text-base text-brown-700
                           hover:border-brown-400 hover:bg-cream-50 hover:shadow-card
                           transition-all duration-150"
              >
                <span className="text-base">{emoji}</span>
                {name}
              </Link>
            ))}
          </div>

          {/* Little decorative note */}
          <p className="text-center font-hand text-brown-400 text-sm mt-2">
            click an artist · see their genres · explore similar musicians ♪
          </p>
        </div>
      )}

    </div>
  );
}
