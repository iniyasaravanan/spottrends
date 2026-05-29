import { notFound } from "next/navigation";
import Link from "next/link";
import { Users, Play, ExternalLink, ArrowLeft, Radio } from "lucide-react";
import type { Metadata } from "next";
import {
  getArtistInfo,
  getSimilarArtists,
  getImage,
  cleanBio,
  getTags,
} from "@/lib/lastfm";
import { formatNumber, artistHref, accentColor } from "@/lib/utils";
import ArtistAvatar from "@/components/ArtistAvatar";
import SimilarArtistCard from "@/components/SimilarArtistCard";

// ─── Metadata (SSR) ───────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { name: string };
}): Promise<Metadata> {
  const name = decodeURIComponent(params.name);
  try {
    const artist = await getArtistInfo(name);
    const bio = cleanBio(artist.bio?.summary ?? "").slice(0, 160);
    return {
      title: `${artist.name} — Genre Explorer`,
      description: bio || `Explore ${artist.name}'s genres, bio, and similar artists.`,
    };
  } catch {
    return { title: `${name} — Genre Explorer` };
  }
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-lfm-surface border border-lfm-border rounded-xl px-4 py-3">
      <span className="text-lfm-red">{icon}</span>
      <div>
        <p className="text-lg font-bold leading-none">{value}</p>
        <p className="text-xs text-lfm-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Tag list ─────────────────────────────────────────────────────────────────

function TagList({ tags }: { tags: { name: string; url: string }[] }) {
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <a
          key={tag.name}
          href={tag.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                     border border-lfm-border text-white hover:border-white/40 transition"
          style={{ backgroundColor: accentColor(tag.name) + "22" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full mr-1.5 flex-shrink-0"
            style={{ backgroundColor: accentColor(tag.name) }}
          />
          {tag.name}
        </a>
      ))}
    </div>
  );
}

// ─── Bio section ──────────────────────────────────────────────────────────────

function Bio({ raw }: { raw: string }) {
  const text = cleanBio(raw);
  if (!text) return null;

  // Split into paragraphs for readable rendering
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i} className="text-lfm-light text-sm leading-relaxed">
          {p}
        </p>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ArtistPage({
  params,
}: {
  params: { name: string };
}) {
  const name = decodeURIComponent(params.name);

  // Fetch in parallel; similar artists failure is non-fatal
  const [artist, similar] = await Promise.all([
    getArtistInfo(name).catch(() => null),
    getSimilarArtists(name, 12).catch(() => []),
  ]);

  if (!artist) notFound();

  const imageUrl  = getImage(artist.image, "extralarge");
  const tags      = getTags(artist);
  const listeners = formatNumber(artist.stats?.listeners ?? "0");
  const scrobbles = formatNumber(artist.stats?.playcount ?? "0");
  const hasBio    = !!artist.bio?.summary?.trim();

  return (
    <div className="space-y-10 animate-fade-in">

      {/* ── Back link ── */}
      <Link href="/" className="inline-flex items-center gap-1.5 btn-ghost">
        <ArrowLeft size={14} />
        Back to search
      </Link>

      {/* ── Artist header ── */}
      <div className="flex flex-col sm:flex-row gap-6 items-start">
        {/* Photo */}
        <ArtistAvatar
          name={artist.name}
          imageUrl={imageUrl}
          size={160}
          className="rounded-2xl shadow-2xl flex-shrink-0"
        />

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-lfm-muted mb-1">
              Artist
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-none break-words">
              {artist.name}
            </h1>
          </div>

          {/* Genre tags */}
          {tags.length > 0 && <TagList tags={tags.slice(0, 8)} />}

          {/* Stats row */}
          <div className="flex flex-wrap gap-3">
            <StatChip
              icon={<Users size={16} />}
              value={listeners}
              label="listeners"
            />
            <StatChip
              icon={<Play size={16} />}
              value={scrobbles}
              label="scrobbles"
            />
            {artist.ontour === "1" && (
              <StatChip
                icon={<Radio size={16} />}
                value="On Tour"
                label="right now"
              />
            )}
          </div>

          {/* Last.fm link */}
          <a
            href={artist.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-lfm-red hover:underline"
          >
            View on Last.fm
            <ExternalLink size={13} />
          </a>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="divider" />

      {/* ── Bio ── */}
      {hasBio && (
        <section className="space-y-3">
          <h2 className="section-title">About</h2>
          <Bio raw={artist.bio.summary} />
        </section>
      )}

      {/* ── Genre tags (expanded) ── */}
      {tags.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">Genres &amp; Tags</h2>
          <TagList tags={tags} />
        </section>
      )}

      {/* ── Similar artists ── */}
      {similar.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="section-title">Similar Artists</h2>
            <p className="text-xs text-lfm-muted">Click any to keep exploring</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {similar.map((a) => (
              <SimilarArtistCard key={a.name} artist={a} />
            ))}
          </div>
        </section>
      )}

      {/* ── Empty similar state ── */}
      {similar.length === 0 && (
        <section className="card p-8 text-center space-y-2">
          <p className="text-lfm-muted text-sm">No similar artists found.</p>
          <Link href="/" className="btn-ghost inline-block">
            ← Search another artist
          </Link>
        </section>
      )}

      {/* ── Explore more CTA ── */}
      {similar.length > 0 && (
        <div className="text-center pt-2">
          <Link href="/" className="btn-ghost">
            ← Search a different artist
          </Link>
        </div>
      )}

    </div>
  );
}
