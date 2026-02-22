/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@logicforge/ui"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "mongoose", "mongodb"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("mongoose", "mongodb");
    }
    return config;
  },
};

export default nextConfig;
