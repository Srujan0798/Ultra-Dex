import { memo } from 'react';
import { Bot, Shield, Cpu, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Chart } from '../components/Chart';

const agents = [
  { name: 'Planner', status: 'active', tasks: 12, type: 'Strategy', health: 98 },
  { name: 'Backend', status: 'busy', tasks: 19, type: 'Build', health: 94 },
  { name: 'Frontend', status: 'active', tasks: 14, type: 'UI', health: 96 },
  { name: 'Database', status: 'idle', tasks: 3, type: 'Data', health: 92 },
  { name: 'Security', status: 'active', tasks: 6, type: 'Audit', health: 99 },
  { name: 'Reviewer', status: 'busy', tasks: 9, type: 'Quality', health: 95 },
];

const throughputData = [
  { hour: '09:00', requests: 12, errors: 1 },
  { hour: '10:00', requests: 18, errors: 0 },
  { hour: '11:00', requests: 24, errors: 2 },
  { hour: '12:00', requests: 16, errors: 1 },
  { hour: '13:00', requests: 28, errors: 0 },
];

const statusStyles: Record<string, string> = {
  active: 'text-emerald-400 bg-emerald-500/10',
  busy: 'text-amber-400 bg-amber-500/10',
  idle: 'text-slate-400 bg-slate-500/10',
};

/**
 * Agents Dashboard Page - Monitor AI agent status and guardrails
 * @returns {JSX.Element} Agents page component
 */
export const Agents = memo(function Agents() {
  return (
    <main className="space-y-6" role="main" aria-label="Agents Dashboard">
      <section
        className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
        aria-label="Agent Status Overview"
        role="region"
      >
        <h2 className="text-lg font-semibold text-slate-100">Agent Status</h2>
        <ul className="mt-4 grid gap-3 md:grid-cols-2" role="list" aria-label="Active agents">
          {agents.map((agent) => (
            <li
              key={agent.name}
              className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-4"
              role="listitem"
              aria-label={`${agent.name} agent: ${agent.status}, ${agent.tasks} tasks, ${agent.health}% health`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900" aria-hidden="true">
                  <Bot className="h-5 w-5 text-cyan-300" aria-hidden="true" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-100">{agent.name}</div>
                  <div className="text-xs text-slate-500">{agent.type}</div>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs ${statusStyles[agent.status]}`}
                  role="status"
                  aria-label={`Status: ${agent.status}`}
                >
                  {agent.status}
                </div>
                <div className="mt-2 text-xs text-slate-400" aria-label={`${agent.tasks} tasks, ${agent.health}% health`}>
                  {agent.tasks} tasks · {agent.health}% health
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:col-span-2"
          aria-label="Swarm Throughput Chart"
          role="region"
        >
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Swarm Throughput</h2>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500" aria-hidden="true">Requests</div>
          </header>
          <Chart
            data={throughputData}
            xKey="hour"
            series={[
              { key: 'requests', color: '#06b6d4' },
              { key: 'errors', color: '#f97316' },
            ]}
            variant="line"
            height={240}
            title="Hourly Swarm Throughput"
          />
        </section>

        <section
          className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
          aria-label="System Guardrails"
          role="region"
        >
          <h2 className="text-lg font-semibold text-slate-100">Guardrails</h2>
          <ul className="mt-6 space-y-4" role="list" aria-label="Guardrail status">
            {[
              { label: 'Security Checks', value: '14 passed', icon: Shield, tone: 'text-emerald-400' },
              { label: 'Compute Budget', value: '68% used', icon: Cpu, tone: 'text-cyan-400' },
              { label: 'Quality Gates', value: 'All green', icon: CheckCircle2, tone: 'text-emerald-400' },
              { label: 'Alerts', value: '2 warnings', icon: AlertTriangle, tone: 'text-amber-400' },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 p-4"
                role="listitem"
                aria-label={`${item.label}: ${item.value}`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-4 w-4 ${item.tone}`} aria-hidden="true" />
                  <span className="text-sm text-slate-300">{item.label}</span>
                </div>
                <span className="text-sm text-slate-100" role="status">{item.value}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
});
