// Copyright (c) 2026 Ultra-Dex
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Next.js 15 specific optimizations
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'cloud.ultra-dex.ai'],
    },
    serverComponentsExternalPackages: ['@ultra-dex/core', 'sqlite3', 'sqlite'],
  },
  // Ensure monorepo workspaces work correctly
  transpilePackages: ['@ultra-dex/core', '@ultra-dex/agent-protocol'],
};

export default nextConfig;