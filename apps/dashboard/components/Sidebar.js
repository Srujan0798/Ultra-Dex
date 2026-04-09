// apps/dashboard/components/Sidebar.js
import React from 'react';
import {
  LayoutDashboard,
  Bot,
  Database,
  Settings,
  Users,
  BarChart3,
  Code,
  Globe,
  Shield,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/router';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { name: 'Agents', icon: Bot, href: '/agents' },
  { name: 'Memory', icon: Database, href: '/memory' },
  { name: 'Analytics', icon: BarChart3, href: '/analytics' },
  { name: 'Activity', icon: Activity, href: '/activity' },
  { name: 'Performance', icon: Zap, href: '/performance' },
  { name: 'Security', icon: Shield, href: '/security' },
  { name: 'Settings', icon: Settings, href: '/settings' },
  { name: 'API', icon: Code, href: '/api' },
  { name: 'Integrations', icon: Globe, href: '/integrations' },
];

export function Sidebar() {
  const router = useRouter();

  return (
    <aside className="w-64 bg-slate-900/80 backdrop-blur-sm border-r border-slate-700/50 flex flex-col">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Ultra-Dex</h2>
            <p className="text-xs text-slate-400">AI Orchestration</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href;

            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-1">Current Plan</h3>
          <p className="text-xs text-slate-400 mb-2">Enterprise Plus</p>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              style={{ width: '65%' }}
            ></div>
          </div>
          <p className="text-xs text-slate-400 mt-2">65% of 10K agents used</p>
        </div>
      </div>
    </aside>
  );
}
