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
 * Deterministically pick one of several accent colours based on
 * the first character of a string — used to colour genre tags and
 * artist placeholders consistently.
 */
const PALETTE = [
  "#D51007", // last.fm red
  "#E67E22", // orange
  "#F1C40F", // yellow
  "#2ECC71", // green
  "#1ABC9C", // teal
  "#3498DB", // blue
  "#9B59B6", // purple
  "#E91E8C", // pink
];

export function accentColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
