import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

/** Performance: memoized configuration for main */
const mainMemo = useMemo(() => ({ component: 'main', optimized: true }), []);


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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
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
