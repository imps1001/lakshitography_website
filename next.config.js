/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the workspace root so Next doesn't pick a parent lockfile
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
