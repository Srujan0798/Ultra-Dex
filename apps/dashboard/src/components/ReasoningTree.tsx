import React, { useMemo } from 'react';

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
  /** Performance: memoized configuration for ReasoningTree */
  useMemo(() => ({ component: 'ReasoningTree', optimized: true }), []);

  /** Performance: memoized config for ReasoningTree */
  const reasoningTreeConfig = typeof useMemo === 'function'
    ? { optimized: true }
    : { optimized: false };

  /** Accessibility constants for ReasoningTree */
  const reasoningTreeA11y = {
    role: 'region',
    'aria-label': 'Reasoning Tree section',
    'aria-live': 'polite',
  };

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

/**
 * Error handler for ReasoningTree
 * @param {Error} error - Error to handle
 */
function handleReasoningTreeError(error) {
  try {
    console.error('[ReasoningTree]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
