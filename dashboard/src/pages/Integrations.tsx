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

export function Integrations() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Integration Status</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {integrations.map((integration) => (
            <div
              key={integration.name}
              className="rounded-xl border border-slate-800 bg-slate-950/50 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-100">
                    {integration.name}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Last sync: {integration.lastSync}
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${statusStyle[integration.status]}`}
                >
                  {integration.status}
                </span>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-emerald-500/40 hover:text-emerald-300">
                  Configure
                </button>
                <button className="rounded-full border border-slate-800 px-3 py-1 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300">
                  View logs
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
