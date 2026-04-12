import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Database,
  Settings,
  ShoppingBag,
  ShieldCheck,
  Zap,
  Cpu,
  Activity,
  Terminal,
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ultra-Dex | AI Orchestration Control Plane',
  description: 'Deterministic workflow orchestration for AI agents',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, status: 'active' },
    { name: 'Tasks', href: '/tasks', icon: ListTodo, status: 'idle' },
    { name: 'Agents', href: '/agents', icon: Users, status: 'online' },
    { name: 'Memory', href: '/memory', icon: Database, status: 'online' },
    { name: 'AUTO-CEO', href: '/auto-ceo', icon: Cpu, status: 'warning' },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag, status: 'idle' },
    { name: 'Certification', href: '/certify', icon: ShieldCheck, status: 'idle' },
    { name: 'Enterprise', href: '/enterprise', icon: Zap, status: 'idle' },
    { name: 'Settings', href: '/settings', icon: Settings, status: 'idle' },
  ];

  const getStatusDot = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(187,100%,42%)] shadow-[0_0_6px_hsl(187,100%,42%)]" />
        );
      case 'online':
        return (
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(142,71%,45%)] shadow-[0_0_6px_hsl(142,71%,45%)]" />
        );
      case 'warning':
        return (
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(38,100%,50%)] shadow-[0_0_6px_hsl(38,100%,50%)] animate-pulse" />
        );
      default:
        return <span className="w-1.5 h-1.5 rounded-full bg-[hsl(220,10%,40%)]" />;
    }
  };

  return (
    <html lang="en" className="dark">
      <body className="bg-[hsl(220,15%,8%)] text-[hsl(210,20%,96%)] antialiased overflow-hidden">
        <div className="flex h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r border-[hsl(220,10%,20%)] bg-[hsl(220,12%,10%)] flex flex-col relative">
            {/* Header */}
            <div className="p-5 border-b border-[hsl(220,10%,20%)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-[hsl(187,100%,42%)] to-[hsl(270,60%,45%)] flex items-center justify-center">
                  <Terminal size={18} className="text-[hsl(220,15%,8%)]" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold tracking-tight font-['Space_Grotesk']">
                    Ultra-Dex
                  </h1>
                  <p className="text-[10px] text-[hsl(220,10%,45%)] font-mono uppercase tracking-widest">
                    v2.0.0-alpha
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center justify-between px-3 py-2.5 rounded text-sm transition-all duration-150 group"
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    background:
                      item.status === 'active' ? 'hsla(187, 100%, 42%, 0.08)' : 'transparent',
                    borderLeft:
                      item.status === 'active'
                        ? '2px solid hsl(187, 100%, 42%)'
                        : '2px solid transparent',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      size={18}
                      className={`transition-colors duration-150 ${
                        item.status === 'active'
                          ? 'text-[hsl(187,100%,42%)]'
                          : 'text-[hsl(220,10%,45%)] group-hover:text-[hsl(210,20%,90%)]'
                      }`}
                    />
                    <span
                      className={`font-medium ${
                        item.status === 'active'
                          ? 'text-[hsl(210,20%,96%)]'
                          : 'text-[hsl(220,10%,60%)] group-hover:text-[hsl(210,20%,90%)]'
                      }`}
                    >
                      {item.name}
                    </span>
                  </div>
                  {getStatusDot(item.status)}
                </Link>
              ))}
            </nav>

            {/* System Status */}
            <div className="p-3 border-t border-[hsl(220,10%,20%)]">
              <div className="rounded bg-[hsla(142,71%,45%,0.08)] border border-[hsla(142,71%,45%,0.2)] p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={12} className="text-[hsl(142,71%,45%)]" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[hsl(142,71%,45%)]">
                    System Status
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[hsl(142,71%,45%)] shadow-[0_0_8px_hsl(142,71%,45%)] animate-pulse" />
                  <span className="text-xs font-medium">Core Online</span>
                </div>
                <div className="mt-2 text-[10px] text-[hsl(220,10%,45%)] font-mono">
                  <div className="flex justify-between">
                    <span>Latency:</span>
                    <span className="text-[hsl(187,100%,42%)]">42ms</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Agents:</span>
                    <span className="text-[hsl(142,71%,45%)]">24 active</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-hidden flex flex-col bg-[hsl(220,15%,8%)]">
            {/* Top Bar */}
            <header className="h-14 border-b border-[hsl(220,10%,20%)] bg-[hsl(220,12%,10%)] flex items-center px-6 justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[hsl(220,10%,45%)] uppercase tracking-wider">
                  Node
                </span>
                <span className="text-xs text-[hsl(220,10%,30%)]">/</span>
                <span className="text-xs font-medium">main</span>
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[hsl(187,100%,42%)]/10 text-[hsl(187,100%,42%)] border border-[hsl(187,100%,42%)]/20">
                  LIVE
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-xs font-medium px-3 py-1.5 rounded border border-[hsl(220,10%,25%)] bg-[hsl(220,10%,14%)] text-[hsl(210,20%,90%)] hover:border-[hsl(187,100%,42%)] hover:shadow-[0_0_12px_rgba(0,212,255,0.2)] transition-all duration-150">
                  Documentation
                </button>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(187,100%,42%)]/20 to-[hsl(270,60%,45%)]/20 border border-[hsl(187,100%,42%)]/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[hsl(187,100%,42%)]">S</span>
                </div>
              </div>
            </header>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
