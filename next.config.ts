import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  // Enable React Strict Mode for better development practices
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable server components and app directory
  experimental: {
    serverActions: {
      bodySizeLimit: 2 * 1024 * 1024, // 2MB
      allowedOrigins: []
    },
    // Ensure proper layout handling
    externalDir: true,
    // Enable app directory with proper typing
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  
  // Configure webpack
  webpack: (config, { isServer }) => {
    // Handle path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };

    // Client-side optimizations
    if (!isServer) {
      // Don't include certain packages in the client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
      };
    }
    
    return config;
  },
  
  // Configure images domains
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google OAuth avatars
      'avatars.githubusercontent.com', // GitHub OAuth avatars
      's.gravatar.com', // Gravatar avatars
    ],
  },
  
  // Environment variables that should be available to the client
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // Configure headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
  
  // Add output configuration for Netlify
  output: 'standalone',
  
  // Disable TypeScript type checking during build (handled by CI)
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Disable ESLint during build (handled by CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
