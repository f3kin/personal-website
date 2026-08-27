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
      { protocol: 'https', hostname: 'substackcdn.com' },
      { protocol: 'https', hostname: 'substack-post-media.s3.amazonaws.com' },
    ],
  },
  async rewrites() {
    // Short links for the newsletter, one per placement. These are REWRITES,
    // not redirects: a redirect makes LinkedIn resolve the target and print the
    // full tracking URL on its share card, which reads like spam. A rewrite
    // keeps finlayekins.com/li visible while the page still receives the
    // attribution it needs.
    const subscribeLink = (path, source, medium, campaign) => ({
      source: path,
      destination: `/newsletter?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`,
    });

    return [
      {
        source: '/resume',
        destination: '/_resume.pdf',
      },
      subscribeLink('/x', 'x', 'bio', 'x-bio'),
      subscribeLink('/li', 'linkedin', 'profile', 'li-profile'),
    ];
  },
  async redirects() {
    return [
      // The old beehiiv-hosted subdomain. Its DNS record was removed at some
      // point, so every link pointing there is currently dead. Once the domain
      // is attached to this Vercel project these rules resurrect them.
      {
        source: '/',
        has: [{ type: 'host', value: 'newsletter.finlayekins.com' }],
        destination: 'https://finlayekins.com/newsletter',
        permanent: true,
      },
      {
        source: '/subscribe',
        has: [{ type: 'host', value: 'newsletter.finlayekins.com' }],
        destination: 'https://finlayekins.com/newsletter',
        permanent: true,
      },
      {
        source: '/p/:slug',
        has: [{ type: 'host', value: 'newsletter.finlayekins.com' }],
        destination: 'https://finlayekins.com/writing/:slug',
        permanent: true,
      },
    ];
  },
}

export default nextConfig