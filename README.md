# Genre Explorer

A frontend-only music discovery app that lets you search artists, explore
their genres, read their biography, and travel through networks of similar
musicians — all powered by the **Last.fm API** with no backend, no database,
and no auth.

Live demo: deployed on Vercel · Data: Last.fm

---

## Architecture

```
Browser
  │
  │  Next.js 14 (App Router)   ← deployed on Vercel
  │
  ├─ /                          Home page — debounced artist search
  │     └─ artist.search API
  │
  └─ /artist/[name]             Artist detail page (Server Component)
        ├─ artist.getInfo API   → name, bio, listener count, scrobbles, tags
        └─ artist.getSimilar    → up to 12 similar artists (click-through)

  All calls go directly to:
  https://ws.audioscrobbler.com/2.0/?api_key=...&format=json
```

**No backend. No database. No auth.**  
The Last.fm API is public and key-only — the key is embedded as a
`NEXT_PUBLIC_` env var and called directly from the browser on the search
page, and from the server during SSR on artist pages (with 1-hour cache
via `next: { revalidate: 3600 }`).

---

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx                Root layout + Navbar
│   │   ├── page.tsx                  Home: debounced search + suggestion chips
│   │   ├── globals.css
│   │   └── artist/
│   │       └── [name]/
│   │           └── page.tsx          Artist detail — Server Component
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── ArtistCard.tsx            Search result card
│   │   ├── SimilarArtistCard.tsx     Smaller card with match %
│   │   └── ArtistAvatar.tsx          Photo or coloured initials fallback
│   └── lib/
│       ├── lastfm.ts                 Last.fm API client + types
│       └── utils.ts                  formatNumber, artistHref, accentColor
├── tailwind.config.ts                Last.fm dark theme tokens
├── next.config.ts                    Image domains for lastfm CDN
└── package.json
```

---

## Local Development

```bash
cd frontend
cp .env.example .env.local          # API key already set
npm install
npm run dev
# → http://localhost:3000
```

No database setup. No OAuth. Just run it.

---

## Deployment (Vercel)

1. Import `/frontend` from GitHub into Vercel
2. Root directory: **`frontend`**
3. Add environment variable:
   ```
   NEXT_PUBLIC_LASTFM_API_KEY = 9f3da47b9e70ea2bd326c7bb603b0892
   ```
4. Deploy — done.

Every `git push` auto-redeploys.

---

## Last.fm Endpoints Used

| Endpoint | Used for |
|---|---|
| `artist.search` | Debounced search on the home page |
| `artist.getInfo` | Bio, tags, listener/scrobble stats on the artist page |
| `artist.getSimilar` | Similar artists grid (up to 12), each clickable |

---

## Design Notes

- **Server Components for artist pages** — the `[name]` page is async and fetches
  Last.fm data on the server with a 1-hour revalidation window. Fast initial
  paint, good SEO, no loading spinner for the hero content.
- **Client Component for search** — the home page is `"use client"` to support
  debounced input with local state. Search results call Last.fm directly from
  the browser.
- **Deterministic avatar colours** — if Last.fm returns no image for an artist,
  a coloured placeholder is shown using the artist name as a hash seed, so the
  colour is consistent across page loads.
- **`artist.name` as route param** — Last.fm is name-based (not ID-based), so
  artist pages are `/artist/Radiohead`, `/artist/The%20Beatles`, etc.
