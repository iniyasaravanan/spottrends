import Image from "next/image";
import { initials, accentColor } from "@/lib/utils";

interface Props {
  name: string;
  imageUrl: string | null;
  size?: number;
  className?: string;
}

/**
 * Renders an artist photo if one exists, otherwise a coloured
 * initials placeholder that is deterministically based on the name.
 */
export default function ArtistAvatar({
  name,
  imageUrl,
  size = 64,
  className = "",
}: Props) {
  const rounded = `rounded-xl`;

  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={size}
        height={size}
        className={`${rounded} object-cover flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${rounded} flex-shrink-0 flex items-center justify-center font-bold text-white select-none ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: accentColor(name),
        fontSize: size * 0.32,
      }}
    >
      {initials(name)}
    </div>
  );
}
