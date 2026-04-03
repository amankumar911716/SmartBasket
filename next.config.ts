import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  allowedDevOrigins: [
    "10.111.63.139",
    "localhost",
  ],
};

export default nextConfig;