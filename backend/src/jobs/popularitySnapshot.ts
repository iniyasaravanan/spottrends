import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { getArtist } from "../services/spotify";

const prisma = new PrismaClient();

// Runs every day at midnight UTC
export function startSnapshotJob() {
  cron.schedule("0 0 * * *", async () => {
    console.log("[cron] Starting daily popularity snapshot...");
    await runSnapshot();
  });
  console.log("[cron] Popularity snapshot job scheduled (daily at 00:00 UTC)");
}

export async function runSnapshot() {
  const artists = await prisma.artist.findMany({
    select: { id: true, spotifyId: true, name: true },
  });

  console.log(`[cron] Snapshotting ${artists.length} artists...`);

  let success = 0;
  let failed = 0;

  for (const artist of artists) {
    try {
      const sa = await getArtist(artist.spotifyId);

      await prisma.$transaction([
        prisma.popularitySnapshot.create({
          data: {
            artistId: artist.id,
            popularity: sa.popularity,
            followers: sa.followers.total,
          },
        }),
        prisma.artist.update({
          where: { id: artist.id },
          data: {
            popularity: sa.popularity,
            followers: sa.followers.total,
          },
        }),
      ]);

      success++;

      // Rate limit: 1 request per 100ms to avoid 429s
      await sleep(100);
    } catch (err) {
      console.error(
        `[cron] Failed to snapshot artist ${artist.name} (${artist.spotifyId}):`,
        err
      );
      failed++;
    }
  }

  console.log(
    `[cron] Snapshot complete. Success: ${success}, Failed: ${failed}`
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
