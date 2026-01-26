/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  transpilePackages: ['@chti/db', '@chti/shared'],
  swcMinify: false,
};

export default nextConfig;

