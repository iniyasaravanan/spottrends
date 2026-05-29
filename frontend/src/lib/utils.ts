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
 * Return a deterministic rotation in degrees [-5, +5] for a polaroid card,
 * based on the artist name so it's consistent across renders.
 */
export function polaroidRotation(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  }
  return ((Math.abs(hash) % 11) - 5); // -5 … +5
}

/**
 * Pick a washi-tape colour pair (bg, text) deterministically from the name.
 */
const WASHI: { bg: string; text: string }[] = [
  { bg: "#F4B8C1", text: "#7A3A42" }, // pink
  { bg: "#9CCEE0", text: "#1A4A5C" }, // blue
  { bg: "#F5D67E", text: "#5C4A1A" }, // yellow
  { bg: "#A8C8A0", text: "#2A4A28" }, // green
  { bg: "#C4A8D4", text: "#3A2A4A" }, // purple
  { bg: "#F0A882", text: "#5C2A1A" }, // peach
  { bg: "#9ED8C8", text: "#1A4A3A" }, // mint
  { bg: "#D47878", text: "#4A1A1A" }, // red
];

export function washiColor(seed: string): { bg: string; text: string } {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return WASHI[Math.abs(hash) % WASHI.length];
}

/**
 * Accent colour — for graph node placeholders.
 * Returns a more saturated colour than washi colours.
 */
const ACCENTS = [
  "#C85A54", "#E8A45C", "#5A9CC8", "#6AAF7A",
  "#9B6DC8", "#C86A8A", "#5ABCB0", "#C8A85A",
];

export function accentColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) & 0xffffffff;
  }
  return ACCENTS[Math.abs(hash) % ACCENTS.length];
}
