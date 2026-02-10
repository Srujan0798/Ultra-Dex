import { memo } from 'react';
import { Activity, Bot, CheckCircle2, AlertTriangle } from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { Chart } from '../components/Chart';
import { useWebSocket } from '../hooks/useWebSocket';

const activityData = [
  { day: 'Mon', tasks: 24, completed: 20 },
  { day: 'Tue', tasks: 38, completed: 32 },
  { day: 'Wed', tasks: 29, completed: 27 },
  { day: 'Thu', tasks: 45, completed: 41 },
  { day: 'Fri', tasks: 52, completed: 49 },
  { day: 'Sat', tasks: 18, completed: 14 },
  { day: 'Sun', tasks: 14, completed: 12 },
];

/**
 * Overview Dashboard Page - Main dashboard with metrics and charts
 * @returns {JSX.Element} Overview page component
 */
export const Overview = memo(function Overview() {
  const socketUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ULTRA_DEX_WS) ||
    'ws://localhost:3002/ws';
  const { data, connected } = useWebSocket<{
    type?: string;
    data?: {
      state?: Record<string, unknown>;
      graph?: { nodes?: number; edges?: number; files?: number };
      metrics?: { clients?: number; memory?: number; uptime?: number };
    };
  }>(socketUrl);

  const state = data?.type === 'system_update' ? data.data?.state : null;

  const metrics = [
    {
      label: 'Active Agents',
      value:
        (Array.isArray(state?.activeAgents)
          ? state.activeAgents.length
          : Array.isArray(state?.agents)
            ? state.agents.length
            : undefined) ?? 17,
      delta: '+8%',
      icon: Bot,
      tone: 'cyan',
    },
    {
      label: 'Tasks Today',
      value:
        (Array.isArray(state?.tasks)
          ? state.tasks.length
          : Array.isArray(state?.pendingTasks)
            ? state.pendingTasks.length
            : undefined) ?? 42,
      delta: '+12%',
      icon: Activity,
      tone: 'emerald',
    },
    {
      label: 'Completed',
      value:
        (Array.isArray(state?.completedTasks)
          ? state.completedTasks.length
          : undefined) ?? 38,
      delta: '+6%',
      icon: CheckCircle2,
      tone: 'emerald',
    },
    {
      label: 'Alerts',
      value:
        (Array.isArray(state?.alerts)
          ? state.alerts.length
          : Array.isArray(state?.issues)
            ? state.issues.length
            : undefined) ?? 2,
      delta: '-1',
      icon: AlertTriangle,
      tone: 'amber',
    },
  ];

  return (
    <main
      className="space-y-6"
      role="main"
      aria-label="Dashboard Overview"
    >
      <section
        className="grid gap-4 lg:grid-cols-4"
        aria-label="Key Metrics"
        role="region"
      >
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-2"
          aria-label="Execution Velocity Chart"
          role="region"
        >
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Execution Velocity</h2>
            <span
              className="text-xs uppercase tracking-[0.2em] text-slate-500"
              role="status"
              aria-live="polite"
            >
              {connected ? 'Live' : 'Snapshot'}
            </span>
          </header>
          <Chart
            data={activityData}
            xKey="day"
            series={[
              { key: 'tasks', color: '#0ea5e9' },
              { key: 'completed', color: '#14b8a6' },
            ]}
            variant="line"
            height={260}
            title="Weekly Execution Velocity"
          />
        </section>

        <section
          className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6"
          aria-label="System Health Status"
          role="region"
        >
          <h2 className="text-lg font-semibold text-slate-100">System Health</h2>
          <ul className="mt-6 space-y-4" role="list" aria-label="Health metrics">
            {[
              { label: 'API latency', value: '128ms', status: 'Stable' },
              { label: 'Memory tier usage', value: '64%', status: 'Optimal' },
              { label: 'Agent queue', value: '6 pending', status: 'Active' },
            ].map((item) => (
              <li
                key={item.label}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-4"
                role="listitem"
                aria-label={`${item.label}: ${item.value}, ${item.status}`}
              >
                <div className="text-sm text-slate-400">{item.label}</div>
                <div className="mt-2 text-xl font-semibold text-slate-100" aria-hidden="true">{item.value}</div>
                <div
                  className="mt-1 text-xs uppercase tracking-[0.2em] text-emerald-400"
                  role="status"
                >
                  {item.status}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
});

/**
 * Error handler for Overview component failures
 * @param {Error} error - The error to handle
 * @param {Object} [errorInfo] - React error info
 */
function handleOverviewError(error, errorInfo) {
  try {
    console.error(`[Overview] Rendering error:`, error.message);
    if (errorInfo) console.error('Component stack:', errorInfo.componentStack);
  } catch (_) {
    // Fail silently to avoid recursive errors
  }
}
