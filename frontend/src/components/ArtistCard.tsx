import Link from "next/link";
import type { LfmArtistStub } from "@/lib/lastfm";
import { getImage } from "@/lib/lastfm";
import { formatNumber, artistHref, polaroidRotation, washiColor } from "@/lib/utils";
import ArtistAvatar from "./ArtistAvatar";

interface Props {
  artist: LfmArtistStub;
}

export default function ArtistCard({ artist }: Props) {
  const imageUrl = getImage(artist.image, "large");
  const href = artistHref(artist.name);
  const rot = polaroidRotation(artist.name);
  // Pick a washi colour for the tape strip at the top
  const tape = washiColor(artist.name + "tape");

  return (
    <Link
      href={href}
      className="group block animate-fade-up"
      style={{ transform: `rotate(${rot}deg)`, transformOrigin: "center" }}
    >
      <div className="polaroid group-hover:!transform group-hover:rotate-0 group-hover:scale-105">
        {/* Washi tape strip at the top */}
        <div
          className="h-4 w-14 mx-auto -mt-2 mb-1 rounded-sm opacity-80"
          style={{ backgroundColor: tape.bg }}
        />

        {/* Square photo area */}
        <div className="mx-3 overflow-hidden bg-cream-200" style={{ aspectRatio: "1" }}>
          <ArtistAvatar
            name={artist.name}
            imageUrl={imageUrl}
            size={240}
            className="w-full h-full"
          />
        </div>

        {/* Polaroid caption area */}
        <div className="px-3 pt-2 pb-4">
          <p className="font-hand text-lg leading-snug text-brown-800 truncate">
            {artist.name}
          </p>
          {artist.listeners && parseInt(artist.listeners) > 0 && (
            <p className="font-sans text-xs text-brown-400 mt-0.5">
              ♪ {formatNumber(artist.listeners)} listeners
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
