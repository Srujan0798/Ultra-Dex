import { memo, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

const steps = ['Welcome', 'API Key', 'First AI Request', 'Explore Features', 'Done'];

const featureCards = [
  {
    title: 'Providers',
    description: 'Route requests across multiple AI providers with fallback logic.',
  },
  { title: 'Agents', description: 'Coordinate specialist agents for complex workflows.' },
  { title: 'Memory', description: 'Persist and search context across sessions.' },
  { title: 'Governance', description: 'Enforce policies, audit actions, and control risk.' },
];

export const Onboarding = memo(function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [apiValidated, setApiValidated] = useState(false);
  const [apiValidationMessage, setApiValidationMessage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Summarize what Ultra-Dex does in one paragraph.');
  const [streamOutput, setStreamOutput] = useState('');
  const [loading, setLoading] = useState(false);

  const canContinue = useMemo(() => {
    if (step === 1) return apiValidated;
    if (step === 2) return streamOutput.trim().length > 0;
    return true;
  }, [apiValidated, step, streamOutput]);

  const validateApiKey = async () => {
    setLoading(true);
    setApiValidationMessage(null);
    try {
      const response = await fetch(`${API_BASE}/api/status`, {
        headers: { 'x-api-key': apiKey },
      });
      if (!response.ok) {
        throw new Error(`Validation failed (${response.status})`);
      }
      setApiValidated(true);
      setApiValidationMessage('API key validated with test call.');
    } catch (error) {
      setApiValidated(false);
      setApiValidationMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const runFirstRequest = async () => {
    setLoading(true);
    setStreamOutput('');
    try {
      const response = await fetch(`${API_BASE}/api/multimodal/process`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          provider: 'nvidia',
          model: 'nemotron',
          prompt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
          const chunk = await reader.read();
          done = chunk.done;
          if (chunk.value) {
            setStreamOutput((prev) => prev + decoder.decode(chunk.value, { stream: true }));
          }
        }
      } else {
        const data = (await response.json()) as { result?: unknown };
        setStreamOutput(
          typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2)
        );
      }
    } catch (error) {
      setStreamOutput(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  const complete = () => {
    navigate('/');
  };

  return (
    <section className="relative space-y-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Onboarding Wizard</h1>
        <p className="mt-1 text-sm text-slate-400">
          Step {step + 1} of {steps.length}: {steps[step]}
        </p>
      </header>

      {step === 0 && (
        <article className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
          <h2 className="text-lg font-semibold">Welcome to Ultra-Dex</h2>
          <p className="mt-2 text-slate-300">
            This quick setup validates your key, runs your first AI request, and highlights core
            platform features.
          </p>
        </article>
      )}

      {step === 1 && (
        <article className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
          <h2 className="text-lg font-semibold">Add API Key</h2>
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="Paste API key"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void validateApiKey()}
            disabled={loading || apiKey.trim().length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Validating...' : 'Validate key'}
          </button>
          {apiValidationMessage && <p className="text-sm text-slate-300">{apiValidationMessage}</p>}
        </article>
      )}

      {step === 2 && (
        <article className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
          <h2 className="text-lg font-semibold">First AI Request</h2>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => void runFirstRequest()}
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? 'Streaming...' : 'Run request'}
          </button>
          <pre className="max-h-72 overflow-auto rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-200">
            {streamOutput || 'Response stream appears here...'}
          </pre>
        </article>
      )}

      {step === 3 && (
        <article className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {featureCards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border border-slate-800 bg-slate-950/40 p-4"
            >
              <h3 className="font-semibold">{card.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{card.description}</p>
            </div>
          ))}
        </article>
      )}

      {step === 4 && (
        <article className="relative overflow-hidden rounded-xl border border-emerald-600/40 bg-emerald-900/10 p-6">
          <h2 className="text-xl font-semibold text-emerald-200">You are all set.</h2>
          <p className="mt-2 text-slate-200">
            Onboarding is complete. Launching mission control next.
          </p>
          <div className="pointer-events-none absolute inset-0">
            {Array.from({ length: 32 }).map((_, index) => (
              <span
                key={index}
                className="absolute h-2 w-2 rounded-full bg-emerald-400"
                style={{
                  left: `${(index * 17) % 100}%`,
                  top: `${(index * 23) % 100}%`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        </article>
      )}

      <footer className="flex items-center justify-between">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((previous) => Math.max(0, previous - 1))}
          className="rounded-lg border border-slate-700 px-4 py-2 text-slate-100 hover:border-slate-500 disabled:opacity-40"
        >
          Back
        </button>

        {step < steps.length - 1 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((previous) => Math.min(steps.length - 1, previous + 1))}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={complete}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
          >
            Go to dashboard
          </button>
        )}
      </footer>
    </section>
  );
});
