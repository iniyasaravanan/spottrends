/** Format a large number into a human-readable string: 5521895 → "5.5M" */
export function formatNumber(n: number | string): string {
  const num = typeof n === "string" ? parseInt(n, 10) : n;
  if (isNaN(num)) return "—";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
  return num.toLocaleString();
}

/** URL-encode an artist name for use in Next.js route segments. */
export function artistHref(name: string): string {
  return `/artist/${encodeURIComponent(name)}`;
}

/** Return initials (up to 2 chars) for an artist name placeholder. */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Accent colour — deterministic from seed, used for circle node fills and avatars.
 * Rich, slightly muted tones that work with white text and the navy/ivory palette.
 */
const ACCENTS = [
  "#2A6B6B", // deep teal
  "#C4593D", // terracotta
  "#5A7A8F", // steel blue
  "#7A5A8A", // dusty purple
  "#B87840", // amber
  "#4A8A66", // forest green
  "#B85570", // rose
  "#8A6A3A", // warm brown
];

export function accentColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}
