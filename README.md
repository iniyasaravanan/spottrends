# SpotTrends

Music analytics platform that tracks Spotify artist popularity over time, visualises audio features, and lets users compare artists side by side.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client (Vercel)                           │
│                                                                     │
│   Next.js 14  ──  Tailwind CSS  ──  Recharts                       │
│      │                                                              │
│   Pages:  /search  /artist/[id]  /compare  /dashboard              │
│      │                                                              │
│   AuthContext (JWT in localStorage)                                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  HTTPS REST
┌──────────────────────────▼──────────────────────────────────────────┐
│                      API Server (Railway)                           │
│                                                                     │
│   Express + TypeScript                                              │
│                                                                     │
│   POST /api/auth/login       → redirect to Spotify OAuth            │
│   GET  /api/auth/callback    → exchange code, set JWT               │
│   GET  /api/auth/me          → current user info                    │
│                                                                     │
│   GET  /api/artist/search    → proxy Spotify search                 │
│   POST /api/artist/track     → save artist + snapshot + features    │
│   GET  /api/artist           → list all tracked artists             │
│   GET  /api/artist/:id       → single artist + audio features       │
│   GET  /api/artist/:id/history   → popularity snapshots             │
│   GET  /api/artist/:id/audio-features                               │
│                                                                     │
│   GET  /api/user/profile     → logged-in user profile (JWT)        │
│   GET  /api/user/top         → top tracks & artists (JWT)           │
│                                                                     │
│   node-cron  → daily 00:00 UTC popularity snapshot for all artists  │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  Prisma ORM
┌──────────────────────────▼──────────────────────────────────────────┐
│                    PostgreSQL (Railway)                              │
│                                                                     │
│  artists            spotifyId, name, imageUrl, genres,              │
│                     followers, popularity                           │
│                                                                     │
│  popularity_snapshots  artistId → artists, popularity,             │
│                        followers, snappedAt                         │
│                                                                     │
│  audio_features     artistId → artists, energy, danceability,      │
│                     valence, tempo, acousticness,                   │
│                     instrumentalness, liveness, speechiness         │
│                                                                     │
│  users              spotifyId, displayName, email,                  │
│                     accessToken, refreshToken, tokenExpiresAt       │
│                                                                     │
│  user_top_tracks    userId → users, artistId → artists,            │
│                     rank, timeRange, snappedAt                      │
│                                                                     │
│  user_top_artists   userId → users, artistId → artists,            │
│                     rank, timeRange, snappedAt                      │
└─────────────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────────┐
│                     Spotify Web API                                 │
│  • Client Credentials (search, artist, audio-features)             │
│  • Authorization Code (user top tracks/artists)                    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
spottrends/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │       └── 20240101000000_init/migration.sql
│   ├── src/
│   │   ├── index.ts                  Express app + server
│   │   ├── middleware/
│   │   │   └── auth.ts               JWT verify middleware
│   │   ├── routes/
│   │   │   ├── artist.ts             Artist CRUD + search
│   │   │   ├── auth.ts               Spotify OAuth flow
│   │   │   └── user.ts               User top data
│   │   ├── services/
│   │   │   └── spotify.ts            Spotify API wrapper
│   │   └── jobs/
│   │       └── popularitySnapshot.ts node-cron daily job
│   ├── railway.json
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx              Home / trending
    │   │   ├── search/page.tsx       Artist search + track
    │   │   ├── artist/[id]/page.tsx  Artist detail + charts
    │   │   ├── compare/page.tsx      Side-by-side comparison
    │   │   ├── dashboard/page.tsx    User top tracks/artists
    │   │   └── auth/
    │   │       ├── callback/page.tsx  Saves JWT, redirects
    │   │       └── error/page.tsx
    │   ├── components/
    │   │   ├── Navbar.tsx
    │   │   ├── ArtistCard.tsx
    │   │   ├── PopularityChart.tsx   Recharts AreaChart
    │   │   ├── AudioFeaturesRadar.tsx Recharts RadarChart
    │   │   └── PopularityBar.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   └── lib/
    │       ├── api.ts                Typed fetch client
    │       └── auth.ts               Token helpers
    ├── vercel.json
    ├── next.config.ts
    ├── tailwind.config.ts
    └── package.json
```

---

## Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or Docker)
- Spotify Developer app ([create one](https://developer.spotify.com/dashboard))

### 1 — Spotify App Setup

In your Spotify Dashboard:
- Redirect URI: `http://localhost:4000/api/auth/callback`
- Note your **Client ID** and **Client Secret**

### 2 — Backend

```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL, SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, JWT_SECRET
npm install
npm run db:generate
npm run db:migrate:dev
npm run dev
# API running at http://localhost:4000
```

### 3 — Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:4000
npm install
npm run dev
# App running at http://localhost:3000
```

---

## Deployment

### Railway (backend + PostgreSQL)

1. Create a new Railway project
2. Add a **PostgreSQL** service — Railway injects `DATABASE_URL` automatically
3. Add a **Node** service pointing at `/backend`
4. Set environment variables:
   ```
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   SPOTIFY_REDIRECT_URI=https://<your-railway-domain>/api/auth/callback
   JWT_SECRET=<random 64-char string>
   FRONTEND_URL=https://<your-vercel-domain>
   NODE_ENV=production
   ```
5. `railway.json` configures the build + start command (`prisma migrate deploy && node dist/index.js`)

### Vercel (frontend)

1. Import the `/frontend` directory into Vercel
2. Set environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://<your-railway-domain>
   ```
3. Update your Spotify app's Redirect URI to the Railway URL
4. `vercel.json` sets security headers and maps the env var from a Vercel secret

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | API port (default 4000) |
| `SPOTIFY_CLIENT_ID` | Spotify app client ID |
| `SPOTIFY_CLIENT_SECRET` | Spotify app client secret |
| `SPOTIFY_REDIRECT_URI` | OAuth callback URL |
| `JWT_SECRET` | Secret for signing JWTs |
| `FRONTEND_URL` | Frontend origin (CORS + redirect) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

---

## Key Design Decisions

**Audio features are artist-level averages** — Spotify's audio features API works at the track level. SpotTrends fetches an artist's top 5 tracks and averages the values to produce an artist-level audio fingerprint stored once in `audio_features`.

**Daily cron job loops with rate limiting** — The `popularitySnapshot` job sleeps 100 ms between Spotify API calls to stay within Spotify's rate limits, even with hundreds of tracked artists.

**JWT in localStorage, not cookies** — Keeps the frontend a pure SPA without needing `sameSite` cookie coordination across Railway and Vercel domains. For higher security needs, move to `HttpOnly` cookies served from the same domain.

**Prisma `upsert` everywhere** — Artist records can be re-tracked without duplicates; user records are refreshed on every login.
