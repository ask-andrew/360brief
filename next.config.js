/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['pages', 'components', 'lib', 'hooks', 'services'],
  },
  images: {
    domains: ['s.gravatar.com'],
  },
  // Handle Netlify Functions migration to API routes
  async rewrites() {
    return [
      {
        source: '/.netlify/functions/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
