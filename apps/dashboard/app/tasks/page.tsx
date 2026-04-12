'use client';

import { useEffect, useMemo, useState } from 'react';

type TaskStatus = 'running' | 'completed' | 'failed';

interface TaskRecord {
  id: string;
  prompt: string;
  output: string;
  status: TaskStatus;
  agent: string;
  provider: string;
  cost: number;
  durationMs: number;
  startedAt: string;
}

const SEED_TASKS: TaskRecord[] = [
  {
    id: 'run_101',
    prompt: 'Create auth middleware for API routes',
    output: 'Middleware created with token validation.',
    status: 'completed',
    agent: 'backend',
    provider: 'openai',
    cost: 0.24,
    durationMs: 3120,
    startedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'run_102',
    prompt: 'Refactor billing usage meter to Postgres',
    output: 'Migration in progress...',
    status: 'running',
    agent: 'database',
    provider: 'anthropic',
    cost: 0.18,
    durationMs: 1200,
    startedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: 'run_103',
    prompt: 'Generate integration tests for team workspace',
    output: 'Failed due to missing fixture.',
    status: 'failed',
    agent: 'reviewer',
    provider: 'gemini',
    cost: 0.11,
    durationMs: 1980,
    startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
];

function asCsv(rows: TaskRecord[]): string {
  const headers = ['id', 'status', 'agent', 'provider', 'cost', 'durationMs', 'startedAt', 'prompt', 'output'];
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((key) => {
          const value = String((row as Record<string, unknown>)[key] ?? '');
          return `"${value.replaceAll('"', '""')}"`;
        })
        .join(',')
    ),
  ];
  return lines.join('\n');
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskRecord[]>(SEED_TASKS);
  const [selectedTaskId, setSelectedTaskId] = useState<string>(SEED_TASKS[0].id);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    const runningIds = tasks.filter((task) => task.status === 'running').map((task) => task.id);
    if (runningIds.length === 0) return;

    const timer = setInterval(() => {
      setTasks((prev) =>
        prev.map((task) =>
          runningIds.includes(task.id) ? { ...task, durationMs: task.durationMs + 1000 } : task
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [tasks]);

  useEffect(() => {
    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket('ws://localhost:3002');
      socket.onmessage = () => {
        setTasks((prev) => prev.map((task) => (task.status === 'running' ? { ...task } : task)));
      };
    } catch {
      // Keep polling-only status updates when WebSocket is unavailable.
    }
    return () => socket?.close();
  }, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (agentFilter !== 'all' && task.agent !== agentFilter) return false;
      if (providerFilter !== 'all' && task.provider !== providerFilter) return false;
      if (startDate && new Date(task.startedAt) < new Date(startDate)) return false;
      if (endDate && new Date(task.startedAt) > new Date(`${endDate}T23:59:59`)) return false;
      return true;
    });
  }, [tasks, statusFilter, agentFilter, providerFilter, startDate, endDate]);

  const selectedTask = filteredTasks.find((task) => task.id === selectedTaskId) ?? filteredTasks[0] ?? null;

  function retryTask(taskId: string) {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status: 'running',
              output: 'Retry queued...',
              durationMs: 0,
              startedAt: new Date().toISOString(),
            }
          : task
      )
    );
  }

  function exportCsv() {
    const blob = new Blob([asCsv(filteredTasks)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'task-history.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Tasks</h1>

      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <select className="border rounded px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All status</option>
          <option value="running">Running</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select className="border rounded px-3 py-2" value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)}>
          <option value="all">All agents</option>
          {[...new Set(tasks.map((task) => task.agent))].map((agent) => (
            <option key={agent} value={agent}>
              {agent}
            </option>
          ))}
        </select>
        <select className="border rounded px-3 py-2" value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
          <option value="all">All providers</option>
          {[...new Set(tasks.map((task) => task.provider))].map((provider) => (
            <option key={provider} value={provider}>
              {provider}
            </option>
          ))}
        </select>
        <input className="border rounded px-3 py-2" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input className="border rounded px-3 py-2" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button className="border rounded px-3 py-2 bg-black text-white" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="border rounded p-3">
          <h2 className="font-medium mb-2">Task list ({filteredTasks.length})</h2>
          <ul className="space-y-2">
            {filteredTasks.map((task) => (
              <li key={task.id}>
                <button
                  className={`w-full text-left border rounded p-2 ${selectedTaskId === task.id ? 'bg-gray-100' : ''}`}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="flex justify-between">
                    <span className="font-mono text-sm">{task.id}</span>
                    <span className="text-xs uppercase">{task.status}</span>
                  </div>
                  <div className="text-sm truncate">{task.prompt}</div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="border rounded p-3">
          <h2 className="font-medium mb-2">Task detail</h2>
          {!selectedTask ? (
            <p className="text-sm text-gray-500">No task matches the current filters.</p>
          ) : (
            <div className="space-y-2 text-sm">
              <p>
                <strong>Prompt:</strong> {selectedTask.prompt}
              </p>
              <p>
                <strong>Output:</strong> {selectedTask.output}
              </p>
              <p>
                <strong>Agent:</strong> {selectedTask.agent}
              </p>
              <p>
                <strong>Provider:</strong> {selectedTask.provider}
              </p>
              <p>
                <strong>Cost:</strong> ${selectedTask.cost.toFixed(2)}
              </p>
              <p>
                <strong>Duration:</strong> {(selectedTask.durationMs / 1000).toFixed(1)}s
              </p>
              {selectedTask.status === 'failed' && (
                <button className="border rounded px-3 py-2 bg-black text-white" onClick={() => retryTask(selectedTask.id)}>
                  Retry failed task
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

