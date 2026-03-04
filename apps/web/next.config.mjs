/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,

  // ✅ Tell Next.js to transpile all internal workspace packages
  transpilePackages: [
    "@logicforge/db",
    "@logicforge/auth",
    "@logicforge/config",
    "@logicforge/logger",
    "@logicforge/types",
    "@logicforge/ui",
  ],

  // ✅ Only externalize native/binary packages
  serverExternalPackages: ["mongoose", "mongodb", "@prisma/client"],

  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push("mongoose", "mongodb");
    }
    return config;
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
