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
    return [
      {
        source: '/resume',
        destination: '/_resume.pdf',
      },
    ];
  },
  async redirects() {
    // Short links for the newsletter, one per placement, each carrying its own
    // UTMs. beehiiv does not infer attribution for API signups, so the tags have
    // to travel with the link or the acquisition report cannot tell the channels
    // apart. Lowercase throughout: beehiiv treats UTM values as case-sensitive.
    const subscribeLink = (path, source, medium, campaign) => ({
      source: path,
      destination: `/newsletter?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`,
      permanent: false,
    });

    return [
      subscribeLink('/x', 'x', 'bio', 'x-bio'),
      subscribeLink('/x/pinned', 'x', 'pinned', 'x-pinned'),
      subscribeLink('/li', 'linkedin', 'featured', 'li-featured'),
      subscribeLink('/li/about', 'linkedin', 'about', 'li-about'),
      subscribeLink('/li/comment', 'linkedin', 'post-comment', 'li-comment'),
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