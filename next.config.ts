import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'plus.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'rahzhfgbmromdhfhunff.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'vkyhvfclwjidvutwryay.supabase.co',
      }
    ],
  },
};

export default nextConfig;
