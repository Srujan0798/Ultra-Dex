import { memo, useMemo } from 'react';
import { CostDashboard } from '../components/CostDashboard';
import type { AgentSnapshot, CostPoint } from '../lib/websocket';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UsageDataPoint {
  label: string;
  requests: number;
  tokens: number;
}

interface ProviderData {
  name: string;
  requests: number;
  tokens: number;
  cost: number;
  avgLatency: number;
  p95: number;
  p99: number;
  errorRate: number;
  status: 'healthy' | 'degraded' | 'unhealthy';
}

function generateMockUsage(): UsageDataPoint[] {
  const hours: UsageDataPoint[] = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    hours.push({
      label: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      requests: Math.floor(Math.random() * 120 + 20),
      tokens: Math.floor(Math.random() * 45000 + 5000),
    });
  }
  return hours;
}

const MOCK_PROVIDERS = [
  {
    name: 'OpenAI GPT-4o',
    requests: 1247,
    tokens: 842300,
    cost: 12.63,
    avgLatency: 320,
    p95: 680,
    p99: 1200,
    errorRate: 0.003,
    status: 'healthy',
  },
  {
    name: 'Claude 3.5 Sonnet',
    requests: 983,
    tokens: 725100,
    cost: 10.88,
    avgLatency: 410,
    p95: 850,
    p99: 1400,
    errorRate: 0.005,
    status: 'healthy',
  },
  {
    name: 'Gemini 2.0 Flash',
    requests: 756,
    tokens: 538200,
    cost: 2.15,
    avgLatency: 180,
    p95: 340,
    p99: 620,
    errorRate: 0.001,
    status: 'healthy',
  },
  {
    name: 'Deepseek R1',
    requests: 412,
    tokens: 312000,
    cost: 0.94,
    avgLatency: 520,
    p95: 1100,
    p99: 2100,
    errorRate: 0.012,
    status: 'degraded',
  },
  {
    name: 'Mistral Large',
    requests: 298,
    tokens: 198400,
    cost: 1.59,
    avgLatency: 290,
    p95: 560,
    p99: 980,
    errorRate: 0.002,
    status: 'healthy',
  },
  {
    name: 'Llama 3.3 70B',
    requests: 187,
    tokens: 145200,
    cost: 0.29,
    avgLatency: 650,
    p95: 1400,
    p99: 2800,
    errorRate: 0.008,
    status: 'healthy',
  },
  {
    name: 'Grok 3',
    requests: 134,
    tokens: 98600,
    cost: 1.48,
    avgLatency: 380,
    p95: 720,
    p99: 1300,
    errorRate: 0.004,
    status: 'healthy',
  },
];

