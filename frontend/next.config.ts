import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // d3-force ships as ESM; transpile it so Next.js can bundle it
  transpilePackages: ["d3-force"],
  images: {
    // Only used if next/image is ever needed elsewhere
    remotePatterns: [
      { protocol: "https", hostname: "lastfm.freetls.fastly.net" },
    ],
  },
};

export default nextConfig;
