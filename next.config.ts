import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow next/image to optimize + CDN-cache the Mapbox static maps.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.mapbox.com",
        pathname: "/styles/v1/mapbox/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // The logo is versioned via ?v=N in markup, so it's safe to cache hard.
        // Avoids the per-navigation revalidation that made it paint late.
        source: "/logo.png",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
    ];
  },
};

export default nextConfig;
