import { useMemo, useState } from 'react';

type DemoScenario = {
  id: string;
  title: string;
  prompt: string;
  model: string;
  latencyMs: number;
  costUsd: number;
  output: string;
};

const SCENARIOS: DemoScenario[] = [
  {
    id: 'code-review',
    title: 'Code Review Agent',
    prompt: 'Review this pull request diff and flag security/performance risks.',
    model: 'gpt-4.1-mini',
    latencyMs: 420,
    costUsd: 0.0042,
    output:
      'Findings: 1) Missing auth check in /api/admin route. 2) N+1 query in project list. Suggested patch generated with safe defaults.',
  },
  {
    id: 'test-writer',
    title: 'Test Writer Agent',
    prompt: 'Generate edge-case tests for payment retry workflow.',
    model: 'claude-3.5-sonnet',
    latencyMs: 560,
    costUsd: 0.0061,
    output:
      'Created 8 tests: idempotency, timeout backoff, duplicate webhook replay, stale lock release, and 4 boundary-value checks.',
  },
  {
    id: 'docs',
    title: 'Docs Generator Agent',
    prompt: 'Create release notes from commits in the last 7 days.',
    model: 'gemini-2.0-flash',
    latencyMs: 380,
    costUsd: 0.0034,
    output:
      'Release notes draft ready: 12 enhancements, 3 fixes, 2 deprecations with migration guidance and customer-facing summary.',
  },
];

export function InteractiveDemo() {
  const [selected, setSelected] = useState<DemoScenario>(SCENARIOS[0]);
  const [running, setRunning] = useState(false);

  const startedAt = useMemo(() => new Date().toLocaleString(), [selected]);

  const runDemo = async (): Promise<void> => {
    setRunning(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setRunning(false);
  };

  return (
    <section className="rounded-2xl border border-gray-700 bg-gray-900/70 p-6 shadow-2xl">
      <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
        <aside>
          <h2 className="text-lg font-semibold text-white">Try Scenarios</h2>
          <p className="mt-1 text-sm text-gray-400">No signup required. Simulated output mirrors production flow.</p>
          <div className="mt-4 space-y-2">
            {SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => setSelected(scenario)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  selected.id === scenario.id
                    ? 'border-blue-500 bg-blue-500/20 text-white'
                    : 'border-gray-700 bg-gray-800/60 text-gray-300 hover:border-gray-500'
                }`}
              >
                {scenario.title}
              </button>
            ))}
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-700 bg-black/40 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-blue-300">Prompt</p>
            <p className="mt-2 text-sm text-gray-200">{selected.prompt}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-3">
              <p className="text-xs text-gray-400">Model</p>
              <p className="mt-1 text-sm font-medium text-white">{selected.model}</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-3">
              <p className="text-xs text-gray-400">Latency</p>
              <p className="mt-1 text-sm font-medium text-white">~{selected.latencyMs} ms</p>
            </div>
            <div className="rounded-lg border border-gray-700 bg-gray-800/60 p-3">
              <p className="text-xs text-gray-400">Estimated Cost</p>
              <p className="mt-1 text-sm font-medium text-white">${selected.costUsd.toFixed(4)}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={runDemo}
            disabled={running}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-60"
          >
            {running ? 'Running Scenario…' : 'Run Demo'}
          </button>

          <div className="rounded-xl border border-gray-700 bg-black p-4 font-mono text-sm text-green-300">
            <p className="text-xs text-gray-500">[{startedAt}] scenario={selected.id}</p>
            <p className="mt-2 whitespace-pre-wrap">{running ? 'Executing agent pipeline...' : selected.output}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
