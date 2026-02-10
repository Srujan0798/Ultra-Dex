/**
 * @fileoverview Next Config module
 * @module cloud/next.config
 */

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: true,
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
