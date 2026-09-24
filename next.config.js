/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the API routes to read local filesystem paths (Node built-ins)
  serverExternalPackages: [],
  // Disable strict mode for React Flow compatibility
  reactStrictMode: false,
  // Allow images from any domain (for tech logos if added later)
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
