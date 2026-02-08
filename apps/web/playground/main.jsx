import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

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
