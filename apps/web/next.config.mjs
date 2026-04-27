/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@modulajar/shared", "@modulajar/db"],
  // Enable typed links with next/link
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
