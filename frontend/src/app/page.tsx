"use client";

import { useState, useRef, useCallback } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { searchArtists, type LfmArtistStub } from "@/lib/lastfm";
import ArtistCard from "@/components/ArtistCard";
import { artistHref } from "@/lib/utils";
import Link from "next/link";

// ─── Suggested starting points ────────────────────────────────────────────────

const SUGGESTIONS = [
  "Radiohead", "The Beatles", "Kendrick Lamar", "Taylor Swift",
  "Daft Punk",  "Miles Davis",  "Björk",          "Frank Ocean",
  "Led Zeppelin","Kanye West",   "Amy Winehouse",  "Portishead",
];

// ─── Skeleton cards ───────────────────────────────────────────────────────────

function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden animate-pulse">
          <div className="aspect-square bg-lfm-surface" />
          <div className="p-4 space-y-2">
            <div className="h-3.5 bg-lfm-border rounded w-3/4" />
            <div className="h-3 bg-lfm-border rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [query, setQuery]     = useState("");
  const [results, setResults] = useState<LfmArtistStub[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [searched, setSearched] = useState(false);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await searchArtists(q.trim(), 20);
      setResults(res);
      setSearched(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setResults([]);
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
    setQuery("");
    setResults([]);
    setSearched(false);
    setError("");
  }

  const showEmpty    = searched && !loading && results.length === 0;
  const showSuggest  = !searched && !loading;
  const showResults  = results.length > 0 && !loading;

  return (
    <div className="space-y-10">

      {/* ── Hero ── */}
      <div className="text-center space-y-4 pt-6">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
          Music{" "}
          <span className="text-lfm-red">Genre Explorer</span>
        </h1>
        <p className="text-lfm-light max-w-lg mx-auto">
          Search any artist to explore their genres, bio, listener stats, and
          travel through webs of similar musicians.
        </p>
      </div>

      {/* ── Search bar ── */}
      <div className="max-w-xl mx-auto relative">
        <Search
          size={18}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-lfm-muted pointer-events-none"
        />
        <input
          className="input pl-11 pr-11 text-base"
          placeholder="Search for an artist…"
          value={query}
          onChange={handleChange}
          autoFocus
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-lfm-muted hover:text-white transition"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="text-center text-red-400 text-sm">{error}</p>
      )}

      {/* ── Loading ── */}
      {loading && <SkeletonGrid />}

      {/* ── Results ── */}
      {showResults && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-lfm-muted">
            {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
            <span className="text-white">&ldquo;{query}&rdquo;</span>
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
          <p className="text-2xl">🎵</p>
          <p className="text-lfm-light">
            No artists found for &ldquo;{query}&rdquo;
          </p>
        </div>
      )}

      {/* ── Suggestions (shown when idle) ── */}
      {showSuggest && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-lfm-muted">
            <TrendingUp size={14} />
            <span>Start exploring</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((name) => (
              <Link
                key={name}
                href={artistHref(name)}
                className="px-4 py-2 rounded-full bg-lfm-card border border-lfm-border
                           text-sm text-lfm-light hover:text-white hover:border-white/30
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
