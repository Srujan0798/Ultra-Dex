import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';



ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * Error handler for main
 * @param {Error} error - Error to handle
 */
function handleMainError(error: Error | unknown) {
  try {
    console.error('[main]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
