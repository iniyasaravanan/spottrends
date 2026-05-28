"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { loginWithSpotify } from "@/lib/auth";

export default function Navbar() {
  const { user, loading, logout } = useAuth();

  return (
    <nav className="border-b border-white/5 bg-spotify-black/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-spotify-green">
            SpotTrends
          </Link>
          <div className="hidden sm:flex items-center gap-5 text-sm text-spotify-light">
            <Link href="/search" className="hover:text-white transition">
              Search
            </Link>
            <Link href="/compare" className="hover:text-white transition">
              Compare
            </Link>
            {user && (
              <Link href="/dashboard" className="hover:text-white transition">
                My Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {user.imageUrl && (
                <Image
                  src={user.imageUrl}
                  alt={user.displayName}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <span className="text-sm text-spotify-light hidden sm:block">
                {user.displayName}
              </span>
              <button onClick={logout} className="btn-secondary text-sm py-1.5">
                Logout
              </button>
            </div>
          ) : (
            <button onClick={loginWithSpotify} className="btn-primary text-sm">
              Login with Spotify
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
