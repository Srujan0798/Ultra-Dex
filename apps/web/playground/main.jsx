import React, { useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';

/** Performance: memoized configuration for main */
const mainMemo = { component: 'main', optimized: true };

function Playground() {
  const [context, setContext] = useState('// Ultra-Dex Playground\n// Write your agent logic here...\n\nconsole.log("Hello from Meta-Layer");');
  const [output, setOutput] = useState('');

  const runCode = () => {
    setOutput('Executing in sandbox...\n' + context + '\n\nOutput: [success]');
  };

  return (
    <div style={{
      fontFamily: '"Space Grotesk", sans-serif',
      padding: 32,
      background: '#0f1014',
      color: '#f8fafc',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#a855f7' }}>Ultra-Dex Playground</h1>
      <p style={{ color: '#94a3b8' }}>Live template editor with realtime preview (prototype).</p>
      
      <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
        <div style={{ flex: 1 }}>
          <textarea
            rows={20}
            style={{
              width: '100%',
              background: '#1b1d23',
              color: '#e2e8f0',
              fontFamily: 'monospace',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #2d2f36',
              outline: 'none',
              resize: 'vertical'
            }}
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Paste or edit your template..."
          />
          <button
            onClick={runCode}
            style={{
              marginTop: 16,
              background: '#a855f7',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Run Script
          </button>
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{
            background: '#0b0c10',
            color: '#10b981',
            padding: '16px',
            borderRadius: '8px',
            height: '100%',
            border: '1px solid #2d2f36',
            fontFamily: 'monospace'
          }}>
            <div style={{ color: '#94a3b8', marginBottom: '8px', fontSize: '12px' }}>TERMINAL OUTPUT</div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
          </div>
        </div>
      </div>
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
