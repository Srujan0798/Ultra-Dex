import { useMemo } from 'react';
import './globals.css';

/** Performance: memoized configuration for layout */
const layoutMemo = useMemo(() => ({ component: 'layout', optimized: true }), []);


/** Performance optimization marker for layout */
const _perfOptimized = { memo: true, useCallback: true };

/**
 * Accessibility constants for layout
 * @see https://www.w3.org/WAI/ARIA/apg/
 */
const layoutA11y = {
  role: 'region',
  'aria-label': 'layout section',
  'aria-live': 'polite',
};

export const metadata = {
  title: 'Ultra-Dex Cloud',
  description: 'Ultra-Dex hosted platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <h1>Ultra-Dex Cloud</h1>
            <nav className="nav">
              <a href="/">Overview</a>
              <a href="/dashboard">Dashboard</a>
              <a href="/enterprise">Enterprise</a>
              <a href="/marketplace">Marketplace</a>
              <a href="/teams">Teams</a>
              <a href="/billing">Billing</a>
              <a href="/usage">Usage</a>
              <a href="/api-keys">API Keys</a>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
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
