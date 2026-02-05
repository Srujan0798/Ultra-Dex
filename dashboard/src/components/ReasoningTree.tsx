import React from 'react';

type ReasoningNode = {
  id: string;
  text: string;
  type?: 'fact' | 'inference' | 'assumption';
  confidence?: number;
};

type ReasoningTreeProps = {
  nodes: ReasoningNode[];
};

export function ReasoningTree({ nodes }: ReasoningTreeProps) {
  return (
    <div style={{ background: '#0f172a', padding: 16, borderRadius: 12 }}>
      <h3 style={{ color: '#38bdf8' }}>Reasoning Tree</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {nodes.map((node) => (
          <li key={node.id} style={{ marginBottom: 8 }}>
            <strong style={{ color: '#22c55e' }}>{node.type || 'fact'}</strong>{' '}
            <span style={{ color: '#e2e8f0' }}>{node.text}</span>
            {node.confidence !== undefined && (
              <span style={{ color: '#94a3b8' }}> ({Math.round(node.confidence * 100)}%)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ReasoningTree;
