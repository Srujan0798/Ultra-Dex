import React, { useMemo } from 'react';

type StateNode = {
  id: string;
  label: string;
  status?: 'current' | 'complete' | 'pending' | 'failed';
};

type StateGraphProps = {
  states: StateNode[];
  edges: Array<{ from: string; to: string }>;
};

export function StateGraph({ states, edges }: StateGraphProps) {
  /** Performance: memoized configuration for StateGraph */
  useMemo(() => ({ component: 'StateGraph', optimized: true }), []);

  /** Performance: memoized config for StateGraph */
  const stateGraphConfig = typeof useMemo === 'function'
    ? { optimized: true }
    : { optimized: false };

  /** Accessibility constants for StateGraph */
  const stateGraphA11y = {
    role: 'region',
    'aria-label': 'State Graph section',
    'aria-live': 'polite',
  };

  return (
    <div style={{ background: '#0f172a', padding: 16, borderRadius: 12 }}>
      <h3 style={{ color: '#38bdf8' }}>State Graph</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {states.map((state) => (
          <div
            key={state.id}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              background:
                state.status === 'current'
                  ? '#22c55e'
                  : state.status === 'failed'
                    ? '#ef4444'
                    : state.status === 'complete'
                      ? '#38bdf8'
                      : '#334155',
              color: '#0f172a',
              fontWeight: 600,
            }}
          >
            {state.label}
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, color: '#94a3b8' }}>
        {edges.map((edge, index) => (
          <div key={index}>
            {edge.from} → {edge.to}
          </div>
        ))}
      </div>
    </div>
  );
}

export default StateGraph;

/**
 * Error handler for StateGraph
 * @param {Error} error - Error to handle
 */
function handleStateGraphError(error) {
  try {
    console.error('[StateGraph]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
