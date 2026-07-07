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
  // CSP headers and cache headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://artalk.robintehofstee.com https://cdn.jsdelivr.net http://192.168.1.19:3456",
              "style-src 'self' 'unsafe-inline' https://artalk.robintehofstee.com https://cdn.jsdelivr.net",
              "img-src 'self' data: blob: https://artalk.robintehofstee.com https://cdn.jsdelivr.net",
              "font-src 'self' https://artalk.robintehofstee.com https://cdn.jsdelivr.net",
              "connect-src 'self' https://artalk.robintehofstee.com https://cdn.jsdelivr.net",
              "frame-src 'self' https://artalk.robintehofstee.com",
            ].join('; '),
          },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};

module.exports = nextConfig;