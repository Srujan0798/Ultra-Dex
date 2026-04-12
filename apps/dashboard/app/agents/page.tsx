'use client';

import { useMemo, useState } from 'react';

interface AgentMetric {
  id: string;
  role: string;
  model: string;
  capabilities: string[];
  status: 'idle' | 'running' | 'error';
  totalTasks: number;
  successRate: number;
  avgCost: number;
  source: 'core' | 'plugin';
}

const AGENTS: AgentMetric[] = [
  {
    id: 'planner',
    role: 'Planner',
    model: 'gpt-5.3-codex',
    capabilities: ['planning', 'roadmap'],
    status: 'idle',
    totalTasks: 220,
    successRate: 0.96,
    avgCost: 0.09,
    source: 'core',
  },
  {
    id: 'backend',
    role: 'Backend',
    model: 'claude-sonnet-4',
    capabilities: ['api', 'db', 'migrations'],
    status: 'running',
    totalTasks: 180,
    successRate: 0.93,
    avgCost: 0.14,
    source: 'core',
  },
  {
    id: 'plugin-github',
    role: 'GitHub Specialist',
    model: 'gemini-2.5-pro',
    capabilities: ['pr-review', 'issue-triage'],
    status: 'idle',
    totalTasks: 67,
    successRate: 0.91,
    avgCost: 0.07,
    source: 'plugin',
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState(AGENTS);
  const [selectedId, setSelectedId] = useState(AGENTS[0].id);
  const [nextModel, setNextModel] = useState('');
  const [nextPrompt, setNextPrompt] = useState('');

  const selected = useMemo(() => agents.find((agent) => agent.id === selectedId) ?? agents[0], [agents, selectedId]);

  function saveConfiguration() {
    setAgents((prev) =>
      prev.map((agent) =>
        agent.id === selected.id
          ? {
              ...agent,
              model: nextModel.trim() || agent.model,
              capabilities: nextPrompt.trim() ? [...agent.capabilities, 'custom-prompt-updated'] : agent.capabilities,
            }
          : agent
      )
    );
    setNextModel('');
    setNextPrompt('');
  }

  const pluginAgents = agents.filter((agent) => agent.source === 'plugin');

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Agents</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedId(agent.id)}
              className={`border rounded p-3 text-left ${agent.id === selected.id ? 'bg-gray-100' : ''}`}
            >
              <div className="flex justify-between">
                <h2 className="font-medium">{agent.role}</h2>
                <span className="text-xs uppercase">{agent.status}</span>
              </div>
              <p className="text-sm text-gray-600">{agent.model}</p>
              <p className="text-xs mt-1">Tasks: {agent.totalTasks}</p>
            </button>
          ))}
        </section>

        <section className="border rounded p-3 space-y-2">
          <h2 className="font-medium">Agent detail</h2>
          <p className="text-sm">
            <strong>Role:</strong> {selected.role}
          </p>
          <p className="text-sm">
            <strong>Model:</strong> {selected.model}
          </p>
          <p className="text-sm">
            <strong>Success rate:</strong> {(selected.successRate * 100).toFixed(1)}%
          </p>
          <p className="text-sm">
            <strong>Avg cost:</strong> ${selected.avgCost.toFixed(2)}
          </p>
          <p className="text-sm">
            <strong>Capabilities:</strong> {selected.capabilities.join(', ')}
          </p>

          <div className="pt-2 border-t space-y-2">
            <h3 className="text-sm font-medium">Configuration</h3>
            <input
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Change model"
              value={nextModel}
              onChange={(e) => setNextModel(e.target.value)}
            />
            <textarea
              className="w-full border rounded px-2 py-1 text-sm"
              placeholder="Adjust prompt"
              rows={3}
              value={nextPrompt}
              onChange={(e) => setNextPrompt(e.target.value)}
            />
            <button className="border rounded px-3 py-1 bg-black text-white text-sm" onClick={saveConfiguration}>
              Save configuration
            </button>
          </div>
        </section>
      </div>

      <section className="border rounded p-3">
        <h2 className="font-medium mb-2">Plugin agents</h2>
        <ul className="text-sm space-y-1">
          {pluginAgents.map((agent) => (
            <li key={agent.id}>
              {agent.role} ({agent.model}) — {agent.totalTasks} tasks
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

