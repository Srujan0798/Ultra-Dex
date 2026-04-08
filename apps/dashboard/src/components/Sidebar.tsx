import { memo, type ErrorInfo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Brain,
  Bot,
  ListTodo,
  Plug,
  Settings as SettingsIcon,
  Zap,
  Box,
  BarChart3,
  Activity,
  Package,
  CreditCard,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/onboarding', label: 'Onboarding', icon: Sparkles },
  { path: '/memory', label: 'Memory', icon: Brain },
  { path: '/agents', label: 'Agents', icon: Bot },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
  { path: '/integrations', label: 'Integrations', icon: Plug },
  { path: '/marketplace', label: 'Marketplace', icon: Package },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/traces', label: 'Traces', icon: Activity },
  { path: '/billing', label: 'Billing', icon: CreditCard },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
  { path: '/hologram', label: 'Hologram', icon: Box },
];

export const Sidebar = memo(function Sidebar() {
  return (
    <aside
      className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/90"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
          <Zap className="h-5 w-5 text-emerald-400" aria-hidden="true" />
        </div>
        <div>
          <div className="text-lg font-semibold tracking-wide text-slate-100">Ultra-Dex</div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Control Room</div>
        </div>
      </div>

      <nav className="space-y-1 px-3 pb-6" aria-label="Dashboard navigation">
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            aria-label={`Navigate to ${label}`}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-200'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }`
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
});

/**
 * Error handler for Sidebar component failures
 * @param {Error} error - The error to handle
 * @param {Object} [errorInfo] - React error info
 */
function handleSidebarError(error: Error, errorInfo?: ErrorInfo) {
  try {
    console.error(`[Sidebar] Rendering error:`, error.message);
    if (errorInfo) console.error('Component stack:', errorInfo.componentStack);
  } catch (_) {
    // Fail silently to avoid recursive errors
  }
}
