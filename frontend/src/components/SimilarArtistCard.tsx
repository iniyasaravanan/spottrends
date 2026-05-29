import Link from "next/link";
import type { LfmSimilarArtist } from "@/lib/lastfm";
import { getImage } from "@/lib/lastfm";
import { artistHref } from "@/lib/utils";
import ArtistAvatar from "./ArtistAvatar";

interface Props {
  artist: LfmSimilarArtist;
}

export default function SimilarArtistCard({ artist }: Props) {
  const imageUrl = getImage(artist.image, "large");
  const matchPct = Math.round(parseFloat(artist.match) * 100);
  const href = artistHref(artist.name);

  return (
    <Link
      href={href}
      className="card-hover group flex flex-col overflow-hidden"
    >
      {/* Image / avatar */}
      <div className="relative aspect-square bg-lfm-surface overflow-hidden rounded-t-2xl">
        <ArtistAvatar
          name={artist.name}
          imageUrl={imageUrl}
          size={200}
          className="w-full h-full object-cover !rounded-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Match badge */}
        {matchPct > 0 && (
          <div className="absolute bottom-2 right-2 bg-lfm-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {matchPct}% match
          </div>
        )}
      </div>

      {/* Name */}
      <div className="px-3 py-2.5">
        <p className="text-sm font-medium leading-snug group-hover:text-lfm-red transition truncate">
          {artist.name}
        </p>
      </div>
    </Link>
  );
}
