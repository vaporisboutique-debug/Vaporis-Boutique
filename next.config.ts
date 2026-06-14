import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ncuqghqfmjoorpkvuirh.supabase.co"
      },
      {
        protocol: "https",
        hostname: "ncugqhqfmjoorpkyuirh.supabase.co"
      },
      {
        protocol: "https",
        hostname: "**.supabase.co"
      }
    ]
  },
  turbopack: {
    root: "/Users/aljulandaaljaradi/Documents/Codex/2026-06-13/build-a-luxury-perfume-online-store"
  }
};

export default nextConfig;
