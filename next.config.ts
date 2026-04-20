import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://192.168.0.13:3001", "192.168.0.13"],
  serverExternalPackages: ["@prisma/client", "better-sqlite3"],
};

export default nextConfig;
