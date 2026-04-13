"use client";

import { Bell, Search, User } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-panel/80 backdrop-blur-md border-b border-border z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search workflows, agents..."
              className="w-80 bg-panel-elevated border border-border rounded pl-10 pr-4 py-2 
                       text-sm text-text-primary placeholder:text-text-tertiary
                       focus:outline-none focus:border-cyan/50 transition-colors font-display"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button className="relative p-2 text-text-secondary hover:text-text-primary transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-amber rounded-full" />
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-border">
            <div className="text-right">
              <p className="text-sm font-medium text-text-primary font-display">Admin</p>
              <p className="text-xs text-text-tertiary uppercase tracking-wider">Pro Plan</p>
            </div>
            <div className="w-9 h-9 bg-cyan/10 border border-cyan/30 rounded flex items-center justify-center">
              <User className="w-5 h-5 text-cyan" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
