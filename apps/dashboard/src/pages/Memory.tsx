import { memo, useMemo } from 'react';
import { MemoryGraph } from '../components/MemoryGraph';
import { useDashboardStream } from '../lib/websocket';

export const Memory = memo(function Memory() {
  const socketUrl =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ULTRA_DEX_WS) ||
    'ws://localhost:3002/ws';
  const stream = useDashboardStream(socketUrl);

  const memory = useMemo(() => {
    const hot = stream.memory.hot || 42;
    const warm = stream.memory.warm || 128;
    const cold = stream.memory.cold || 256;
    return { hot, warm, cold };
  }, [stream.memory.cold, stream.memory.hot, stream.memory.warm]);

  const total = memory.hot + memory.warm + memory.cold;

  return (
    <main className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        {(
          [
            { key: 'hot', label: 'Hot tier', value: memory.hot, tone: 'text-rose-300' },
            { key: 'warm', label: 'Warm tier', value: memory.warm, tone: 'text-amber-300' },
            { key: 'cold', label: 'Cold tier', value: memory.cold, tone: 'text-blue-300' },
          ] as const
        ).map((item) => (
          <article
            key={item.key}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
            <p className={`mt-2 text-2xl font-semibold ${item.tone}`}>{item.value} entries</p>
          </article>
        ))}
      </section>

      <MemoryGraph memory={memory} />

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Retention Profile</h2>
        <div className="mt-4 h-2 rounded-full bg-slate-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-rose-400 via-amber-400 to-blue-400"
            style={{ width: total > 0 ? '100%' : '0%' }}
          />
        </div>
        <p className="mt-3 text-sm text-slate-400">
          Total memory records: <span className="font-semibold text-slate-200">{total}</span>. Hot
          tier is optimized for instant recall, warm for active context, and cold for long-term
          ledger.
        </p>
      </section>
    </main>
  );
});
