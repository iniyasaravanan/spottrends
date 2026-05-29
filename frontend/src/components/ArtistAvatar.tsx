"use client";

import { useState } from "react";
import { initials, accentColor } from "@/lib/utils";

interface Props {
  name: string;
  imageUrl: string | null;
  size?: number;
  className?: string;
}

/**
 * Shows the artist photo if one exists (with onError fallback),
 * or a deterministically coloured initials placeholder.
 *
 * Uses a plain <img> (not next/image) so:
 *  - no domain whitelist needed
 *  - onError degrades gracefully to the initials placeholder
 */
export default function ArtistAvatar({
  name,
  imageUrl,
  size = 64,
  className = "",
}: Props) {
  const [imgFailed, setImgFailed] = useState(false);

  if (imageUrl && !imgFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className={`object-cover flex-shrink-0 ${className}`}
        onError={() => setImgFailed(true)}
      />
    );
  }

  // Initials placeholder — same colour every render for a given name
  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center font-bold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: accentColor(name),
        fontSize: Math.round(size * 0.34),
      }}
    >
      {initials(name)}
    </div>
  );
}
