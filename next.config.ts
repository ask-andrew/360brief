import type { NextConfig } from 'next';

// Minimal Next.js configuration for testing
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: []
    },
  },
  // Disable TypeScript type checking during development
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during development
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
