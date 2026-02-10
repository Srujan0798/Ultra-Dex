/**
 * @fileoverview  Index module
 * @module routes/_index
 */

export default function Index() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Ultra-Dex Live Scaffold</h1>
      <p>Remix + Supabase starter.</p>
    </main>
  );
}

/**
 * Error handler for _index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[_index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
