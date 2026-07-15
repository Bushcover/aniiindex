/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // YouTube thumbnails (from the oEmbed integration — see Session 12
        // follow-up notes in PROJECT.md). Covers all YouTube thumbnail
        // formats/sizes, since they're all served from this one host.
        protocol: "https",
        hostname: "i.ytimg.com",
        pathname: "/**",
      },
      {
        // AniList character/series images (see lib/anilist.js, Sessions
        // 6-8).
        protocol: "https",
        hostname: "s4.anilist.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
