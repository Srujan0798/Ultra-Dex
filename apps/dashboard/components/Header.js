// apps/dashboard/components/Header.js
import React from 'react';
import { Bell, Search, User, Settings, HelpCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">UD</span>
            </div>
            <h1 className="text-xl font-bold text-white">Ultra-Dex</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
          
          <button className="p-2 text-slate-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-white">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}