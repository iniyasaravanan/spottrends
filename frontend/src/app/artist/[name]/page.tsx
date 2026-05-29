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
import { formatNumber, artistHref, washiColor, polaroidRotation } from "@/lib/utils";
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

// ─── Washi tag ────────────────────────────────────────────────────────────────

function WashiTag({
  name,
  url,
  index,
}: {
  name: string;
  url: string;
  index: number;
}) {
  const { bg, text } = washiColor(name);
  const rot = index % 2 === 0 ? "-rotate-1" : "rotate-1";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`washi-tag ${rot} hover:brightness-95 transition`}
      style={{ backgroundColor: bg + "CC", color: text }}
    >
      {name}
    </a>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="bg-white border border-cream-300 rounded-xl px-4 py-3 flex items-center gap-2.5"
         style={{ boxShadow: "1px 2px 6px rgba(74,55,40,0.08)" }}>
      <span className="text-xl">{icon}</span>
      <div>
        <p className="font-hand text-xl leading-none text-brown-800">{value}</p>
        <p className="font-sans text-xs text-brown-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Bio section ──────────────────────────────────────────────────────────────

function Bio({ raw }: { raw: string }) {
  const text = cleanBio(raw);
  if (!text) return null;
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className="sticky-note space-y-3">
      {paragraphs.map((p, i) => (
        <p key={i} className="font-sans text-sm text-brown-700 leading-relaxed">
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
  const rot       = polaroidRotation(artist.name);

  // Prepare similar artists for the force graph
  const graphSimilar = similar.map((s) => ({
    name: s.name,
    imageUrl: getImage(s.image, "large"),
    match: parseFloat(s.match),
  }));

  return (
    <div className="space-y-10 animate-fade-up">

      {/* ── Back ── */}
      <Link href="/" className="btn-ghost inline-flex items-center gap-1">
        ← back to search
      </Link>

      {/* ── Artist header (big polaroid + info) ── */}
      <div className="flex flex-col sm:flex-row gap-8 items-start">

        {/* Big polaroid photo */}
        <div
          className="polaroid flex-shrink-0 mx-auto sm:mx-0"
          style={{ transform: `rotate(${rot}deg)`, width: 180 }}
        >
          {/* Washi tape strip */}
          <div
            className="h-5 w-16 mx-auto -mt-2.5 mb-2 rounded-sm opacity-85"
            style={{ backgroundColor: washiColor(artist.name).bg }}
          />
          <div className="mx-3 overflow-hidden bg-cream-200" style={{ aspectRatio: "1" }}>
            <ArtistAvatar
              name={artist.name}
              imageUrl={imageUrl}
              size={160}
              className="w-full h-full"
            />
          </div>
          <div className="px-3 pt-2 pb-5 text-center">
            <p className="font-hand text-xl text-brown-800 leading-snug">{artist.name}</p>
            {artist.ontour === "1" && (
              <p className="font-hand text-sm text-washi-red mt-0.5">🎪 on tour!</p>
            )}
          </div>
        </div>

        {/* Info column */}
        <div className="flex-1 space-y-5 pt-2">
          <div>
            <p className="font-hand text-sm text-brown-400 uppercase tracking-widest mb-1">Artist</p>
            <h1 className="font-hand text-5xl text-brown-800 leading-none">{artist.name}</h1>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-3">
            <StatChip icon="👂" value={listeners} label="listeners" />
            <StatChip icon="▶️" value={scrobbles} label="scrobbles" />
          </div>

          {/* Genre / washi tags */}
          {tags.length > 0 && (
            <div className="space-y-2">
              <p className="font-hand text-base text-brown-500">✦ genres &amp; tags</p>
              <div className="flex flex-wrap gap-2">
                {tags.slice(0, 10).map((tag, i) => (
                  <WashiTag key={tag.name} name={tag.name} url={tag.url} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Last.fm link */}
          <a
            href={artist.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-hand text-sm text-brown-400 hover:text-brown-700 transition inline-flex items-center gap-1"
          >
            view on Last.fm ↗
          </a>
        </div>
      </div>

      {/* ── About / bio ── */}
      {hasBio && (
        <section className="space-y-3">
          <h2 className="section-title">✍︎ About</h2>
          <Bio raw={artist.bio.summary} />
        </section>
      )}

      {/* ── Similarity web ── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between flex-wrap gap-2">
          <h2 className="section-title">🕸 Similarity Web</h2>
          <p className="font-hand text-sm text-brown-400">
            artists closer to the centre are more similar
          </p>
        </div>

        {graphSimilar.length > 0 ? (
          <ForceGraph
            center={{ name: artist.name, imageUrl }}
            similar={graphSimilar}
          />
        ) : (
          <div className="paper p-8 text-center space-y-2">
            <p className="text-3xl">🎵</p>
            <p className="font-hand text-lg text-brown-500">No similar artists found.</p>
            <Link href="/" className="btn-ghost inline-block mt-1">
              ← explore another artist
            </Link>
          </div>
        )}
      </section>

      {/* ── Quick links: similar artists as text ── */}
      {similar.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-title">✦ Similar Artists</h2>
          <div className="flex flex-wrap gap-2">
            {similar.map((s) => (
              <Link
                key={s.name}
                href={artistHref(s.name)}
                className="bg-white border border-cream-300 rounded-full px-3 py-1
                           font-hand text-sm text-brown-700 hover:border-brown-400
                           hover:bg-cream-50 transition-all duration-150"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Back CTA ── */}
      <div className="text-center pt-4">
        <Link href="/" className="btn-ghost">← search a different artist</Link>
      </div>

    </div>
  );
}
