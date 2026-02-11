/**
 * @fileoverview Index module
 * @module routes/index
 */

import { Title } from '@solidjs/meta';

export default function Home() {
  return (
    <main>
      <Title>SolidStart + Drizzle</Title>
      <h1>SolidStart + Drizzle</h1>
    </main>
  );
}

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
