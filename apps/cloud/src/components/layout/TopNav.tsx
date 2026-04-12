'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';

export function TopNav() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400">Ultra-Dex</span>
        <span className="text-slate-600">/</span>
        <span className="text-white">Dashboard</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Command Palette Trigger */}
        <button
          type="button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span className="text-sm">Search</span>
          <kbd className="hidden sm:inline-flex px-1.5 py-0.5 text-xs font-mono bg-slate-800 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.[0] || 'U'}
            </div>
            <span className="hidden sm:block text-sm text-slate-300">{user?.name || 'User'}</span>
            <ChevronDown className="w-4 h-4 text-slate-500" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-800 rounded-lg shadow-lg py-1 z-50">
              <Link
                href="/settings"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => setShowUserMenu(false)}
              >
                <User className="w-4 h-4" />
                Profile
              </Link>
              <div className="border-t border-slate-800 my-1" />
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-slate-800"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
