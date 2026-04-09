import { memo, useMemo } from 'react';
import { Chart } from './Chart';
import type { AgentSnapshot, CostPoint, DashboardMetrics } from '../lib/websocket';

interface MetricsPanelProps {
  metrics: DashboardMetrics;
  agents: AgentSnapshot[];
  costSeries: CostPoint[];
}

function toChartSeries(costSeries: CostPoint[]) {
  const safeSeries =
    costSeries.length > 0
      ? costSeries
      : Array.from({ length: 8 }, (_, index) => ({
          timestamp: new Date(Date.now() - (7 - index) * 10 * 60 * 1_000).toISOString(),
          amount: Math.round(Math.random() * 3 + 1),
        }));

  return safeSeries.map((point, index) => ({
    label: new Date(point.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    amount: Number(point.amount.toFixed(2)),
    index,
  }));
}

function Gauge({
  value,
  max,
  label,
  tone,
}: {
  value: number;
  max: number;
  label: string;
  tone: 'blue' | 'emerald' | 'amber';
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / Math.max(1, max)) * 100)));
  const toneClass =
    tone === 'blue' ? 'bg-blue-400' : tone === 'emerald' ? 'bg-emerald-400' : 'bg-amber-400';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span>{percentage}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${toneClass}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="mt-2 text-xs text-slate-500">
        {value.toFixed(0)} / {max}
      </div>
    </div>
  );
}

export const MetricsPanel = memo(function MetricsPanel({
  metrics,
  agents,
  costSeries,
}: MetricsPanelProps) {
  const healthCounts = useMemo(() => {
    const running = agents.filter((agent) => agent.state === 'running').length;
    const errors = agents.filter((agent) => agent.state === 'error').length;
    return { running, errors };
  }, [agents]);

  const costChart = useMemo(() => toChartSeries(costSeries.slice(-24)), [costSeries]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <header className="mb-4">
        <h3 className="text-lg font-semibold text-slate-100">Performance Metrics</h3>
        <p className="text-xs text-slate-400">
          Latency, health, memory pressure, and provider activity.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-4">
        <Gauge label="API latency" max={1_000} tone="blue" value={metrics.latencyMs} />
        <Gauge label="Memory usage (MB)" max={2_048} tone="amber" value={metrics.memoryUsageMb} />
        <Gauge
          label="Active agents"
          max={Math.max(1, agents.length || metrics.activeAgents)}
          tone="emerald"
          value={metrics.activeAgents || agents.length}
        />
        <Gauge label="Active clients" max={2_000} tone="blue" value={metrics.activeClients} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 lg:col-span-2">
          <Chart
            data={costChart}
            height={220}
            series={[{ key: 'amount', color: '#3b82f6' }]}
            title="Cost trend"
            variant="line"
            xKey="label"
          />
        </div>

        <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Running agents</span>
            <span className="font-semibold text-emerald-300">{healthCounts.running}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Errored agents</span>
            <span className="font-semibold text-rose-300">{healthCounts.errors}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Provider health</span>
            <span className="font-semibold text-blue-300">
              {metrics.onlineProviders > 0 ? `${metrics.onlineProviders} online` : 'degraded'}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
});
