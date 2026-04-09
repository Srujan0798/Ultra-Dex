import { memo, useState } from 'react';

const INITIAL_AGENTS = [
  { id: 1, name: 'Orchestrator', status: 'idle', task: 'Ready' },
  { id: 2, name: 'Coder-V6', status: 'busy', task: 'Refactoring Meta-Layer' },
  { id: 3, name: 'Reviewer', status: 'busy', task: 'Analyzing Security' },
];

export const AgentPanel = memo(function AgentPanel() {
  const [agents] = useState(INITIAL_AGENTS);

  return (
    <div className="panel" style={{ height: '100%', overflowY: 'auto' }}>
      <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '8px' }}>Active Agents</h3>
      <div className="agent-list" style={{ marginTop: '16px' }}>
        {agents.map((agent) => (
          <div
            key={agent.id}
            style={{
              marginBottom: '12px',
              padding: '8px',
              background: '#1e293b',
              borderRadius: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{agent.name}</strong>
              <span
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  color: agent.status === 'busy' ? '#fbbf24' : '#10b981',
                }}
              >
                {agent.status}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{agent.task}</div>
          </div>
        ))}
      </div>
    </div>
  );
});
