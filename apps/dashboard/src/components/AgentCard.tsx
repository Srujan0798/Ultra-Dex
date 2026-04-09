import { memo } from 'react';
import { Play, Square, FileText } from 'lucide-react';
import type { AgentSnapshot } from '../lib/websocket';

export interface AgentCardProps {
  agent: AgentSnapshot;
  onAction?: (agentId: string, action: 'start' | 'stop' | 'logs') => void;
}

const stateStyles: Record<AgentSnapshot['state'], string> = {
  running: 'bg-emerald-400 shadow-emerald-500/40',
  idle: 'bg-slate-400 shadow-slate-500/30',
  error: 'bg-rose-400 shadow-rose-500/40',
  offline: 'bg-amber-400 shadow-amber-500/40',
};

function formatRelativeTime(value: string): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return 'unknown';
  }

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - parsed) / 1_000));
  if (deltaSeconds < 60) {
    return `${deltaSeconds}s ago`;
  }
  if (deltaSeconds < 3_600) {
    return `${Math.floor(deltaSeconds / 60)}m ago`;
  }
  if (deltaSeconds < 86_400) {
    return `${Math.floor(deltaSeconds / 3_600)}h ago`;
  }
  return `${Math.floor(deltaSeconds / 86_400)}d ago`;
}

function SafeRate({ successCount, failureCount }: { successCount: number; failureCount: number }) {
  const total = successCount + failureCount;
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Success rate</span>
        <span className="font-semibold text-slate-200">{successRate}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all duration-200"
          style={{ width: `${successRate}%` }}
        />
      </div>
    </div>
  );
}

function RunChart({ series }: { series: number[] }) {
  const max = Math.max(...series, 1);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>Recent runs</span>
        <span>{series.length} samples</span>
      </div>
      <div className="flex h-10 items-end gap-1">
        {series.map((value, index) => (
          <div
            key={`${index}:${value}`}
            className="flex-1 rounded-sm bg-blue-500/70"
            style={{ height: `${Math.max(10, (value / max) * 100)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

export const AgentCard = memo(function AgentCard({ agent, onAction }: AgentCardProps) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/40">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{agent.name}</h3>
          <p className="mt-1 text-xs text-slate-400">{agent.id}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span
            className={`h-2.5 w-2.5 rounded-full shadow-lg ${stateStyles[agent.state]} animate-pulse`}
          />
          <span className="capitalize">{agent.state}</span>
        </div>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
          <div className="text-slate-500">Last execution</div>
          <div className="mt-1 font-semibold text-slate-200">
            {formatRelativeTime(agent.lastExecution)}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
          <div className="text-slate-500">Avg duration</div>
          <div className="mt-1 font-semibold text-slate-200">{agent.avgDurationMs || 0}ms</div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <SafeRate successCount={agent.successCount} failureCount={agent.failureCount} />
        <RunChart series={agent.recentRuns} />
      </div>

      <footer className="mt-4 flex items-center justify-between">
        <div className="text-xs text-slate-400">Cost today: ${agent.costToday.toFixed(2)}</div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/20"
            onClick={() => onAction?.(agent.id, 'start')}
            type="button"
          >
            <Play className="h-3 w-3" /> Start
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-md border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/20"
            onClick={() => onAction?.(agent.id, 'stop')}
            type="button"
          >
            <Square className="h-3 w-3" /> Stop
          </button>
          <button
            className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/80 px-2 py-1 text-xs text-slate-200 hover:border-blue-500/30"
            onClick={() => onAction?.(agent.id, 'logs')}
            type="button"
          >
            <FileText className="h-3 w-3" /> Logs
          </button>
        </div>
      </footer>
    </article>
  );
});
