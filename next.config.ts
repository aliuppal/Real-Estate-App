import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // C:\Claude_Demo has its own lockfile; pin the root so tracing doesn't climb to it.
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
