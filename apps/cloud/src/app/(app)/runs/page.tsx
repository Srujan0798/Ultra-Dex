'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Search } from 'lucide-react';

const MOCK_RUNS = [
  {
    id: '1',
    agent: 'Planner',
    provider: 'Claude',
    status: 'success',
    duration: 1240,
    tokens: 856,
    cost: 0.024,
    timestamp: '2026-04-13T10:30:00Z',
    prompt: 'Plan authentication system',
  },
  {
    id: '2',
    agent: 'Architect',
    provider: 'OpenAI',
    status: 'success',
    duration: 3420,
    tokens: 1240,
    cost: 0.056,
    timestamp: '2026-04-13T10:25:00Z',
    prompt: 'Design database schema',
  },
  {
    id: '3',
    agent: 'Coder',
    provider: 'Claude',
    status: 'success',
    duration: 8900,
    tokens: 3420,
    cost: 0.128,
    timestamp: '2026-04-13T10:15:00Z',
    prompt: 'Implement user API endpoints',
  },
  {
    id: '4',
    agent: 'Tester',
    provider: 'Gemini',
    status: 'failed',
    duration: 2100,
    tokens: 560,
    cost: 0.018,
    timestamp: '2026-04-13T10:05:00Z',
    prompt: 'Write unit tests',
  },
];

export default function RunsPage() {
  const [runs] = useState(MOCK_RUNS);
  const [isLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'success' | 'failed'>('all');

  const filteredRuns = runs.filter((run) => {
    const matchesSearch =
      run.agent.toLowerCase().includes(search.toLowerCase()) ||
      run.prompt.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || run.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Run History</h1>
        <p className="text-[var(--text-muted)]">All agent executions and workflow runs</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search runs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[var(--primary-700)]/30 border border-[var(--secondary-500)]/30 rounded-[var(--radius-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]/60"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'success', 'failed'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'primary' : 'secondary'}
              onClick={() => setFilter(status)}
              size="sm"
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <Card elevated>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--secondary-500)]/20">
                  <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">
                    Agent
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">
                    Provider
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">
                    Tokens
                  </th>
                  <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">Cost</th>
                  <th className="text-left py-3 px-4 text-[var(--text-muted)] font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredRuns.map((run) => (
                  <tr
                    key={run.id}
                    className="border-b border-[var(--secondary-500)]/10 hover:bg-[var(--primary-700)]/20 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <Link
                        href={`/agents/${run.agent.toLowerCase()}/run`}
                        className="font-medium text-[var(--text-primary)] hover:text-[var(--accent-primary)]"
                      >
                        {run.agent}
                      </Link>
                      <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">
                        {run.prompt}
                      </p>
                    </td>
                    <td className="py-4 px-4 text-[var(--text-secondary)]">{run.provider}</td>
                    <td className="py-4 px-4">
                      <Badge variant={run.status === 'success' ? 'success' : 'error'}>
                        {run.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-4 text-[var(--text-secondary)]">
                      {(run.duration / 1000).toFixed(1)}s
                    </td>
                    <td className="py-4 px-4 text-[var(--text-secondary)]">
                      {run.tokens.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-[var(--text-secondary)]">
                      ${run.cost.toFixed(3)}
                    </td>
                    <td className="py-4 px-4 text-[var(--text-muted)] text-xs">
                      {new Date(run.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
