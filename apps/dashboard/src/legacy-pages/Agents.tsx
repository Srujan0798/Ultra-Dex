import { memo, useMemo, useState } from 'react';
import { Bot, AlertTriangle, Activity, Clock3 } from 'lucide-react';
import { AgentCard } from '../components/AgentCard';
import { LogViewer } from '../components/LogViewer';
import { MetricsPanel } from '../components/MetricsPanel';
import { CostDashboard } from '../components/CostDashboard';
import { useDashboardStream, type AgentSnapshot } from '../lib/websocket';

const FALLBACK_AGENTS: AgentSnapshot[] = [
  {
    id: 'planner',
    name: 'Planner Agent',
    state: 'running',
    lastExecution: new Date(Date.now() - 80_000).toISOString(),
    successCount: 96,
    failureCount: 4,
    avgDurationMs: 440,
    costToday: 8.12,
    recentRuns: [1, 1, 1, 1, 0, 1, 1],
  },
  {
    id: 'reviewer',
    name: 'Review Agent',
    state: 'idle',
    lastExecution: new Date(Date.now() - 260_000).toISOString(),
    successCount: 63,
    failureCount: 3,
    avgDurationMs: 590,
    costToday: 4.4,
    recentRuns: [1, 1, 1, 0, 1, 1, 0],
  },
  {
    id: 'security-audit',
    name: 'Security Agent',
    state: 'error',
    lastExecution: new Date(Date.now() - 780_000).toISOString(),
    successCount: 22,
    failureCount: 5,
    avgDurationMs: 730,
    costToday: 3.15,
    recentRuns: [1, 0, 0, 1, 0, 1, 0],
  },
];

export const Agents = memo(function Agents() {
  const socketUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ULTRA_DEX_WS) ||
    'ws://localhost:3002/ws';

  const [actionLog, setActionLog] = useState<string>('');

  const stream = useDashboardStream(socketUrl);
  const agents = stream.agents.length > 0 ? stream.agents : FALLBACK_AGENTS;

  const summary = useMemo(() => {
    const running = agents.filter((agent) => agent.state === 'running').length;
    const errored = agents.filter((agent) => agent.state === 'error').length;
    const avgDuration =
      agents.length > 0
        ? Math.round(agents.reduce((sum, agent) => sum + agent.avgDurationMs, 0) / agents.length)
        : 0;
    const totalRuns = agents.reduce(
      (sum, agent) => sum + agent.successCount + agent.failureCount,
      0
    );

    return { running, errored, avgDuration, totalRuns };
  }, [agents]);

  const handleAction = (agentId: string, action: 'start' | 'stop' | 'logs') => {
    setActionLog(
      `Action queued: ${action.toUpperCase()} for ${agentId} at ${new Date().toLocaleTimeString()}`
    );
  };

  return (
    <main className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.15em] text-slate-500">
              Connected Agents
            </span>
            <Bot className="h-4 w-4 text-blue-300" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-slate-100">{agents.length}</div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.15em] text-slate-500">Running</span>
            <Activity className="h-4 w-4 text-emerald-300" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-emerald-200">{summary.running}</div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.15em] text-slate-500">Errored</span>
            <AlertTriangle className="h-4 w-4 text-amber-300" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-amber-200">{summary.errored}</div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.15em] text-slate-500">Avg duration</span>
            <Clock3 className="h-4 w-4 text-slate-300" />
          </div>
          <div className="mt-3 text-2xl font-semibold text-slate-100">{summary.avgDuration}ms</div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} onAction={handleAction} />
        ))}
      </section>

      {actionLog && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
          {actionLog}
        </div>
      )}

      <MetricsPanel
        agents={agents}
        costSeries={stream.costSeries}
        metrics={{
          ...stream.metrics,
          activeAgents: stream.metrics.activeAgents || summary.running,
        }}
      />

      <CostDashboard agents={agents} costSeries={stream.costSeries} />
      <LogViewer logs={stream.logs} />
    </main>
  );
});
