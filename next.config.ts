import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // 서버(1GB RAM 등)에서 docker build 시 TypeScript 단계에서 멈추는 것 방지
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
