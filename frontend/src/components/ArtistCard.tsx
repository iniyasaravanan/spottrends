import Link from "next/link";
import { Users } from "lucide-react";
import type { LfmArtistStub } from "@/lib/lastfm";
import { getImage } from "@/lib/lastfm";
import { formatNumber, artistHref } from "@/lib/utils";
import ArtistAvatar from "./ArtistAvatar";

interface Props {
  artist: LfmArtistStub;
}

export default function ArtistCard({ artist }: Props) {
  const imageUrl = getImage(artist.image, "large");
  const href = artistHref(artist.name);

  return (
    <Link href={href} className="card-hover group flex flex-col overflow-hidden animate-fade-in">
      {/* Square image / avatar area */}
      <div className="relative aspect-square bg-lfm-surface overflow-hidden rounded-t-2xl">
        <ArtistAvatar
          name={artist.name}
          imageUrl={imageUrl}
          size={300}
          className="w-full h-full object-cover !rounded-none"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </div>

      {/* Info */}
      <div className="p-4 space-y-1">
        <p className="font-semibold leading-snug group-hover:text-lfm-red transition truncate">
          {artist.name}
        </p>
        {artist.listeners && parseInt(artist.listeners) > 0 && (
          <p className="flex items-center gap-1 text-xs text-lfm-muted">
            <Users size={11} />
            {formatNumber(artist.listeners)} listeners
          </p>
        )}
      </div>
    </Link>
  );
}
