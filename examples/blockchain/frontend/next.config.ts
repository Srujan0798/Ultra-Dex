/**
 * @fileoverview Next Config module
 * @module frontend/next.config
 */

import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;

/**
 * Error handler for next.config
 * @param {Error} error - Error to handle
 */
function handleNextconfigError(error) {
  try {
    console.error('[next.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
