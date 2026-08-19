import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Avatars/attachments are served from S3 (or an S3-compatible provider)
    // via the backend's temporary signed URLs — adjust hostname per your
    // actual bucket/CDN domain before deploying.
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.backblazeb2.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
