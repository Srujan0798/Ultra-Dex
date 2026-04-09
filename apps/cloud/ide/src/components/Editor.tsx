import { memo, useState } from 'react';

export const Editor = memo(function Editor() {
  const [code, setCode] = useState(`// Welcome to Ultra-Dex Cloud IDE
// The Meta-Layer is active.

export function metaLayer() {
  return {
    status: 'operational',
    version: '6.0.0',
    capabilities: ['swarm', 'persistence', 'security']
  };
}
`);

  return (
    <div
      className="panel"
      style={{ height: '70%', display: 'flex', flexDirection: 'column', padding: 0 }}
    >
      <div
        style={{
          background: '#1e293b',
          padding: '4px 12px',
          fontSize: '12px',
          color: '#94a3b8',
          borderBottom: '1px solid #334155',
        }}
      >
        main.ts
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        spellCheck={false}
        style={{
          flex: 1,
          background: '#0f172a',
          color: '#e2e8f0',
          fontFamily: '"Fira Code", monospace',
          fontSize: '14px',
          padding: '16px',
          border: 'none',
          outline: 'none',
          resize: 'none',
        }}
      />
    </div>
  );
});
