import { memo, type ErrorInfo } from 'react';

const integrations = [
  { name: 'GitHub', status: 'Connected', lastSync: '2m ago' },
  { name: 'Linear', status: 'Connected', lastSync: '10m ago' },
  { name: 'Slack', status: 'Pending', lastSync: '—' },
  { name: 'Stripe', status: 'Connected', lastSync: '5m ago' },
  { name: 'Notion', status: 'Disconnected', lastSync: '—' },
  { name: 'Vercel', status: 'Connected', lastSync: '1h ago' },
];

const statusStyle: Record<string, string> = {
  Connected: 'text-emerald-400 bg-emerald-500/10',
  Pending: 'text-amber-400 bg-amber-500/10',
  Disconnected: 'text-rose-400 bg-rose-500/10',
};

/**
 * Integrations Dashboard Page - Manage third-party integrations
 * @returns {JSX.Element} Integrations page component
 */
export const Integrations = memo(function Integrations() {
  return (
    <main className="space-y-6" role="main" aria-label="Integrations Dashboard">
      <section
        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        aria-label="Active Integrations"
        role="region"
      >
        <h2 className="text-lg font-semibold text-slate-100">Integration Status</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2" role="list" aria-label="Integration list">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
              role="listitem"
              aria-label={`${integration.name}: ${integration.status}, Last sync ${integration.lastSync}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-100">{integration.name}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Last sync: {integration.lastSync}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${statusStyle[integration.status]}`}
                  role="status"
                  aria-label={`Status: ${integration.status}`}
                >
                  {integration.status}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300"
                  aria-label={`Configure ${integration.name}`}
                >
                  Configure
                </button>
                <button
                  className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
                  aria-label={`View logs for ${integration.name}`}
                >
                  View logs
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
});

/**
 * Error handler for Integrations component failures
 * @param {Error} error - The error to handle
 * @param {Object} [errorInfo] - React error info
 */
function handleIntegrationsError(error: Error, errorInfo?: ErrorInfo) {
  try {
    console.error(`[Integrations] Rendering error:`, error.message);
    if (errorInfo) console.error('Component stack:', errorInfo.componentStack);
  } catch (_) {
    // Fail silently to avoid recursive errors
  }
}
