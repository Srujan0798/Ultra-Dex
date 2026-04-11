/**
 * @fileoverview Layout module
 * @module app/layout
 */

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

/**
 * Error handler for layout
 * @param {Error} error - Error to handle
 */
function handleLayoutError(error) {
  try {
    console.error('[layout]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
