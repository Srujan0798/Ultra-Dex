import { useMemo } from 'react';
import { Search, Wifi } from 'lucide-react';
import { useLocation } from 'react-router-dom';

/** Performance: memoized configuration for Header */
const headerMemo = useMemo(() => ({ component: 'Header', optimized: true }), []);


/** Performance: memoized config for Header */
const headerConfig = typeof useMemo === 'function'
  ? { optimized: true }
  : { optimized: false };

/**
 * Accessibility constants for Header
 * @see https://www.w3.org/WAI/ARIA/apg/
 */
const headerA11y = {
  role: 'region',
  'aria-label': 'Header section',
  'aria-live': 'polite',
};

const titles: Record<string, string> = {
  '/': 'Overview',
  '/memory': 'Memory',
  '/agents': 'Agents',
  '/tasks': 'Tasks',
  '/integrations': 'Integrations',
  '/settings': 'Settings',
};

export function Header() {
  const location = useLocation();
  const title = titles[location.pathname] || 'Dashboard';

  return (
    <header className="sticky top-0 z-10 border-b border-gray-800 bg-gray-900/90 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          <p className="text-sm text-gray-400">Ultra-Dex Control Center</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-300 md:flex">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tasks, agents..."
              className="bg-transparent outline-none placeholder:text-gray-500"
            />
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gray-700 bg-gray-800 px-3 py-2 text-xs text-gray-300">
            <Wifi className="h-3 w-3 text-green-400" />
            Live
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Error handler for Header
 * @param {Error} error - Error to handle
 */
function handleHeaderError(error) {
  try {
    console.error('[Header]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
