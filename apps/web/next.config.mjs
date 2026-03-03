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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },   // Google
      { protocol: "https", hostname: "avatars.githubusercontent.com" }, // GitHub
    ],
  },
};

export default nextConfig;
