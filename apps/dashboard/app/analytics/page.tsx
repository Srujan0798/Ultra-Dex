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

const providerCosts = [
  { provider: 'openai', cost: 320 },
  { provider: 'anthropic', cost: 280 },
  { provider: 'gemini', cost: 140 },
  { provider: 'groq', cost: 90 },
];

const trendData = [
  { day: 'Mon', cost: 92 },
  { day: 'Tue', cost: 105 },
  { day: 'Wed', cost: 88 },
  { day: 'Thu', cost: 121 },
  { day: 'Fri', cost: 109 },
  { day: 'Sat', cost: 75 },
  { day: 'Sun', cost: 66 },
];

const tokenUsage = [
  { day: 'Mon', gpt: 12000, claude: 8000, gemini: 5000 },
  { day: 'Tue', gpt: 15000, claude: 9000, gemini: 4500 },
  { day: 'Wed', gpt: 11000, claude: 7600, gemini: 4000 },
  { day: 'Thu', gpt: 17000, claude: 10200, gemini: 5300 },
  { day: 'Fri', gpt: 14000, claude: 9300, gemini: 4800 },
];

const heatmap = [
  { task: 'coding', openai: 52, anthropic: 40, gemini: 8 },
  { task: 'planning', openai: 26, anthropic: 62, gemini: 12 },
  { task: 'analysis', openai: 35, anthropic: 25, gemini: 40 },
];

export default function AnalyticsPage() {
  const [singleProviderMonthlyCost, setSingleProviderMonthlyCost] = useState(10000);
  const [optimizedMonthlyCost, setOptimizedMonthlyCost] = useState(6800);

  const roi = useMemo(() => {
    const savings = Math.max(0, singleProviderMonthlyCost - optimizedMonthlyCost);
    const ratio = singleProviderMonthlyCost > 0 ? (savings / singleProviderMonthlyCost) * 100 : 0;
    return { savings, ratio };
  }, [singleProviderMonthlyCost, optimizedMonthlyCost]);

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Cost Analytics</h1>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">Cost by provider</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={providerCosts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="provider" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="cost" fill="#111827" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">Cost trend</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cost" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="border rounded p-3">
        <h2 className="font-medium mb-2">Token usage by model</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={tokenUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="gpt" stackId="1" stroke="#1d4ed8" fill="#93c5fd" />
              <Area type="monotone" dataKey="claude" stackId="1" stroke="#7c3aed" fill="#c4b5fd" />
              <Area type="monotone" dataKey="gemini" stackId="1" stroke="#059669" fill="#86efac" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border rounded p-3 space-y-2">
          <h2 className="font-medium">ROI calculator</h2>
          <label className="block text-sm">
            Single-provider monthly cost
            <input
              className="w-full border rounded px-2 py-1 mt-1"
              type="number"
              value={singleProviderMonthlyCost}
              onChange={(e) => setSingleProviderMonthlyCost(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            Routed monthly cost
            <input
              className="w-full border rounded px-2 py-1 mt-1"
              type="number"
              value={optimizedMonthlyCost}
              onChange={(e) => setOptimizedMonthlyCost(Number(e.target.value))}
            />
          </label>
          <p className="text-sm">
            Estimated savings: <strong>${roi.savings.toFixed(2)}</strong> ({roi.ratio.toFixed(1)}%)
          </p>
        </div>

        <div className="border rounded p-3">
          <h2 className="font-medium mb-2">Routing decisions heatmap</h2>
          <div className="overflow-auto">
            <table className="min-w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-left">Task type</th>
                  <th className="border px-2 py-1">OpenAI</th>
                  <th className="border px-2 py-1">Anthropic</th>
                  <th className="border px-2 py-1">Gemini</th>
                </tr>
              </thead>
              <tbody>
                {heatmap.map((row) => (
                  <tr key={row.task}>
                    <td className="border px-2 py-1">{row.task}</td>
                    <td className="border px-2 py-1 text-center">{row.openai}%</td>
                    <td className="border px-2 py-1 text-center">{row.anthropic}%</td>
                    <td className="border px-2 py-1 text-center">{row.gemini}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

