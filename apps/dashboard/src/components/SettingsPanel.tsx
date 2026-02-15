import { useEffect, useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

export interface DashboardPreferences {
  theme: 'dark' | 'light' | 'system';
  defaultRange: '24h' | '7d' | '30d';
  language: 'en' | 'es' | 'fr' | 'de';
  notifyErrors: boolean;
  notifyDeploys: boolean;
}

const STORAGE_KEY = 'ultra-dex.dashboard.preferences.v1';

const DEFAULTS: DashboardPreferences = {
  theme: 'dark',
  defaultRange: '7d',
  language: 'en',
  notifyErrors: true,
  notifyDeploys: true,
};

function readPreferences(): DashboardPreferences {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<DashboardPreferences>;
    return {
      theme: parsed.theme || DEFAULTS.theme,
      defaultRange: parsed.defaultRange || DEFAULTS.defaultRange,
      language: parsed.language || DEFAULTS.language,
      notifyErrors: typeof parsed.notifyErrors === 'boolean' ? parsed.notifyErrors : DEFAULTS.notifyErrors,
      notifyDeploys:
        typeof parsed.notifyDeploys === 'boolean' ? parsed.notifyDeploys : DEFAULTS.notifyDeploys,
    };
  } catch {
    return DEFAULTS;
  }
}

function applyTheme(theme: DashboardPreferences['theme']): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const systemDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  const resolved = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
  root.dataset.theme = resolved;
}

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<DashboardPreferences>(DEFAULTS);

  useEffect(() => {
    const loaded = readPreferences();
    setPrefs(loaded);
    applyTheme(loaded.theme);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    applyTheme(prefs.theme);
  }, [prefs]);

  const summary = useMemo(() => `${prefs.theme} | ${prefs.defaultRange} | ${prefs.language}`, [prefs]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-label="Open dashboard settings panel"
        className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300 hover:border-emerald-500/50"
      >
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Preferences
      </button>

      {open && (
        <section className="absolute right-0 z-40 mt-3 w-80 rounded-xl border border-slate-800 bg-slate-950 p-4 shadow-2xl" aria-label="Dashboard preferences panel">
          <h3 className="text-sm font-semibold text-slate-100">Quick Preferences</h3>
          <p className="mt-1 text-[11px] text-slate-500">{summary}</p>

          <div className="mt-4 space-y-3">
            <label className="block text-xs text-slate-400">
              Theme
              <select
                value={prefs.theme}
                onChange={(event) =>
                  setPrefs((previous) => ({ ...previous, theme: event.target.value as DashboardPreferences['theme'] }))
                }
                className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-2 text-sm text-slate-100"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </label>

            <label className="block text-xs text-slate-400">
              Default Time Range
              <select
                value={prefs.defaultRange}
                onChange={(event) =>
                  setPrefs((previous) => ({ ...previous, defaultRange: event.target.value as DashboardPreferences['defaultRange'] }))
                }
                className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-2 text-sm text-slate-100"
              >
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </label>

            <label className="block text-xs text-slate-400">
              Language
              <select
                value={prefs.language}
                onChange={(event) =>
                  setPrefs((previous) => ({ ...previous, language: event.target.value as DashboardPreferences['language'] }))
                }
                className="mt-1 w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-2 text-sm text-slate-100"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </label>

            <label className="flex items-center justify-between text-xs text-slate-300">
              Notify on errors
              <input
                type="checkbox"
                checked={prefs.notifyErrors}
                onChange={(event) =>
                  setPrefs((previous) => ({ ...previous, notifyErrors: event.target.checked }))
                }
              />
            </label>
            <label className="flex items-center justify-between text-xs text-slate-300">
              Notify on deploy events
              <input
                type="checkbox"
                checked={prefs.notifyDeploys}
                onChange={(event) =>
                  setPrefs((previous) => ({ ...previous, notifyDeploys: event.target.checked }))
                }
              />
            </label>
          </div>
        </section>
      )}
    </div>
  );
}
