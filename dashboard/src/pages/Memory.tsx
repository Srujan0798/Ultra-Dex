import { Chart } from '../components/Chart';

const memoryTiers = [
  { tier: 'Hot', tokens: 2048, max: 4096 },
  { tier: 'Warm', tokens: 6200, max: 8192 },
  { tier: 'Cold', tokens: 45000, max: 100000 },
];

const retentionData = [
  { day: 'Mon', hot: 1800, warm: 5600, cold: 42000 },
  { day: 'Tue', hot: 2000, warm: 6100, cold: 43000 },
  { day: 'Wed', hot: 2100, warm: 6400, cold: 44000 },
  { day: 'Thu', hot: 2200, warm: 6500, cold: 45000 },
  { day: 'Fri', hot: 2400, warm: 6700, cold: 46000 },
];

export function Memory() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {memoryTiers.map((tier) => (
          <div
            key={tier.tier}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {tier.tier} Tier
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-100">
                  {tier.tokens.toLocaleString()} tokens
                </div>
              </div>
              <span className="text-sm text-emerald-400">
                {Math.round((tier.tokens / tier.max) * 100)}%
              </span>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-800">
              <div
                className="h-2 rounded-full bg-emerald-500/80"
                style={{ width: `${(tier.tokens / tier.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Retention Flow</h2>
          <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Last 5 days
          </span>
        </div>
        <Chart
          data={retentionData}
          xKey="day"
          series={[
            { key: 'hot', color: '#22c55e' },
            { key: 'warm', color: '#0ea5e9' },
            { key: 'cold', color: '#eab308' },
          ]}
          variant="area"
          height={280}
        />
      </div>
    </div>
  );
}
