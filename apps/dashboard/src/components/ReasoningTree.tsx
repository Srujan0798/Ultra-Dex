import { memo } from 'react';

const steps = [
  { title: 'Input', detail: 'User request parsed' },
  { title: 'Plan', detail: 'Steps generated and prioritized' },
  { title: 'Execute', detail: 'Tasks assigned to agents' },
  { title: 'Verify', detail: 'Quality gates applied' },
];

export const ReasoningTree = memo(function ReasoningTree() {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <h3 className="text-lg font-semibold text-slate-100">Reasoning Trace</h3>
      <ul className="mt-4 space-y-3">
        {steps.map((step) => (
          <li key={step.title} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="text-sm font-semibold text-slate-200">{step.title}</div>
            <div className="text-xs text-slate-500">{step.detail}</div>
          </li>
        ))}
      </ul>
    </section>
  );
});
