'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { Activity, TrendingDown, DollarSign, Zap } from 'lucide-react';

const providerCosts = [
  { provider: 'openai', cost: 320 },
  { provider: 'anthropic', cost: 280 },
  { provider: 'gemini', cost: 140 },
  { provider: 'groq', cost: 90 },
];

const usageTrend = [
  { day: 'Mon', openai: 120, anthropic: 80, gemini: 45 },
  { day: 'Tue', openai: 145, anthropic: 95, gemini: 50 },
  { day: 'Wed', openai: 110, anthropic: 70, gemini: 40 },
  { day: 'Thu', openai: 160, anthropic: 110, gemini: 60 },
  { day: 'Fri', openai: 140, anthropic: 100, gemini: 55 },
  { day: 'Sat', openai: 90, anthropic: 60, gemini: 35 },
  { day: 'Sun', openai: 85, anthropic: 55, gemini: 30 },
];

const providerHealth = [
  { name: 'openai', avgLatency: 340, p50: 310, p95: 520, errorRate: 0.02, status: 'healthy' },
  { name: 'anthropic', avgLatency: 290, p50: 270, p95: 410, errorRate: 0.01, status: 'healthy' },
  { name: 'gemini', avgLatency: 180, p50: 160, p95: 300, errorRate: 0.04, status: 'degraded' },
  { name: 'groq', avgLatency: 120, p50: 110, p95: 190, errorRate: 0.0, status: 'healthy' },
];

export default function AnalyticsPage() {
  const [singleProviderCost, setSingleProviderCost] = useState(10000);
  const [routedCost, setRoutedCost] = useState(6800);

  const savings = useMemo(() => {
    const saved = Math.max(0, singleProviderCost - routedCost);
    const ratio = singleProviderCost > 0 ? (saved / singleProviderCost) * 100 : 0;
    return { saved, ratio };
  }, [singleProviderCost, routedCost]);

  const totalSpend = providerCosts.reduce((sum, p) => sum + p.cost, 0);

  return (
    <div className="flex min-h-screen bg-void">
      <Sidebar />
      <div className="flex-1 ml-64">
        <Header />
        <main className="pt-24 pb-8 px-6">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-text-primary mb-2">
              Pro Dashboard
            </h1>
            <p className="text-text-secondary">
              Cost analytics, provider health, and routing savings
            </p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-panel border border-border p-4 rounded">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-display uppercase tracking-wider">Total Spend</span>
              </div>
              <div className="text-2xl font-bold text-text-primary">${totalSpend}</div>
              <div className="text-xs text-text-tertiary">This month</div>
            </div>
            <div className="bg-panel border border-border p-4 rounded">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm font-display uppercase tracking-wider">Savings</span>
              </div>
              <div className="text-2xl font-bold text-success">${savings.saved.toFixed(0)}</div>
              <div className="text-xs text-text-tertiary">{savings.ratio.toFixed(1)}% vs single provider</div>
            </div>
            <div className="bg-panel border border-border p-4 rounded">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-display uppercase tracking-wider">Requests</span>
              </div>
              <div className="text-2xl font-bold text-text-primary">1,245</div>
              <div className="text-xs text-text-tertiary">This week</div>
            </div>
            <div className="bg-panel border border-border p-4 rounded">
              <div className="flex items-center gap-2 text-text-secondary mb-1">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-display uppercase tracking-wider">Active Providers</span>
              </div>
              <div className="text-2xl font-bold text-text-primary">4</div>
              <div className="text-xs text-text-tertiary">1 degraded</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Cost Overview */}
            <div className="bg-panel border border-border p-5 rounded">
              <h2 className="font-display font-semibold text-text-primary mb-4">Cost by Provider</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={providerCosts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
                    <XAxis dataKey="provider" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#141418', borderColor: '#2a2a35' }} />
                    <Bar dataKey="cost" fill="#00d4ff" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Usage Trend */}
            <div className="bg-panel border border-border p-5 rounded">
              <h2 className="font-display font-semibold text-text-primary mb-4">Usage Trend (Requests)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={usageTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
                    <XAxis dataKey="day" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#141418', borderColor: '#2a2a35' }} />
                    <Legend />
                    <Area type="monotone" dataKey="openai" stackId="1" stroke="#00d4ff" fill="#00d4ff" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="anthropic" stackId="1" stroke="#ff9900" fill="#ff9900" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="gemini" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Savings Report */}
          <div className="bg-panel border border-border p-5 rounded mb-8">
            <h2 className="font-display font-semibold text-text-primary mb-4">Savings Report</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <div>
                <label className="block text-sm text-text-secondary mb-1">Single-provider monthly cost</label>
                <input
                  type="number"
                  className="w-full bg-panel-elevated border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-cyan/50"
                  value={singleProviderCost}
                  onChange={(e) => setSingleProviderCost(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm text-text-secondary mb-1">Routed monthly cost</label>
                <input
                  type="number"
                  className="w-full bg-panel-elevated border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-cyan/50"
                  value={routedCost}
                  onChange={(e) => setRoutedCost(Number(e.target.value))}
                />
              </div>
              <div className="bg-cyan/5 border border-cyan/20 p-4 rounded">
                <div className="text-sm text-text-secondary">Estimated monthly savings</div>
                <div className="text-3xl font-bold text-cyan">${savings.saved.toFixed(0)}</div>
                <div className="text-sm text-cyan/80">{savings.ratio.toFixed(1)}% reduction</div>
              </div>
            </div>
          </div>

          {/* Provider Health */}
          <div className="bg-panel border border-border p-5 rounded">
            <h2 className="font-display font-semibold text-text-primary mb-4">Provider Health</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-secondary font-display uppercase tracking-wider">
                    <th className="text-left py-3">Provider</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-left py-3">Avg Latency</th>
                    <th className="text-left py-3">p50</th>
                    <th className="text-left py-3">p95</th>
                    <th className="text-left py-3">Error Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {providerHealth.map((p) => (
                    <tr key={p.name} className="border-b border-border/50">
                      <td className="py-3 font-medium text-text-primary capitalize">{p.name}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs font-display uppercase ${
                          p.status === 'healthy'
                            ? 'bg-success/10 text-success border border-success/30'
                            : 'bg-amber/10 text-amber border border-amber/30'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 text-text-secondary">{p.avgLatency}ms</td>
                      <td className="py-3 text-text-secondary">{p.p50}ms</td>
                      <td className="py-3 text-text-secondary">{p.p95}ms</td>
                      <td className="py-3 text-text-secondary">{(p.errorRate * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
