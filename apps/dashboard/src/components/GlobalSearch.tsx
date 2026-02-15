import { useEffect, useMemo, useState } from 'react';
import { Search, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchItem {
  label: string;
  description: string;
  path: string;
  keywords: string[];
}

const SEARCH_ITEMS: SearchItem[] = [
  { label: 'Overview', description: 'Mission control summary', path: '/', keywords: ['home', 'dashboard', 'metrics'] },
  { label: 'Agents', description: 'Live agent state and actions', path: '/agents', keywords: ['bot', 'workers', 'automation'] },
  { label: 'Memory', description: 'Memory graph and recall', path: '/memory', keywords: ['knowledge', 'vector', 'graph'] },
  { label: 'Tasks', description: 'Task pipeline and queue', path: '/tasks', keywords: ['jobs', 'queue', 'work'] },
  { label: 'Analytics', description: 'Latency, usage, and outcomes', path: '/analytics', keywords: ['charts', 'cost', 'performance'] },
  { label: 'Integrations', description: 'Provider and platform integrations', path: '/integrations', keywords: ['github', 'cloud', 'plugins'] },
  { label: 'Providers', description: 'Model/provider controls', path: '/providers', keywords: ['openai', 'anthropic', 'routing'] },
  { label: 'Settings', description: 'Preferences and environment config', path: '/settings', keywords: ['preferences', 'theme', 'config'] },
  { label: 'Hologram', description: '3D and graph visualization', path: '/hologram', keywords: ['3d', 'visual', 'scene'] },
];

function fuzzyScore(query: string, candidate: string): number {
  if (!query) return 0;
  const text = candidate.toLowerCase();
  const q = query.toLowerCase();
  if (text.startsWith(q)) return 100;
  if (text.includes(q)) return 60;

  let score = 0;
  let index = 0;
  for (const char of q) {
    const found = text.indexOf(char, index);
    if (found === -1) return 0;
    score += 4;
    if (found === index) score += 2;
    index = found + 1;
  }
  return score;
}

export function GlobalSearch() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const hotkey = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (!hotkey) return;
      event.preventDefault();
      setOpen((previous) => !previous);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return SEARCH_ITEMS.slice(0, 7);

    return SEARCH_ITEMS
      .map((item) => {
        const haystack = `${item.label} ${item.description} ${item.keywords.join(' ')}`;
        return { item, score: fuzzyScore(normalized, haystack) };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((entry) => entry.item);
  }, [query]);

  const runItem = (item: SearchItem): void => {
    navigate(item.path);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open global search"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 hover:border-emerald-500/50 md:flex"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
        Search
        <span className="ml-2 inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-950 px-1.5 py-0.5 text-[10px] text-slate-500">
          <Command className="h-2.5 w-2.5" aria-hidden="true" />K
        </span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 px-4 pt-20" role="dialog" aria-modal="true" aria-label="Global search">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/95 shadow-2xl">
            <div className="flex items-center border-b border-slate-800 px-4 py-3">
              <Search className="mr-2 h-4 w-4 text-slate-500" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search routes, agents, metrics..."
                aria-label="Search all dashboard pages"
                className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <button
                type="button"
                className="ml-3 rounded border border-slate-700 px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                onClick={() => setOpen(false)}
              >
                Esc
              </button>
            </div>

            <ul className="max-h-[420px] overflow-y-auto py-2" role="listbox" aria-label="Search results">
              {results.length === 0 && (
                <li className="px-4 py-6 text-center text-sm text-slate-500">No matches found.</li>
              )}
              {results.map((item) => (
                <li key={item.path}>
                  <button
                    type="button"
                    className="w-full px-4 py-3 text-left hover:bg-slate-800/70"
                    onClick={() => runItem(item)}
                  >
                    <p className="text-sm font-medium text-slate-100">{item.label}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{item.description}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
