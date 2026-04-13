"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  Box, 
  Cpu, 
  Database, 
  Home, 
  Layers, 
  MemoryStick, 
  Settings, 
  Terminal,
  Workflow
} from "lucide-react";

const navItems = [
  { href: "/", icon: Home, label: "Overview" },
  { href: "/tasks", icon: Workflow, label: "Tasks" },
  { href: "/agents", icon: Cpu, label: "Agents" },
  { href: "/memory", icon: MemoryStick, label: "Memory" },
  { href: "/analytics", icon: Activity, label: "Analytics" },
  { href: "/marketplace", icon: Box, label: "Marketplace" },
  { href: "/auto-ceo", icon: Terminal, label: "Auto-CEO" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-panel border-r border-border z-50">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-cyan/10 border border-cyan rounded flex items-center justify-center">
            <Layers className="w-5 h-5 text-cyan" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-text-primary tracking-tight">
              ULTRA-DEX
            </h1>
            <p className="text-xs text-text-tertiary font-display uppercase tracking-wider">
              Control Plane
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded transition-all duration-200
                    font-display text-sm uppercase tracking-wider
                    ${isActive 
                      ? "bg-cyan/10 border border-cyan/30 text-cyan" 
                      : "text-text-secondary hover:text-text-primary hover:bg-panel-elevated border border-transparent"
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan" : ""}`} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* System Status */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-panel">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-display">
            <span className="text-text-tertiary uppercase">System</span>
            <span className="text-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
              Online
            </span>
          </div>
          <div className="flex items-center justify-between text-xs font-display">
            <span className="text-text-tertiary uppercase">Version</span>
            <span className="text-cyan">v6.0.0</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
