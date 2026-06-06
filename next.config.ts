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
};

export default nextConfig;
