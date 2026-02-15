import type {
  AgentSnapshot,
  CostPoint,
  DashboardLogEntry,
  DashboardMetrics,
  MemoryMetrics,
} from '../../lib/websocket';

export const sampleAgent: AgentSnapshot = {
  id: 'agent-reviewer',
  name: 'Code Reviewer',
  state: 'running',
  lastExecution: new Date(Date.now() - 75_000).toISOString(),
  successCount: 42,
  failureCount: 3,
  avgDurationMs: 185,
  costToday: 14.27,
  recentRuns: [1, 1, 1, 0, 1, 1, 1],
};

export const sampleAgents: AgentSnapshot[] = [
  sampleAgent,
  {
    ...sampleAgent,
    id: 'agent-security',
    name: 'Security Auditor',
    state: 'error',
    costToday: 9.11,
  },
];

export const sampleLogs: DashboardLogEntry[] = [
  {
    id: 'log-1',
    level: 'info',
    message: 'Agent boot complete',
    timestamp: new Date().toISOString(),
  },
  {
    id: 'log-2',
    level: 'error',
    message: 'Provider timeout detected',
    timestamp: new Date().toISOString(),
  },
];

export const sampleMetrics: DashboardMetrics = {
  latencyMs: 121,
  memoryUsageMb: 618,
  activeAgents: 9,
  onlineProviders: 4,
  activeClients: 23,
};

export const sampleCostSeries: CostPoint[] = Array.from({ length: 8 }, (_, index) => ({
  timestamp: new Date(Date.now() - (8 - index) * 10 * 60 * 1_000).toISOString(),
  amount: 1.5 + index * 0.4,
  source: 'openai',
}));

export const sampleMemory: MemoryMetrics = {
  hot: 7,
  warm: 19,
  cold: 28,
};
