import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getArtistInfo,
  getSimilarArtists,
  getImage,
  cleanBio,
  getTags,
} from "@/lib/lastfm";
import { formatNumber, artistHref, accentColor, initials } from "@/lib/utils";
import ArtistAvatar from "@/components/ArtistAvatar";
import ForceGraph from "@/components/ForceGraph";

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { name: string };
}): Promise<Metadata> {
  const name = decodeURIComponent(params.name);
  try {
    const artist = await getArtistInfo(name);
    const bio = cleanBio(artist.bio?.summary ?? "").slice(0, 155);
    return {
      title: `${artist.name} — Genre Explorer`,
      description: bio || `Explore ${artist.name}'s genres, bio, and similar artists.`,
    };
  } catch {
    return { title: `${name} — Genre Explorer` };
  }
}

// ─── Genre tag ────────────────────────────────────────────────────────────────

function GenreTag({ name, url }: { name: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="tag">
      {name}
    </a>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-4 py-3 min-w-[7rem]">
      <p className="font-display font-bold text-xl text-navy leading-none">{value}</p>
      <p className="font-sans text-xs text-navy-muted mt-1">{label}</p>
    </div>
  );
}

// ─── Bio ──────────────────────────────────────────────────────────────────────

function Bio({ raw }: { raw: string }) {
  const text = cleanBio(raw);
  if (!text) return null;
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className="space-y-3 pl-4 border-l-2 border-ivory-300">
      {paragraphs.map((p, i) => (
        <p key={i} className="font-sans text-sm text-navy leading-relaxed">
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

  const [artist, similar] = await Promise.all([
    getArtistInfo(name).catch(() => null),
    getSimilarArtists(name, 12).catch(() => []),
  ]);

  if (!artist) notFound();

  const imageUrl  = getImage(artist.image, "extralarge");
  const tags      = getTags(artist);
  const listeners = formatNumber(artist.stats?.listeners ?? "0");
  const scrobbles = formatNumber(artist.stats?.playcount ?? "0");
  const hasBio    = !!cleanBio(artist.bio?.summary ?? "");
  const color     = accentColor(artist.name);

  // Prepare similar artists for the force graph
  const graphSimilar = similar.map((s) => ({
    name: s.name,
    imageUrl: getImage(s.image, "large"),
    match: parseFloat(s.match),
  }));

  return (
    <div className="space-y-12 animate-fade-up">

      {/* ── Back ── */}
      <Link href="/" className="btn-ghost inline-flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to search
      </Link>

      {/* ── Artist header ── */}
      <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">

        {/* Circle avatar */}
        <div
          className="rounded-full overflow-hidden flex-shrink-0 relative"
          style={{ width: 160, height: 160, backgroundColor: color }}
        >
          {/* Initials fallback */}
          <div
            className="absolute inset-0 flex items-center justify-center
                       text-white font-display font-bold select-none text-5xl"
          >
            {initials(artist.name)}
          </div>
          {/* Photo */}
          <ArtistAvatar
            name={artist.name}
            imageUrl={imageUrl}
            size={160}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Info column */}
        <div className="flex-1 space-y-5 text-center sm:text-left">
          <div>
            <p className="font-sans text-xs font-semibold tracking-[0.15em] uppercase text-navy-muted mb-1">
              Artist
            </p>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-navy
                           leading-tight tracking-tight">
              {artist.name}
            </h1>
            {artist.ontour === "1" && (
              <p className="font-sans text-sm text-emerald-600 mt-1 font-medium">
                ● On tour now
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-3 justify-center sm:justify-start flex-wrap">
            <StatChip value={listeners} label="listeners" />
            <StatChip value={scrobbles} label="scrobbles" />
          </div>

          {/* Genre tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <p className="font-sans text-xs font-semibold tracking-[0.12em] uppercase text-navy-muted">
                Genres
              </p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {tags.slice(0, 10).map((tag) => (
                  <GenreTag key={tag.name} name={tag.name} url={tag.url} />
                ))}
              </div>
            </div>
          )}

          {/* Last.fm link */}
          <a
            href={artist.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-sans text-xs text-navy-muted hover:text-navy transition
                       inline-flex items-center gap-1"
          >
            View on Last.fm →
          </a>
        </div>
      </div>

      {/* ── About / bio ── */}
      {hasBio && (
        <section className="space-y-3">
          <h2 className="section-title">About</h2>
          <Bio raw={artist.bio?.summary ?? ""} />
        </section>
      )}

      {/* ── Similarity web ── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="section-title">Similarity Web</h2>
          <p className="font-sans text-xs text-navy-muted">
            closer to centre = more similar
          </p>
        </div>

        {graphSimilar.length > 0 ? (
          <ForceGraph
            center={{ name: artist.name, imageUrl }}
            similar={graphSimilar}
          />
        ) : (
          <div className="card p-10 text-center space-y-3">
            <p className="font-display font-semibold text-lg text-navy">
              No similar artists found
            </p>
            <Link href="/" className="btn-ghost inline-block">
              ← Explore another artist
            </Link>
          </div>
        )}
      </section>

      {/* ── Similar artists as text links ── */}
      {similar.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">Similar Artists</h2>
          <div className="flex flex-wrap gap-2">
            {similar.map((s) => (
              <Link
                key={s.name}
                href={artistHref(s.name)}
                className="tag hover:bg-navy hover:text-white hover:border-navy"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Footer CTA ── */}
      <div className="text-center pt-4 pb-8">
        <Link href="/" className="btn-ghost">← Search a different artist</Link>
      </div>

    </div>
  );
}
