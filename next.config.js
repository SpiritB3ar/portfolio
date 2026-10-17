

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Prisma 8 Mongo runtime + driver resolve natively in Node (same as tsx);
  // bundling them under Turbopack breaks their connection-string parsing.
  serverExternalPackages: ["@prisma/orm-mongo", "mongodb"],
  images: {
    // Next 16 whitelists quality values; the hero portrait uses 90 for
    // crisper rendering of the profile photo.
    qualities: [75, 90],
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

// Cloudflare dev integration: exposes getCloudflareContext() in `next dev`
// (env bindings come from .dev.vars). No-op for `next build`/Vercel.
try {
  require("@opennextjs/cloudflare/next").initOpenNextCloudflareForDev();
} catch {
  // @opennextjs/cloudflare not installed (e.g. main branch) — ignore.
}
