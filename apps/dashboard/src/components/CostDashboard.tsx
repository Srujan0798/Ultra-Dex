import { memo, useMemo, useState } from 'react';
import type { AgentSnapshot, CostPoint } from '../lib/websocket';

type WindowKey = 'daily' | 'weekly' | 'monthly';

interface CostDashboardProps {
  agents: AgentSnapshot[];
  costSeries: CostPoint[];
  budgets?: Record<WindowKey, number>;
}

const DEFAULT_BUDGETS: Record<WindowKey, number> = {
  daily: 120,
  weekly: 700,
  monthly: 3_000,
};

function convertSeriesToWindows(series: CostPoint[]) {
  const now = Date.now();
  const dailyCutoff = now - 24 * 60 * 60 * 1_000;
  const weeklyCutoff = now - 7 * 24 * 60 * 60 * 1_000;
  const monthlyCutoff = now - 30 * 24 * 60 * 60 * 1_000;

  return {
    daily: series.filter((item) => Date.parse(item.timestamp) >= dailyCutoff),
    weekly: series.filter((item) => Date.parse(item.timestamp) >= weeklyCutoff),
    monthly: series.filter((item) => Date.parse(item.timestamp) >= monthlyCutoff),
  };
}

function downloadCsv(filename: string, rows: string[][]) {
  const csvContent = rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export const CostDashboard = memo(function CostDashboard({
  agents,
  costSeries,
  budgets = DEFAULT_BUDGETS,
}: CostDashboardProps) {
  const [windowKey, setWindowKey] = useState<WindowKey>('daily');

  const windowedSeries = useMemo(() => convertSeriesToWindows(costSeries), [costSeries]);
  const selectedSeries = windowedSeries[windowKey];

  const perAgent = useMemo(() => {
    return agents
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        cost: Number(agent.costToday.toFixed(2)),
      }))
      .sort((left, right) => right.cost - left.cost);
  }, [agents]);

  const total = useMemo(() => {
    if (selectedSeries.length > 0) {
      return selectedSeries.reduce((sum, item) => sum + item.amount, 0);
    }
    return perAgent.reduce((sum, item) => sum + item.cost, 0);
  }, [selectedSeries, perAgent]);

  const budget = budgets[windowKey];
  const usagePercent = Math.min(100, Math.round((total / Math.max(1, budget)) * 100));
  const hasBudgetRisk = usagePercent >= 85;

  const exportCsv = () => {
    const rows: string[][] = [
      ['window', windowKey],
      ['total', total.toFixed(2)],
      ['budget', budget.toFixed(2)],
      [],
      ['agent_id', 'agent_name', 'cost'],
      ...perAgent.map((agent) => [agent.id, agent.name, agent.cost.toFixed(2)]),
    ];

    downloadCsv(`ultra-dex-cost-${windowKey}.csv`, rows);
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Cost Tracking</h3>
          <p className="text-xs text-slate-400">Daily, weekly, and monthly spend with export.</p>
        </div>

        <div className="flex items-center gap-2">
          {(['daily', 'weekly', 'monthly'] as const).map((item) => (
            <button
              key={item}
              className={`rounded-full border px-3 py-1 text-xs capitalize ${
                windowKey === item
                  ? 'border-blue-500/40 bg-blue-500/20 text-blue-200'
                  : 'border-slate-700 bg-slate-900 text-slate-300'
              }`}
              onClick={() => setWindowKey(item)}
              type="button"
            >
              {item}
            </button>
          ))}
          <button
            className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-emerald-500/40"
            onClick={exportCsv}
            type="button"
          >
            Export CSV
          </button>
        </div>
      </header>

      <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">{windowKey} spend</span>
          <span
            className={`font-semibold ${hasBudgetRisk ? 'text-amber-300' : 'text-emerald-300'}`}
          >
            ${total.toFixed(2)} / ${budget.toFixed(2)}
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-slate-800">
          <div
            className={`h-2 rounded-full transition-all duration-200 ${hasBudgetRisk ? 'bg-amber-400' : 'bg-emerald-400'}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-slate-500">{usagePercent}% of budget consumed</div>
        {hasBudgetRisk && (
          <div className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Budget alert: usage is above 85%. Consider router optimization or lower-cost providers.
          </div>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-xs uppercase tracking-[0.15em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3 text-right">Spend</th>
            </tr>
          </thead>
          <tbody>
            {perAgent.map((agent) => (
              <tr key={agent.id} className="border-t border-slate-800">
                <td className="px-4 py-3 text-slate-200">{agent.name}</td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                  ${agent.cost.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
});
