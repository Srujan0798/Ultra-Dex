import { memo } from 'react';

export const Canvas = memo(function Canvas() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <h3 className="text-lg font-semibold text-slate-100">Collaboration Canvas</h3>
      <div className="mt-4 h-64 rounded-xl border border-dashed border-slate-700 bg-slate-950/40" />
      <p className="mt-3 text-xs text-slate-500">
        Shared workspace for agent and human collaboration.
      </p>
    </section>
  );
});
