import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  allowedDevOrigins: ["169.254.83.107", "192.168.29.70"],
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
