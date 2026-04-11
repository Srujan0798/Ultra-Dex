/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['jspdf'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;

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
