import type { NextConfig } from "next";

const isExport = process.env.CAPACITOR_BUILD === 'true';

const nextConfig: NextConfig = {
  output: isExport ? 'export' : undefined,
  trailingSlash: isExport ? true : undefined,
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
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
