import { memo } from 'react';

/**
 * Settings Dashboard Page - Configure preferences and automation
 * @returns {JSX.Element} Settings page component
 */
export const Settings = memo(function Settings() {
  return (
    <main className="space-y-6" role="main" aria-label="Settings Dashboard">
      <section
        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        aria-label="User Preferences"
        role="region"
      >
        <h2 className="text-lg font-semibold text-slate-100">Preferences</h2>
        <form className="mt-6 grid gap-6 md:grid-cols-2" aria-label="Preferences form">
          <div className="space-y-3">
            <label
              htmlFor="default-model"
              className="text-sm text-slate-400"
            >
              Default Model
            </label>
            <select
              id="default-model"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              aria-label="Select default AI model"
            >
              <option>Claude Sonnet</option>
              <option>GPT-4o</option>
              <option>Gemini 1.5</option>
            </select>
          </div>
          <div className="space-y-3">
            <label
              htmlFor="active-workspace"
              className="text-sm text-slate-400"
            >
              Active Workspace
            </label>
            <select
              id="active-workspace"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              aria-label="Select active workspace"
            >
              <option>Ultra-Dex Core</option>
              <option>Templates Lab</option>
              <option>Enterprise Ops</option>
            </select>
          </div>
          <div className="space-y-3">
            <label
              htmlFor="notification-channel"
              className="text-sm text-slate-400"
            >
              Notification Channel
            </label>
            <input
              id="notification-channel"
              type="url"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="Slack webhook URL"
              aria-label="Enter Slack webhook URL for notifications"
            />
          </div>
          <div className="space-y-3">
            <label
              htmlFor="budget-limit"
              className="text-sm text-slate-400"
            >
              Budget Limit (Monthly)
            </label>
            <input
              id="budget-limit"
              type="text"
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100"
              placeholder="$500"
              aria-label="Enter monthly budget limit"
            />
          </div>
        </form>
      </section>

      <section
        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        aria-label="Automation Settings"
        role="region"
      >
        <h2 className="text-lg font-semibold text-slate-100">Automation</h2>
        <ul className="mt-6 space-y-4" role="list" aria-label="Automation toggles">
          {[
            { label: 'Auto-approve low-risk changes', value: true },
            { label: 'Run nightly verification', value: false },
            { label: 'Enable memory auto-prune', value: true },
          ].map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3"
              role="listitem"
            >
              <span className="text-sm text-slate-300" id={`automation-${item.label.replace(/\s+/g, '-').toLowerCase()}`}>
                {item.label}
              </span>
              <span
                className={`text-xs ${item.value ? 'text-emerald-400' : 'text-slate-500'}`}
                role="status"
                aria-labelledby={`automation-${item.label.replace(/\s+/g, '-').toLowerCase()}`}
                aria-label={item.value ? 'Enabled' : 'Disabled'}
              >
                {item.value ? 'Enabled' : 'Disabled'}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
});
