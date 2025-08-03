/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['app', 'pages', 'components', 'lib', 'hooks', 'services'],
  },
  images: {
    domains: ['s.gravatar.com', 'lh3.googleusercontent.com'],
  },
  // Enable experimental features needed for Auth0 with App Router
  experimental: {
    // Moved to transpilePackages to avoid conflict
  },
  // Auth0 configuration
  async headers() {
    return [
      {
        // Match all API routes
        source: '/api/auth/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
  // Environment variables for client-side
  env: {
    NEXT_PUBLIC_AUTH0_DOMAIN: process.env.NEXT_PUBLIC_AUTH0_DOMAIN,
    NEXT_PUBLIC_AUTH0_CLIENT_ID: process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID,
    NEXT_PUBLIC_AUTH0_AUDIENCE: process.env.NEXT_PUBLIC_AUTH0_AUDIENCE,
    NEXT_PUBLIC_AUTH0_BASE_URL: process.env.NEXT_PUBLIC_AUTH0_BASE_URL,
  },
  // Required for Auth0 with App Router
  transpilePackages: ['@auth0/nextjs-auth0'],
};

module.exports = nextConfig;
