// Copyright (c) 2026 Ultra-Dex
import { memo, useState, useEffect } from 'react';
import { Bot, Shield, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Chart } from '../components/Chart';

/**
 * Agents Dashboard Page (v6.0.0)
 * Real-time monitoring of the agent swarm.
 */
export const Agents = memo(function Agents() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    fetch('http://localhost:3002/api/agents/status')
      .then(res => res.json())
      .then(data => setMetrics(data))
      .catch(console.error);
  }, []);

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Live Swarm Metrics</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-slate-950/40 p-4 border border-slate-800">
            <p className="text-sm text-slate-400">Total Sessions</p>
            <p className="text-2xl font-bold text-cyan-400">{metrics?.totalSessions || 0}</p>
          </div>
          <div className="rounded-xl bg-slate-950/40 p-4 border border-slate-800">
            <p className="text-sm text-slate-400">Avg Response Time</p>
            <p className="text-2xl font-bold text-emerald-400">{Math.round(metrics?.avgResponseTime || 0)}ms</p>
          </div>
          <div className="rounded-xl bg-slate-950/40 p-4 border border-slate-800">
            <p className="text-sm text-slate-400">Total Tokens</p>
            <p className="text-2xl font-bold text-purple-400">{metrics?.totalTokens || 0}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Protocol 21 Enforcement</h2>
        <p className="text-slate-400 mt-2">All autonomous agent outputs are currently undergoing 21-step verification.</p>
      </section>
    </main>
  );
});