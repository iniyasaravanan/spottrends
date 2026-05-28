"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type Artist } from "@/lib/api";
import ArtistCard from "@/components/ArtistCard";
import { useAuth } from "@/context/AuthContext";
import { loginWithSpotify } from "@/lib/auth";

export default function HomePage() {
  const { user } = useAuth();
  const [trending, setTrending] = useState<Artist[]>([]);

  useEffect(() => {
    api.artists.list().then((list) => setTrending(list.slice(0, 6))).catch(() => {});
  }, []);

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="text-center py-16 space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          Track your favourite{" "}
          <span className="text-spotify-green">artists</span>
        </h1>
        <p className="text-spotify-light text-lg max-w-xl mx-auto">
          SpotTrends stores daily popularity snapshots, audio features, and
          lets you compare artists side by side — all powered by the Spotify
          API.
        </p>
        <div className="flex justify-center gap-3">
          <Link href="/search" className="btn-primary">
            Search Artists
          </Link>
          {!user && (
            <button onClick={loginWithSpotify} className="btn-secondary">
              Login with Spotify
            </button>
          )}
          {user && (
            <Link href="/dashboard" className="btn-secondary">
              My Dashboard
            </Link>
          )}
        </div>
      </section>

      {/* Feature highlights */}
      <section className="grid sm:grid-cols-3 gap-5">
        {[
          {
            icon: "📈",
            title: "Popularity History",
            desc: "Daily snapshots show how an artist's popularity rises and falls over time.",
          },
          {
            icon: "🎛",
            title: "Audio Features",
            desc: "Radar charts visualise energy, danceability, valence, and more.",
          },
          {
            icon: "⚡",
            title: "Artist Comparison",
            desc: "Put two artists side by side to see how they stack up.",
          },
        ].map((f) => (
          <div key={f.title} className="card space-y-2">
            <span className="text-2xl">{f.icon}</span>
            <h3 className="font-semibold">{f.title}</h3>
            <p className="text-sm text-spotify-light">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* Tracked artists */}
      {trending.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Tracked Artists</h2>
            <Link href="/search" className="text-sm text-spotify-green hover:underline">
              + Add artist
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {trending.map((a) => (
              <ArtistCard key={a.id} artist={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
