import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Overview } from '../src/pages/Overview';
import { Tasks } from '../src/pages/Tasks';
import { Agents } from '../src/pages/Agents';
import { Memory } from '../src/pages/Memory';
import { Analytics } from '../src/pages/Analytics';

// Mock window.fetch
global.fetch = vi.fn();

// Mock dependencies that might be problematic in tests
vi.mock('../src/hooks/useWebSocket', () => ({
  useWebSocket: () => ({ connected: true, status: 'open' }),
}));

vi.mock('../src/hooks/useDashboardStream', () => ({
  useDashboardStream: () => ({
    connected: true,
    metrics: { latencyMs: 100, memoryUsageMb: 256, activeAgents: 5, onlineProviders: 3, activeClients: 1 },
    agents: [{ id: '1', name: 'Agent 1', state: 'idle', successCount: 10, failureCount: 0 }],
    logs: [],
    costSeries: [],
    memory: { hot: 10, warm: 20, cold: 30 }
  }),
}));

// Mock Recharts to avoid issues with SVG rendering in JSDOM
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
  AreaChart: ({ children }: any) => <div>{children}</div>,
  Area: () => <div />,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div />,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
}));

describe('Dashboard Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Dashboard Overview renders KPI cards', async () => {
    render(
      <MemoryRouter>
        <Overview />
      </MemoryRouter>
    );
    
    // Check for some KPI card titles or values
    expect(screen.getByText(/latency/i)).toBeDefined();
    expect(screen.getByText(/memory/i)).toBeDefined();
    expect(screen.getByText(/agents/i)).toBeDefined();
  });

  it('Tasks page shows task list and filters', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ tasks: [{ id: '1', description: 'Task 1', status: 'completed', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] }),
    });

    render(
      <MemoryRouter>
        <Tasks />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/task 1/i)).toBeDefined();
    });

    // Check for status filter
    expect(screen.getByText(/status/i)).toBeDefined();
  });

  it('Agents page shows all agents', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ agents: [{ id: 'agent-1', role: 'planner', status: 'online', capabilities: ['planning'] }] }),
    });

    render(
      <MemoryRouter>
        <Agents />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/planner/i)).toBeDefined();
    });
  });

  it('Memory page semantic search returns results', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ results: [{ id: 'mem-1', content: 'Semantic Memory', score: 0.9 }] }),
    });

    render(
      <MemoryRouter>
        <Memory />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText(/search/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    // In many implementations, search might be debounced or require a button click
    // For this mock, we just check if the content appears after search
    await waitFor(() => {
      expect(screen.getByText(/semantic memory/i)).toBeDefined();
    });
  });

  it('Analytics page renders charts', async () => {
    render(
      <MemoryRouter>
        <Analytics />
      </MemoryRouter>
    );
    
    // Check for chart sections
    expect(screen.getByText(/cost/i)).toBeDefined();
    expect(screen.getByText(/usage/i)).toBeDefined();
  });
});
