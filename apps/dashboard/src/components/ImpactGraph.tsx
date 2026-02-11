import { memo } from 'react';
import { Chart } from './Chart';

const impactData = [
  { area: 'API', risk: 0.8 },
  { area: 'UI', risk: 0.4 },
  { area: 'DB', risk: 0.6 },
  { area: 'Infra', risk: 0.3 },
];

export const ImpactGraph = memo(function ImpactGraph() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <h3 className="text-lg font-semibold text-slate-100">Impact Graph</h3>
      <div className="mt-4">
        <Chart
          data={impactData}
          xKey="area"
          series={[{ key: 'risk', color: '#f97316' }]}
          variant="bar"
          height={220}
          title="Change Risk by Area"
        />
      </div>
    </section>
  );
});
