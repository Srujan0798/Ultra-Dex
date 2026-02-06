import React from 'react';

type CanvasUser = {
  id: string;
  name: string;
  color: string;
};

type CanvasProps = {
  users?: CanvasUser[];
  status?: string;
  summary?: string;
};

export function Canvas({
  users = [],
  status = 'Idle',
  summary = 'No active collaboration.',
}: CanvasProps) {
  return (
    <div style={{ background: '#0f172a', padding: 16, borderRadius: 12 }}>
      <h3 style={{ color: '#38bdf8' }}>Collaborative Canvas</h3>
      <p style={{ color: '#e2e8f0', marginBottom: 12 }}>{summary}</p>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{ color: '#94a3b8' }}>Status:</span>
        <span style={{ color: '#22c55e', fontWeight: 600 }}>{status}</span>
      </div>
      <div style={{ marginTop: 12 }}>
        <div style={{ color: '#94a3b8', marginBottom: 6 }}>Active collaborators</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {users.length === 0 && <span style={{ color: '#64748b' }}>None</span>}
          {users.map((user) => (
            <span
              key={user.id}
              style={{
                background: user.color,
                color: '#0f172a',
                padding: '4px 8px',
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              {user.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Canvas;
