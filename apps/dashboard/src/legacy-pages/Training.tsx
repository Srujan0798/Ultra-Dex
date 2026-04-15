import { memo } from 'react';
import { Chart } from '../components/Chart';

const data = [
  { epoch: '1', score: 62 },
  { epoch: '2', score: 71 },
  { epoch: '3', score: 78 },
  { epoch: '4', score: 83 },
];

export const Training = memo(function Training() {
  return (
    <main className="space-y-6" role="main" aria-label="Training Dashboard">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Training Studio</h2>
        <Chart
          data={data}
          xKey="epoch"
          series={[{ key: 'score', color: '#38bdf8' }]}
          variant="line"
          height={240}
          title="Model Quality"
        />
      </section>
    </main>
  );
});
