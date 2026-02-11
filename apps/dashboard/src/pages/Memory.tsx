// Copyright (c) 2026 Ultra-Dex
import { memo, useState, useEffect } from 'react';
import { Chart } from '../components/Chart';

/**
 * Memory Dashboard Page (v6.0.0)
 * Visualizes the tiered relational memory.
 */
export const Memory = memo(function Memory() {
  const [data, setData] = useState<any>({ hot: [], warm: [], cold: [] });

  useEffect(() => {
    const fetchTier = async (tier: string) => {
      try {
        const res = await fetch(`http://localhost:3002/api/memory/${tier}`);
        return await res.json();
      } catch (e) {
        return [];
      }
    };

    Promise.all([fetchTier('hot'), fetchTier('warm'), fetchTier('cold')])
      .then(([hot, warm, cold]) => setData({ hot, warm, cold }))
      .catch(console.error);
  }, []);

  return (
    <main className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {['Hot', 'Warm', 'Cold'].map(tier => (
          <div key={tier} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{tier} Tier</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{data[tier.toLowerCase()]?.length || 0} Entries</p>
          </div>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Decision Ledger</h2>
        <div className="mt-4 space-y-3">
          {data.cold?.slice(0, 10).map((entry: any) => (
            <div key={entry.id} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-sm">
              <span className="text-cyan-400 font-mono">[{entry.type}]</span> {entry.content}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
});