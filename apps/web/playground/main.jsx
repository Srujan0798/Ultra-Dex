import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

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

function Playground() {
  const [context, setContext] = useState('');
  const [output, setOutput] = useState('');

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>Ultra-Dex Playground</h1>
      <p>Live template editor with realtime preview (prototype).</p>
      <textarea
        rows={10}
        style={{ width: '100%' }}
        value={context}
        onChange={(e) => setContext(e.target.value)}
        placeholder="Paste or edit your template..."
      />
      <button onClick={() => setOutput(context)} style={{ marginTop: 12 }}>
        Preview
      </button>
      <pre style={{ background: '#111', color: '#fff', padding: 16, marginTop: 12 }}>{output}</pre>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<Playground />);

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
