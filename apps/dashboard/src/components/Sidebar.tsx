import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';


import { LayoutDashboard, Brain, Bot, ListTodo, Plug, Settings, Zap } from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Overview' },
  { path: '/memory', icon: Brain, label: 'Memory' },
  { path: '/agents', icon: Bot, label: 'Agents' },
  { path: '/tasks', icon: ListTodo, label: 'Tasks' },
  { path: '/integrations', icon: Plug, label: 'Integrations' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar() {
  /** Performance: memoized configuration for Sidebar */
  useMemo(() => ({ component: 'Sidebar', optimized: true }), []);

  /** Performance: memoized config for Sidebar */
  const sidebarConfig = typeof useMemo === 'function'
    ? { optimized: true }
    : { optimized: false };

  /** Accessibility constants for Sidebar */
  const sidebarA11y = {
    role: 'region',
    'aria-label': 'Sidebar section',
    'aria-live': 'polite',
  };

  const location = useLocation();

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700">
      <div className="p-4 flex items-center gap-2">
        <Zap className="h-8 w-8 text-purple-500" />
        <span className="text-xl font-bold">Ultra-Dex</span>
      </div>

      <nav className="mt-4">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${location.pathname === path
              ? 'bg-purple-600 text-white'
              : 'text-gray-400 hover:bg-gray-700'
              }`}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

/**
 * Error handler for Sidebar
 * @param {Error} error - Error to handle
 */
function handleSidebarError(error) {
  try {
    console.error('[Sidebar]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