const ROUTER_STRATEGY = 'fastest';
const BUDGET_LIMIT = 50.0;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  sub,
  accent = 'emerald',
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  const colors: Record<string, string> = {
    emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20',
    violet: 'from-violet-500/20 to-violet-500/5 border-violet-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 border-amber-500/20',
    cyan: 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20',
  };
  const textColors: Record<string, string> = {
    emerald: 'text-emerald-300',
    violet: 'text-violet-300',
    amber: 'text-amber-300',
    cyan: 'text-cyan-300',
  };
  return (
    <div className={`rounded-xl border bg-gradient-to-br p-5 ${colors[accent]}`}>
      <div className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${textColors[accent]}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function MiniBar({
  value,
  max,
  color = '#10b981',
}: {
  value: number;
  max: number;
  color?: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="h-2 w-full rounded-full bg-slate-800">
      <div
        className="h-2 rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function UsageChart({ data }: { data: ReturnType<typeof generateMockUsage> }) {
  const maxReq = Math.max(...data.map((d) => d.requests));
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Requests / Hour (24h)
      </h3>
      <div className="flex items-end gap-1" style={{ height: 160 }}>
        {data.map((d, i) => {
          const h = Math.max((d.requests / maxReq) * 140, 4);
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-t bg-emerald-500/70 transition-all hover:bg-emerald-400"
                style={{ height: h }}
              />
              <div className="absolute -top-8 hidden rounded bg-slate-800 px-2 py-1 text-xs text-slate-200 group-hover:block">
                {d.requests} req
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-slate-600">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function ProviderTable({ providers }: { providers: typeof MOCK_PROVIDERS }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Provider Performance Matrix
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs uppercase text-slate-500">
              <th className="pb-3 pr-4">Provider</th>
              <th className="pb-3 pr-4 text-right">Requests</th>
              <th className="pb-3 pr-4 text-right">Avg Latency</th>
              <th className="pb-3 pr-4 text-right">P95</th>
              <th className="pb-3 pr-4 text-right">P99</th>
              <th className="pb-3 pr-4 text-right">Error Rate</th>
              <th className="pb-3 pr-4 text-right">Cost</th>
              <th className="pb-3 text-center">Health</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr key={p.name} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                <td className="py-3 pr-4 font-medium text-slate-200">{p.name}</td>
                <td className="py-3 pr-4 text-right tabular-nums text-slate-300">
                  {p.requests.toLocaleString()}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-slate-300">
                  {p.avgLatency}ms
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-slate-400">{p.p95}ms</td>
                <td className="py-3 pr-4 text-right tabular-nums text-slate-500">{p.p99}ms</td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  <span className={p.errorRate > 0.01 ? 'text-amber-400' : 'text-emerald-400'}>
                    {(p.errorRate * 100).toFixed(1)}%
                  </span>
                </td>
                <td className="py-3 pr-4 text-right tabular-nums text-slate-300">
                  ${p.cost.toFixed(2)}
                </td>
                <td className="py-3 text-center">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      p.status === 'healthy'
                        ? 'bg-emerald-400'
                        : p.status === 'degraded'
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                    }`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LatencyHeatmap({ providers }: { providers: typeof MOCK_PROVIDERS }) {
  const maxP99 = Math.max(...providers.map((p) => p.p99));
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Latency Distribution
      </h3>
      <div className="space-y-3">
        {providers.map((p) => (
          <div key={p.name}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-300">{p.name}</span>
              <span className="tabular-nums text-slate-500">
                p50 {p.avgLatency}ms · p95 {p.p95}ms · p99 {p.p99}ms
              </span>
            </div>
            <div className="flex gap-1">
              <div
                className="h-3 rounded-l bg-emerald-500/60"
                style={{ width: `${(p.avgLatency / maxP99) * 100}%` }}
              />
              <div
                className="h-3 bg-amber-500/50"
                style={{ width: `${((p.p95 - p.avgLatency) / maxP99) * 100}%` }}
              />
              <div
                className="h-3 rounded-r bg-red-500/40"
                style={{ width: `${((p.p99 - p.p95) / maxP99) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded bg-emerald-500/60" />
          Avg
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded bg-amber-500/50" />
          P95
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded bg-red-500/40" />
          P99
        </span>
      </div>
    </div>
  );
}

function BudgetTracker({
  providers,
  budget,
}: {
  providers: typeof MOCK_PROVIDERS;
  budget: number;
}) {
  const totalCost = providers.reduce((sum, p) => sum + p.cost, 0);
  const pct = (totalCost / budget) * 100;
  const totalTokens = providers.reduce((sum, p) => sum + p.tokens, 0);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Cost & Budget
      </h3>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="text-2xl font-bold text-amber-300">${totalCost.toFixed(2)}</div>
          <div className="text-xs text-slate-500">of ${budget.toFixed(2)} budget</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-semibold text-slate-300">
            {(totalTokens / 1_000_000).toFixed(2)}M
          </div>
          <div className="text-xs text-slate-500">total tokens</div>
        </div>
      </div>
      <MiniBar value={totalCost} max={budget} color={pct > 80 ? '#f59e0b' : '#10b981'} />
      <div className="mt-4 space-y-2">
        {providers.slice(0, 5).map((p) => (
          <div key={p.name} className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{p.name}</span>
            <span className="tabular-nums text-slate-300">${p.cost.toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RouterStatus({
  strategy,
  providers,
}: {
  strategy: string;
  providers: typeof MOCK_PROVIDERS;
}) {
  const healthyCount = providers.filter((p) => p.status === 'healthy').length;
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Smart Router
      </h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Strategy</span>
          <span className="rounded-full bg-violet-500/15 px-3 py-1 text-xs font-medium text-violet-300">
            {strategy}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Active Providers</span>
          <span className="text-sm font-semibold text-emerald-300">
            {healthyCount}/{providers.length}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Circuit Breakers</span>
          <span className="text-sm font-semibold text-emerald-300">
            {providers.filter((p) => p.status !== 'healthy').length > 0
              ? `${providers.filter((p) => p.status !== 'healthy').length} tripped`
              : 'All closed'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">Fallback Order</span>
          <span className="text-xs text-slate-500">
            {providers
              .sort((a, b) => a.avgLatency - b.avgLatency)
              .slice(0, 3)
              .map((p) => p.name.split(' ')[0])
              .join(' → ')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export const Analytics = memo(function Analytics() {
  const usageData = useMemo(() => generateMockUsage(), []);
  const costSeries = useMemo<CostPoint[]>(
    () =>
      MOCK_PROVIDERS.map((provider, index) => ({
        amount: provider.cost,
        source: provider.name,
        timestamp: new Date(Date.now() - index * 4 * 60 * 60 * 1000).toISOString(),
      })),
    []
  );
  const costAgents = useMemo<AgentSnapshot[]>(
    () =>
      MOCK_PROVIDERS.map((provider, index) => ({
        id: provider.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: provider.name,
        state:
          provider.status === 'healthy'
            ? 'running'
            : provider.status === 'degraded'
              ? 'idle'
              : 'error',
        lastExecution: new Date(Date.now() - index * 10 * 60 * 1000).toISOString(),
        successCount: provider.requests,
        failureCount: Math.round(provider.requests * provider.errorRate),
        avgDurationMs: provider.avgLatency,
        costToday: provider.cost,
        recentRuns: [1, 1, 1, 1, 1, 1, 1],
      })),
    []
  );
  const totalRequests = MOCK_PROVIDERS.reduce((s, p) => s + p.requests, 0);
  const totalTokens = MOCK_PROVIDERS.reduce((s, p) => s + p.tokens, 0);
  const totalCost = MOCK_PROVIDERS.reduce((s, p) => s + p.cost, 0);
  const avgLatency = Math.round(
    MOCK_PROVIDERS.reduce((s, p) => s + p.avgLatency * p.requests, 0) / totalRequests
  );

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Total Requests"
          value={totalRequests.toLocaleString()}
          sub="Last 24 hours"
          accent="emerald"
        />
        <StatCard
          label="Avg Latency"
          value={`${avgLatency}ms`}
          sub="Weighted by request volume"
          accent="cyan"
        />
        <StatCard
          label="Total Tokens"
          value={`${(totalTokens / 1_000_000).toFixed(2)}M`}
          sub="Prompt + completion"
          accent="violet"
        />
        <StatCard
          label="Total Cost"
          value={`$${totalCost.toFixed(2)}`}
          sub={`$${BUDGET_LIMIT.toFixed(2)} budget`}
          accent="amber"
        />
      </div>

      {/* Usage Chart */}
      <UsageChart data={usageData} />

      {/* Provider Table */}
      <ProviderTable providers={MOCK_PROVIDERS} />

      {/* Bottom Row: Latency + Cost + Router */}
      <div className="grid grid-cols-3 gap-4">
        <LatencyHeatmap providers={MOCK_PROVIDERS} />
        <BudgetTracker providers={MOCK_PROVIDERS} budget={BUDGET_LIMIT} />
        <RouterStatus strategy={ROUTER_STRATEGY} providers={MOCK_PROVIDERS} />
      </div>

      <CostDashboard
        agents={costAgents}
        budgets={{ daily: BUDGET_LIMIT, weekly: BUDGET_LIMIT * 5, monthly: BUDGET_LIMIT * 20 }}
        costSeries={costSeries}
      />
    </div>
  );
});

export default Analytics;
