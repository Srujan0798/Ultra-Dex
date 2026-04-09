import { memo } from 'react';

const STATES = [
  'Init',
  'Planning',
  'Implementing',
  'Testing',
  'Reviewing',
  'Deploying',
  'Complete',
];

export const StateGraph = memo(function StateGraph() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <h3 className="text-lg font-semibold text-slate-100">State Graph</h3>
      <div className="mt-4 flex flex-wrap gap-2">
        {STATES.map((state) => (
          <span
            key={state}
            className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400"
          >
            {state}
          </span>
        ))}
      </div>
    </section>
  );
});
