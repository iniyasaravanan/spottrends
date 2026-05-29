import "dotenv/config";
import express from "express";
import cors from "cors";
import artistRouter from "./routes/artist";
import authRouter from "./routes/auth";
import userRouter from "./routes/user";
import { startSnapshotJob } from "./jobs/popularitySnapshot";

const app = express();
const PORT = parseInt(process.env.PORT ?? "4000", 10);

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001", "https://spottrends-app.vercel.app"],
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// Routes
app.use("/api/auth", authRouter);
app.use("/api/artist", artistRouter);
app.use("/api/user", userRouter);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
);

app.listen(PORT, () => {
  console.log(`SpotTrends API running on port ${PORT}`);
  startSnapshotJob();
});

export default app;
