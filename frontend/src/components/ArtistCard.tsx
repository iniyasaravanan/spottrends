import Image from "next/image";
import Link from "next/link";
import type { Artist } from "@/lib/api";

interface Props {
  artist: Artist;
  action?: React.ReactNode;
}

export default function ArtistCard({ artist, action }: Props) {
  return (
    <div className="card flex items-center gap-4 hover:border-white/15 transition">
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
      <div className="min-w-0 flex-1">
        <Link
          href={`/artist/${artist.id}`}
          className="font-semibold hover:text-spotify-green transition truncate block"
        >
          {artist.name}
        </Link>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-spotify-light">
            Popularity: <span className="text-white">{artist.popularity}</span>
          </span>
          <span className="text-xs text-spotify-muted">·</span>
          <span className="text-xs text-spotify-light">
            {artist.followers.toLocaleString()} followers
          </span>
        </div>
        {artist.genres.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {artist.genres.slice(0, 3).map((g) => (
              <span key={g} className="badge">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
