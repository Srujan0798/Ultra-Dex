import { useEffect, useMemo, useState } from 'react';

const TOUR_STORAGE_KEY = 'ultra-dex.dashboard.onboarding.v1';

const STEPS = [
  {
    title: 'Mission Control Overview',
    body: 'Use Overview for real-time system health, throughput, and critical alerts.',
  },
  {
    title: 'Agent Operations',
    body: 'Open Agents to inspect runs, failure rates, and execution history per agent.',
  },
  {
    title: 'Memory Intelligence',
    body: 'Use Memory view to inspect relationship graphs and memory retention quality.',
  },
  {
    title: 'Analytics and Cost',
    body: 'Track latency, reliability, and spend trends from Analytics dashboards.',
  },
  {
    title: 'Preferences and Notifications',
    body: 'Configure theme, range, and notification rules from header quick controls.',
  },
];

export function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const completed = window.localStorage.getItem(TOUR_STORAGE_KEY) === 'completed';
    if (!completed) setActive(true);
  }, []);

  const current = useMemo(() => STEPS[step] || STEPS[0], [step]);

  const finish = (): void => {
    setActive(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOUR_STORAGE_KEY, 'completed');
    }
  };

  if (!active) return <></>;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/75 p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Dashboard onboarding tour"
    >
      <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Step {step + 1} of {STEPS.length}
        </p>
        <h2 className="mt-2 text-xl font-semibold">{current.title}</h2>
        <p className="mt-3 text-sm text-slate-300">{current.body}</p>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:text-slate-100"
            onClick={finish}
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 disabled:opacity-40"
              disabled={step === 0}
              onClick={() => setStep((previous) => Math.max(previous - 1, 0))}
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                onClick={() => setStep((previous) => Math.min(previous + 1, STEPS.length - 1))}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400"
                onClick={finish}
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
