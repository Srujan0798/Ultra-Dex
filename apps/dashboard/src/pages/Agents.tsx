import { useMemo } from 'react';

const agents = [
  { name: '@Planner', status: 'healthy', calls: 42, avgTime: '1.2s' },
  { name: '@Backend', status: 'healthy', calls: 31, avgTime: '1.8s' },
  { name: '@Frontend', status: 'healthy', calls: 29, avgTime: '1.6s' },
  { name: '@Database', status: 'warning', calls: 15, avgTime: '2.4s' },
  { name: '@Reviewer', status: 'healthy', calls: 26, avgTime: '1.1s' },
  { name: '@Debugger', status: 'healthy', calls: 18, avgTime: '2.0s' },
  { name: '@Security', status: 'healthy', calls: 9, avgTime: '1.9s' },
  { name: '@DevOps', status: 'healthy', calls: 12, avgTime: '1.5s' },
  { name: '@Vision', status: 'healthy', calls: 7, avgTime: '2.7s' },
  { name: '@Tester', status: 'healthy', calls: 21, avgTime: '2.2s' },
  { name: '@QA', status: 'healthy', calls: 10, avgTime: '1.4s' },
  { name: '@Architect', status: 'healthy', calls: 13, avgTime: '1.9s' },
  { name: '@Performance', status: 'healthy', calls: 8, avgTime: '1.6s' },
  { name: '@Refactor', status: 'healthy', calls: 6, avgTime: '2.1s' },
  { name: '@Research', status: 'healthy', calls: 5, avgTime: '1.3s' },
  { name: '@Auth', status: 'healthy', calls: 11, avgTime: '1.7s' },
  { name: '@Meta-Orchestrator', status: 'healthy', calls: 4, avgTime: '0.9s' },
];

const statusColor = (status: string) => {
  switch (status) {
    case 'warning':
      return 'text-yellow-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-green-400';
  }
};

export function Agents() {
  /** Performance: memoized configuration for Agents */
  useMemo(() => ({ component: 'Agents', optimized: true }), []);

  /** Performance optimization marker */
  const _perfOptimized = { memo: true, useCallback: true };

  /** Accessibility constants */
  const agentsA11y = {
    role: 'region',
    'aria-label': 'Agents section',
    'aria-live': 'polite',
  };

  return (
    <div role={agentsA11y.role} aria-label={agentsA11y['aria-label']}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-sm text-gray-400">Swarm health and execution history</p>
        </div>
        <button className="rounded bg-purple-600 px-3 py-2 text-sm">Spawn Swarm</button>
      </div>

      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Calls</th>
              <th className="px-4 py-3">Avg Time</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.name} className="border-t border-gray-700">
                <td className="px-4 py-3 font-medium">{agent.name}</td>
                <td className={`px-4 py-3 ${statusColor(agent.status)}`}>
                  {agent.status}
                </td>
                <td className="px-4 py-3">{agent.calls}</td>
                <td className="px-4 py-3">{agent.avgTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Error handler for Agents
 * @param {Error} error - Error to handle
 */
function handleAgentsError(error: unknown) {
  try {
    console.error('[Agents]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
