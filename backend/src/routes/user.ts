import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET /api/user/top  — logged-in user's top tracks and artists
router.get("/top", requireAuth, async (req: AuthRequest, res: Response) => {
  const timeRange = (req.query.time_range as string) ?? "medium_term";

  try {
    const [tracks, artists] = await Promise.all([
      prisma.userTopTrack.findMany({
        where: { userId: req.userId!, timeRange },
        orderBy: { rank: "asc" },
        take: 20,
      }),
      prisma.userTopArtist.findMany({
        where: { userId: req.userId!, timeRange },
        orderBy: { rank: "asc" },
        include: {
          artist: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
              genres: true,
              popularity: true,
            },
          },
        },
        take: 20,
      }),
    ]);

    return res.json({ tracks, artists });
  } catch (err) {
    console.error("Get user top error:", err);
    return res.status(500).json({ error: "Failed to fetch user data" });
  }
});

// GET /api/user/profile
router.get("/profile", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        spotifyId: true,
        displayName: true,
        email: true,
        imageUrl: true,
        createdAt: true,
        _count: {
          select: { topTracks: true, topArtists: true },
        },
      },
    });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (err) {
    console.error("Get profile error:", err);
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

export default router;
