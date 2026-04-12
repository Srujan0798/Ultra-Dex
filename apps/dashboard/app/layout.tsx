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
  Zap
} from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Ultra-Dex Dashboard',
  description: 'AI Orchestration Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: ListTodo },
    { name: 'Agents', href: '/agents', icon: Users },
    { name: 'Memory', href: '/memory', icon: Database },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
    { name: 'Certification', href: '/certify', icon: ShieldCheck },
    { name: 'Enterprise', href: '/enterprise', icon: Zap },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col sticky top-0 h-screen">
            <div className="p-6 border-b border-border">
              <h1 className="text-xl font-bold tracking-tight text-primary">Ultra-Dex</h1>
              <p className="text-xs text-muted-foreground mt-1 text-primary/60 font-mono">v6.0.0 ECOSYSTEM</p>
            </div>
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                >
                  <item.icon size={18} />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium">Core System: ONLINE</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <header className="h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 flex items-center px-8 justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground capitalize">Infrastructure</span>
                <span className="text-muted-foreground/30">/</span>
                <span className="text-sm font-medium">Node Main</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded border border-border transition-colors font-medium">
                  Documentation
                </button>
                <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                  SYS
                </div>
              </div>
            </header>
            <div className="p-8">
              {children}
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
