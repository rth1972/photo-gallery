/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Let Next.js optimise local uploads (WebP, resizing, caching)
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 640, 960, 1280, 1920],
    imageSizes: [64, 128, 256, 384],
  },
  // Compress API responses
  compress: true,
  // Cache static assets aggressively
  headers: async () => [
    {
      source: '/uploads/:path*',
      headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
    },
  ],
};

module.exports = nextConfig;