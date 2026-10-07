import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "tesseract.js"],
  allowedDevOrigins: [
    "snowboard-dash-avoiding-headlines.trycloudflare.com",
    "*.trycloudflare.com",
    "127.0.0.1",
    "localhost",
  ],
};

export default nextConfig;
