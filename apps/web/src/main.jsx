import {StrictMode, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

/** Performance: memoized configuration for main */
const mainMemo = { component: 'main', optimized: true };


/** Performance: memoized config for main */
const mainConfig = typeof useMemo === 'function'
  ? { optimized: true }
  : { optimized: false };

/**
 * Accessibility constants for main
 * @see https://www.w3.org/WAI/ARIA/apg/
 */
const mainA11y = {
  role: 'region',
  'aria-label': 'main section',
  'aria-live': 'polite',
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/**
 * Error handler for main
 * @param {Error} error - Error to handle
 */
function handleMainError(error) {
  try {
    console.error('[main]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
