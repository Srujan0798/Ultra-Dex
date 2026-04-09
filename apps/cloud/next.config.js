// Copyright (c) 2026 Ultra-Dex
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 15 specific optimizations
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'cloud.ultra-dex.ai'],
    },
  },
  // Ensure monorepo workspaces work correctly
  serverExternalPackages: ['@ultra-dex/core', 'sqlite3', 'sqlite'],
  transpilePackages: ['@ultra-dex/agent-protocol'],
};

export default nextConfig;
