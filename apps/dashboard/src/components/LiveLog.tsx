import { memo } from 'react';

const entries = [
  { id: 1, message: 'Agent swarm initialized', level: 'info' },
  { id: 2, message: 'Planner completed task breakdown', level: 'success' },
  { id: 3, message: 'Reviewer flagged two warnings', level: 'warning' },
];

export const LiveLog = memo(function LiveLog() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <h3 className="text-lg font-semibold text-slate-100">Live Log</h3>
      <ul className="mt-4 space-y-2">
        {entries.map((entry) => (
          <li key={entry.id} className="text-xs text-slate-400">
            {entry.message}
          </li>
        ))}
      </ul>
    </section>
  );
});
