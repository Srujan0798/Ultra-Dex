/**
 * @fileoverview Root module
 * @module app/root
 */

import type { MetaFunction } from '@remix-run/node';
import { Links, Meta, Outlet, Scripts } from '@remix-run/react';

export const meta: MetaFunction = () => [{ title: 'Ultra-Dex Remix Scaffold' }];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  );
}

/**
 * Error handler for root
 * @param {Error} error - Error to handle
 */
function handleRootError(error) {
  try {
    console.error('[root]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
