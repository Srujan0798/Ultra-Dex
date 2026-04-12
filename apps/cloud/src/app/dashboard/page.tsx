'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Bot,
  Clock,
  Coins,
  FolderKanban,
  Play,
  Plus,
  Terminal,
  TrendingUp,
  Zap,
} from 'lucide-react';

const STATS = [
  { name: 'Active Agents', value: '24', change: '+3', icon: Bot, color: 'blue' },
  { name: 'Workflows Run', value: '1,234', change: '+156', icon: Play, color: 'emerald' },
  { name: 'Projects', value: '12', change: '+2', icon: FolderKanban, color: 'purple' },
  { name: 'Avg Latency', value: '42ms', change: '-6ms', icon: Clock, color: 'amber' },
];

const RECENT_RUNS = [
  { id: 1, agent: 'Planner', status: 'completed', duration: '2.4s', time: '2 min ago' },
  { id: 2, agent: 'Architect', status: 'running', duration: '—', time: '5 min ago' },
  { id: 3, agent: 'Coder', status: 'completed', duration: '8.1s', time: '12 min ago' },
  { id: 4, agent: 'Tester', status: 'failed', duration: '1.2s', time: '18 min ago' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-slate-400">Overview of your Ultra-Dex workspace</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/agents/run"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            Run Agent
          </Link>
          <button
            type="button"
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-slate-300" />
                </div>
                <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-semibold text-white">{stat.value}</div>
              <div className="text-sm text-slate-500">{stat.name}</div>
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-lg">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white">Recent Runs</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {RECENT_RUNS.map((run) => (
              <div
                key={run.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      run.status === 'completed'
                        ? 'bg-emerald-500'
                        : run.status === 'running'
                          ? 'bg-blue-500 animate-pulse'
                          : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <div className="font-medium text-white">{run.agent}</div>
                    <div className="text-sm text-slate-500">{run.time}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`text-sm font-medium ${
                      run.status === 'completed'
                        ? 'text-emerald-400'
                        : run.status === 'running'
                          ? 'text-blue-400'
                          : 'text-red-400'
                    }`}
                  >
                    {run.status}
                  </span>
                  <span className="text-sm text-slate-500 font-mono">{run.duration}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-800">
            <Link href="/runs" className="text-sm text-blue-400 hover:text-blue-300 font-medium">
              View all runs →
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/agents"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="font-medium text-white">Run Agent</div>
                <div className="text-sm text-slate-500">Execute single agent</div>
              </div>
            </Link>
            <Link
              href="/workflows"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <div className="font-medium text-white">New Workflow</div>
                <div className="text-sm text-slate-500">Multi-agent chain</div>
              </div>
            </Link>
            <Link
              href="/projects"
              className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-medium text-white">Open Project</div>
                <div className="text-sm text-slate-500">Manage files & memory</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
