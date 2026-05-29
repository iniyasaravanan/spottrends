"use client";

import { useState, useRef, useCallback } from "react";
import { searchArtists, type LfmArtistStub } from "@/lib/lastfm";
import ArtistCard from "@/components/ArtistCard";
import { artistHref } from "@/lib/utils";
import Link from "next/link";

// ─── Suggestions ──────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Radiohead",
  "The Beatles",
  "Kendrick Lamar",
  "Taylor Swift",
  "Daft Punk",
  "Miles Davis",
  "Björk",
  "Frank Ocean",
  "Led Zeppelin",
  "Amy Winehouse",
  "Portishead",
  "Kanye West",
];

// ─── Skeleton grid ────────────────────────────────────────────────────────────

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="card overflow-hidden animate-pulse">
          <div className="aspect-square bg-ivory-200" />
          <div className="px-3 py-3 space-y-2">
            <div className="h-3.5 bg-ivory-200 rounded w-3/4" />
            <div className="h-3 bg-ivory-100 rounded w-1/2" />
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

  const showResults = !loading && results.length > 0;
  const showEmpty   = !loading && searched && results.length === 0;
  const showSuggest = !loading && !searched;

  return (
    <div className="space-y-12">

      {/* ── Hero ── */}
      <div className="text-center space-y-4 pt-6">
        <p className="font-sans text-xs font-semibold tracking-[0.2em] uppercase text-navy-muted">
          Powered by Last.fm
        </p>
        <h1 className="font-display font-bold text-5xl sm:text-6xl text-navy leading-tight tracking-tight">
          Music Genre<br className="hidden sm:inline" /> Explorer
        </h1>
        <p className="font-sans text-navy-muted max-w-sm mx-auto text-sm leading-relaxed">
          Search any artist, explore their genres &amp; bio, and navigate through
          webs of similar musicians.
        </p>
      </div>

      {/* ── Search bar ── */}
      <div className="max-w-lg mx-auto">
        <div className="relative">
          {/* Search icon */}
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-muted pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>

          <input
            className="input pl-11 pr-10"
            placeholder="Search for an artist…"
            value={query}
            onChange={handleChange}
            autoFocus
          />

          {query && (
            <button
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-navy-muted hover:text-navy transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {error && (
          <p className="mt-2 text-center font-sans text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* ── Loading ── */}
      {loading && <SkeletonGrid />}

      {/* ── Results ── */}
      {showResults && (
        <div className="space-y-4 animate-fade-up">
          <p className="font-sans text-sm text-navy-muted text-center">
            {results.length} artists found for &ldquo;{query}&rdquo;
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {results.map((a) => (
              <ArtistCard key={a.mbid || a.name} artist={a} />
            ))}
          </div>
        </div>
      )}

      {/* ── No results ── */}
      {showEmpty && (
        <div className="text-center py-16 space-y-2">
          <p className="font-display font-semibold text-2xl text-navy">No results</p>
          <p className="font-sans text-sm text-navy-muted">
            No artists found for &ldquo;{query}&rdquo; — try a different spelling?
          </p>
        </div>
      )}

      {/* ── Suggestions ── */}
      {showSuggest && (
        <div className="space-y-5">
          <div className="divider">
            <span className="font-sans text-xs font-semibold tracking-[0.15em] uppercase text-navy-muted px-3 whitespace-nowrap">
              Explore these artists
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((name) => (
              <Link
                key={name}
                href={artistHref(name)}
                className="px-4 py-2 rounded-full border border-ivory-300
                           font-sans text-sm text-navy
                           hover:border-navy hover:bg-white hover:shadow-card
                           transition-all duration-150"
              >
                {name}
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
