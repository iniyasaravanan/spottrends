"use client";

import { useState } from "react";
import Link from "next/link";
import type { LfmArtistStub } from "@/lib/lastfm";
import { getImage } from "@/lib/lastfm";
import { formatNumber, artistHref, accentColor, initials } from "@/lib/utils";

interface Props {
  artist: LfmArtistStub;
}

export default function ArtistCard({ artist }: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  const imageUrl = getImage(artist.image, "large");
  const href     = artistHref(artist.name);
  const color    = accentColor(artist.name);
  const showImg  = !!imageUrl && !imgFailed;

  return (
    <Link href={href} className="group block animate-fade-up">
      <div className="card overflow-hidden hover:shadow-lift transition-shadow duration-200">

        {/* Square image / avatar area */}
        <div
          className="relative w-full overflow-hidden"
          style={{ aspectRatio: "1", backgroundColor: color }}
        >
          {/* Initials — always present as the background layer */}
          <div
            className="absolute inset-0 flex items-center justify-center
                       text-white font-display font-bold select-none"
            style={{ fontSize: "2.2rem" }}
          >
            {initials(artist.name)}
          </div>

          {/* Photo — sits on top; hides itself on error, revealing initials */}
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={artist.name}
              className={`absolute inset-0 w-full h-full object-cover
                          group-hover:scale-105 transition-transform duration-300
                          ${showImg ? "" : "hidden"}`}
              onError={() => setImgFailed(true)}
            />
          )}
        </div>

        {/* Info */}
        <div className="px-3 py-3">
          <p className="font-display font-semibold text-sm text-navy leading-snug truncate">
            {artist.name}
          </p>
          {artist.listeners && parseInt(artist.listeners) > 0 && (
            <p className="font-sans text-xs text-navy-muted mt-0.5">
              {formatNumber(artist.listeners)} listeners
            </p>
          )}
        </div>

      </div>
    </Link>
  );
}
