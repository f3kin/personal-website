/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: false,
    remotePatterns: [
      { protocol: 'https', hostname: 'miro.medium.com' },
      { protocol: 'https', hostname: 'cdn-images-1.medium.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'media.beehiiv.com' },
      { protocol: 'https', hostname: 'beehiiv-images-production.s3.amazonaws.com' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/resume',
        destination: '/_resume.pdf',
      },
    ];
  },
}

export default nextConfig