

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
    ],
  },
  async redirects() {
    return [
      // Removed sections (Oct 2026): blogs had no posts, resources was a
      // generic link farm. Keep the URLs alive for SEO/bookmarks.
      { source: '/blogs', destination: '/projects', permanent: true },
      { source: '/resources', destination: '/ai', permanent: true },
      { source: '/admin/resources', destination: '/admin', permanent: true },
      { source: '/admin/categories', destination: '/admin', permanent: true },
    ];
  },
}

module.exports = nextConfig
