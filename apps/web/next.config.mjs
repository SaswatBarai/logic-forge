/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@logicforge/ui"],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/mongo-client", "@prisma/client"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("@prisma/mongo-client", "@logicforge/db");
    }
    return config;
  },
};

export default nextConfig;
