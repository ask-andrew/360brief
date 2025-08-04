/** @type {import('next').NextConfig} */
const webpack = require('webpack');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    // Expose these environment variables to the browser
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  webpack: (config, { isServer }) => {
    // Add environment variables to the client bundle
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env': {
          NEXT_PUBLIC_SUPABASE_URL: JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL),
          NEXT_PUBLIC_SUPABASE_ANON_KEY: JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        },
      })
    );

    // Handle Node.js modules that shouldn't be bundled
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  // This makes environment variables available at runtime
  publicRuntimeConfig: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

module.exports = nextConfig;
