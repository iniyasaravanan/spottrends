import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import {
  getAuthUrl,
  exchangeCode,
  getSpotifyUser,
  getUserTopTracks,
  getUserTopArtists,
} from "../services/spotify";
import { signToken } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// In-memory CSRF state store (use Redis in production)
const pendingStates = new Set<string>();

// GET /api/auth/login
router.get("/login", (_req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString("hex");
  pendingStates.add(state);
  // Clean up after 10 minutes
  setTimeout(() => pendingStates.delete(state), 10 * 60 * 1000);
  res.redirect(getAuthUrl(state));
});

// GET /api/auth/callback
router.get("/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;
  const frontendUrl = process.env.FRONTEND_URL!;

  if (error) {
    return res.redirect(`${frontendUrl}/auth/error?reason=${error}`);
  }

  if (!state || !pendingStates.has(state)) {
    return res.redirect(`${frontendUrl}/auth/error?reason=invalid_state`);
  }

  pendingStates.delete(state);

  try {
    const tokens = await exchangeCode(code);
    const spotifyUser = await getSpotifyUser(tokens.access_token);

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const user = await prisma.user.upsert({
      where: { spotifyId: spotifyUser.id },
      update: {
        displayName: spotifyUser.display_name,
        email: spotifyUser.email,
        imageUrl: spotifyUser.images?.[0]?.url ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt,
      },
      create: {
        spotifyId: spotifyUser.id,
        displayName: spotifyUser.display_name,
        email: spotifyUser.email,
        imageUrl: spotifyUser.images?.[0]?.url ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt,
      },
    });

    // Seed top tracks + artists in background
    seedUserData(user.id, tokens.access_token).catch(console.error);

    const jwt = signToken(user.id);
    return res.redirect(`${frontendUrl}/auth/callback?token=${jwt}`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return res.redirect(`${frontendUrl}/auth/error?reason=server_error`);
  }
});

// GET /api/auth/me
router.get("/me", async (req: Request, res: Response) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const jwt = require("jsonwebtoken");
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as {
      userId: string;
    };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        spotifyId: true,
        displayName: true,
        email: true,
        imageUrl: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
});

async function seedUserData(userId: string, accessToken: string) {
  const [tracks, artists] = await Promise.all([
    getUserTopTracks(accessToken, "medium_term", 20),
    getUserTopArtists(accessToken, "medium_term", 20),
  ]);

  // Upsert artists into main artists table first
  for (const a of artists) {
    await prisma.artist.upsert({
      where: { spotifyId: a.id },
      update: {
        name: a.name,
        imageUrl: a.images?.[0]?.url ?? null,
        genres: a.genres,
        followers: a.followers.total,
        popularity: a.popularity,
      },
      create: {
        spotifyId: a.id,
        name: a.name,
        imageUrl: a.images?.[0]?.url ?? null,
        genres: a.genres,
        followers: a.followers.total,
        popularity: a.popularity,
      },
    });
  }

  // Delete old snapshots for this user
  await prisma.userTopTrack.deleteMany({ where: { userId } });
  await prisma.userTopArtist.deleteMany({ where: { userId } });

  // Insert top tracks
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    const artistRecord = await prisma.artist.findUnique({
      where: { spotifyId: t.artists[0]?.id },
    });
    await prisma.userTopTrack.create({
      data: {
        userId,
        spotifyId: t.id,
        name: t.name,
        artistId: artistRecord?.id ?? null,
        artistName: t.artists[0]?.name ?? "Unknown",
        albumName: t.album.name,
        imageUrl: t.album.images?.[0]?.url ?? null,
        popularity: t.popularity,
        rank: i + 1,
        timeRange: "medium_term",
      },
    });
  }

  // Insert top artists
  for (let i = 0; i < artists.length; i++) {
    const a = artists[i];
    const artistRecord = await prisma.artist.findUnique({
      where: { spotifyId: a.id },
    });
    if (!artistRecord) continue;
    await prisma.userTopArtist.create({
      data: {
        userId,
        artistId: artistRecord.id,
        rank: i + 1,
        timeRange: "medium_term",
      },
    });
  }
}

export default router;
