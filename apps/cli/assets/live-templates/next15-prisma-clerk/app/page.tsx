/**
 * @fileoverview Page module
 * @module app/page
 */

export default function HomePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Ultra-Dex Live Scaffold</h1>
      <p>Next.js 15 + Prisma + Clerk starter.</p>
    </main>
  );
}

/**
 * Error handler for page
 * @param {Error} error - Error to handle
 */
function handlePageError(error) {
  try {
    console.error('[page]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
