import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import {
  searchArtists,
  getArtist,
  getArtistTopTracks,
  getAudioFeatures,
} from "../services/spotify";

const router = Router();
const prisma = new PrismaClient();

// GET /api/artist/search?q=Taylor+Swift
router.get("/search", async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim();
  if (!q) return res.status(400).json({ error: "Query parameter q required" });

  try {
    const results = await searchArtists(q, 10);
    return res.json(
      results.map((a) => ({
        spotifyId: a.id,
        name: a.name,
        imageUrl: a.images?.[0]?.url ?? null,
        genres: a.genres,
        followers: a.followers?.total ?? 0,
        popularity: a.popularity ?? 0,
      }))
    );
  } catch (err) {
    console.error("Search error:", err);
    return res.status(500).json({ error: "Failed to search artists" });
  }
});

// POST /api/artist/track  — save an artist to DB and fetch audio features
router.post("/track", async (req: Request, res: Response) => {
  const { spotifyId } = req.body as { spotifyId: string };
  if (!spotifyId) return res.status(400).json({ error: "spotifyId required" });

  try {
    const sa = await getArtist(spotifyId);

    const artist = await prisma.artist.upsert({
      where: { spotifyId },
      update: {
        name: sa.name,
        imageUrl: sa.images?.[0]?.url ?? null,
        genres: sa.genres,
        followers: sa.followers?.total ?? 0,
        popularity: sa.popularity ?? 0,
      },
      create: {
        spotifyId,
        name: sa.name,
        imageUrl: sa.images?.[0]?.url ?? null,
        genres: sa.genres,
        followers: sa.followers?.total ?? 0,
        popularity: sa.popularity ?? 0,
      },
    });

    // Take an immediate popularity snapshot
    await prisma.popularitySnapshot.create({
      data: {
        artistId: artist.id,
        popularity: sa.popularity ?? 0,
        followers: sa.followers?.total ?? 0,
      },
    });

    // Fetch + store audio features if not already stored
    const existing = await prisma.audioFeature.findUnique({
      where: { artistId: artist.id },
    });

    if (!existing) {
      await backfillAudioFeatures(artist.id, spotifyId);
    }

    return res.json(artist);
  } catch (err) {
    console.error("Track artist error:", err);
    return res.status(500).json({ error: "Failed to track artist" });
  }
});

// GET /api/artist/:id
router.get("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const artist = await prisma.artist.findUnique({
      where: { id },
      include: { audioFeatures: true },
    });
    if (!artist) return res.status(404).json({ error: "Artist not found" });
    return res.json(artist);
  } catch (err) {
    console.error("Get artist error:", err);
    return res.status(500).json({ error: "Failed to get artist" });
  }
});

// GET /api/artist/:id/history
router.get("/:id/history", async (req: Request, res: Response) => {
  const { id } = req.params;
  const days = parseInt((req.query.days as string) ?? "30", 10);

  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const snapshots = await prisma.popularitySnapshot.findMany({
      where: { artistId: id, snappedAt: { gte: since } },
      orderBy: { snappedAt: "asc" },
    });

    return res.json(snapshots);
  } catch (err) {
    console.error("Get history error:", err);
    return res.status(500).json({ error: "Failed to get history" });
  }
});

// GET /api/artist/:id/top-tracks
router.get("/:id/top-tracks", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const artist = await prisma.artist.findUnique({
      where: { id },
      select: { spotifyId: true },
    });
    if (!artist) return res.status(404).json({ error: "Artist not found" });

    const tracks = await getArtistTopTracks(artist.spotifyId);
    return res.json(
      tracks.slice(0, 10).map((t, i) => ({
        rank: i + 1,
        spotifyId: t.id,
        name: t.name,
        artists: t.artists.map((a) => a.name),
        albumName: t.album.name,
        imageUrl: t.album.images?.[0]?.url ?? null,
      }))
    );
  } catch (err) {
    console.error("Get top tracks error:", err);
    return res.status(500).json({ error: "Failed to fetch top tracks" });
  }
});

// GET /api/artist/:id/audio-features
router.get("/:id/audio-features", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const features = await prisma.audioFeature.findUnique({
      where: { artistId: id },
    });
    if (!features)
      return res.status(404).json({ error: "Audio features not found" });
    return res.json(features);
  } catch (err) {
    console.error("Get audio features error:", err);
    return res.status(500).json({ error: "Failed to get audio features" });
  }
});

// GET /api/artist  — list all tracked artists
router.get("/", async (_req: Request, res: Response) => {
  try {
    const artists = await prisma.artist.findMany({
      orderBy: { popularity: "desc" },
      select: {
        id: true,
        spotifyId: true,
        name: true,
        imageUrl: true,
        genres: true,
        followers: true,
        popularity: true,
        updatedAt: true,
      },
    });
    return res.json(artists);
  } catch (err) {
    console.error("List artists error:", err);
    return res.status(500).json({ error: "Failed to list artists" });
  }
});

async function backfillAudioFeatures(artistId: string, spotifyId: string) {
  try {
    const tracks = await getArtistTopTracks(spotifyId);
    if (!tracks.length) return;

    const trackIds = tracks.slice(0, 5).map((t) => t.id);
    const features = await getAudioFeatures(trackIds);
    if (!features.length) return;

    // Average across top tracks to get artist-level audio profile
    const avg = features.reduce(
      (acc, f) => ({
        energy: acc.energy + f.energy / features.length,
        danceability: acc.danceability + f.danceability / features.length,
        valence: acc.valence + f.valence / features.length,
        tempo: acc.tempo + f.tempo / features.length,
        acousticness: acc.acousticness + f.acousticness / features.length,
        instrumentalness:
          acc.instrumentalness + f.instrumentalness / features.length,
        liveness: acc.liveness + f.liveness / features.length,
        speechiness: acc.speechiness + f.speechiness / features.length,
      }),
      {
        energy: 0,
        danceability: 0,
        valence: 0,
        tempo: 0,
        acousticness: 0,
        instrumentalness: 0,
        liveness: 0,
        speechiness: 0,
      }
    );

    await prisma.audioFeature.upsert({
      where: { artistId },
      update: avg,
      create: { artistId, ...avg },
    });
  } catch (err) {
    console.error("Backfill audio features error:", err);
  }
}

export { backfillAudioFeatures };
export default router;
