import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Last.fm CDN
      { protocol: "https", hostname: "lastfm.freetls.fastly.net" },
      // Older Last.fm image hosts
      { protocol: "https", hostname: "userserve-ak.last.fm" },
      { protocol: "http",  hostname: "userserve-ak.last.fm" },
    ],
  },
};

export default nextConfig;
