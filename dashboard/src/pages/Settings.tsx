export function Settings() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Preferences</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <label className="text-sm text-slate-400">Default Model</label>
            <select className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">
              <option>Claude Sonnet</option>
              <option>GPT-4o</option>
              <option>Gemini 1.5</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-sm text-slate-400">Active Workspace</label>
            <select className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">
              <option>Ultra-Dex Core</option>
              <option>Templates Lab</option>
              <option>Enterprise Ops</option>
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-sm text-slate-400">Notification Channel</label>
            <input
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Slack webhook URL"
            />
          </div>
          <div className="space-y-3">
            <label className="text-sm text-slate-400">Budget Limit (Monthly)</label>
            <input
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="$500"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Automation</h2>
        <div className="mt-6 space-y-4">
          {[
            { label: 'Auto-approve low-risk changes', value: true },
            { label: 'Run nightly verification', value: false },
            { label: 'Enable memory auto-prune', value: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3">
              <span className="text-sm text-slate-300">{item.label}</span>
              <span className={`text-xs ${item.value ? 'text-emerald-400' : 'text-slate-500'}`}>
                {item.value ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
