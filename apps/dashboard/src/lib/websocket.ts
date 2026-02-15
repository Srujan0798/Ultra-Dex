import { useCallback, useMemo, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

export type AgentState = 'running' | 'idle' | 'error' | 'offline';

export interface AgentSnapshot {
  id: string;
  name: string;
  state: AgentState;
  lastExecution: string;
  successCount: number;
  failureCount: number;
  avgDurationMs: number;
  costToday: number;
  recentRuns: number[];
}

export interface DashboardLogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  timestamp: string;
}

export interface CostPoint {
  timestamp: string;
  amount: number;
  source: string;
}

export interface DashboardMetrics {
  latencyMs: number;
  memoryUsageMb: number;
  activeAgents: number;
  onlineProviders: number;
  activeClients: number;
}

export interface MemoryMetrics {
  hot: number;
  warm: number;
  cold: number;
}

export interface DashboardEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

const DEFAULT_METRICS: DashboardMetrics = {
  latencyMs: 132,
  memoryUsageMb: 512,
  activeAgents: 0,
  onlineProviders: 0,
  activeClients: 0,
};

const DEFAULT_MEMORY: MemoryMetrics = {
  hot: 0,
  warm: 0,
  cold: 0,
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function normalizeAgentState(rawState: unknown): AgentState {
  const input = String(rawState ?? '').toLowerCase();
  if (input === 'active' || input === 'running' || input === 'busy') {
    return 'running';
  }
  if (input === 'error' || input === 'failed') {
    return 'error';
  }
  if (input === 'offline' || input === 'disconnected') {
    return 'offline';
  }
  return 'idle';
}

function normalizeAgent(raw: unknown): AgentSnapshot | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const value = raw as Record<string, unknown>;
  const id = String(value.id ?? value.agentId ?? value.name ?? '').trim();
  if (!id) {
    return null;
  }

  const successCount = toNumber(value.successCount ?? value.completed ?? value.successes, 0);
  const failureCount = toNumber(value.failureCount ?? value.failures ?? value.errorCount, 0);
  const runs = Array.isArray(value.recentRuns)
    ? value.recentRuns.map((item) => toNumber(item, 0)).slice(-14)
    : [];

  return {
    id,
    name: String(value.name ?? id),
    state: normalizeAgentState(value.state ?? value.status),
    lastExecution: String(value.lastExecution ?? value.lastSeen ?? new Date().toISOString()),
    successCount,
    failureCount,
    avgDurationMs: toNumber(value.avgDurationMs ?? value.durationMs ?? value.latency, 0),
    costToday: toNumber(value.costToday ?? value.cost ?? value.todayCost, 0),
    recentRuns: runs.length > 0 ? runs : [1, 1, 1, 0, 1, 1, 1],
  };
}

function normalizeLogLevel(rawLevel: unknown): DashboardLogEntry['level'] {
  const value = String(rawLevel ?? '').toLowerCase();
  if (value === 'warning' || value === 'warn') {
    return 'warn';
  }
  if (value === 'error' || value === 'fatal') {
    return 'error';
  }
  if (value === 'success' || value === 'ok') {
    return 'success';
  }
  return 'info';
}

function normalizeEvent(message: unknown): DashboardEvent {
  if (!message || typeof message !== 'object') {
    return {
      type: 'unknown',
      payload: { value: message as never },
      timestamp: new Date().toISOString(),
    };
  }

  const value = message as Record<string, unknown>;
  const payloadCandidate =
    (value.payload && typeof value.payload === 'object' && value.payload) ||
    (value.data && typeof value.data === 'object' && value.data) ||
    value;

  const payload = payloadCandidate as Record<string, unknown>;
  const type = String(value.type ?? value.event ?? 'unknown');

  return {
    type,
    payload,
    timestamp: String(
      value.timestamp ??
        payload.timestamp ??
        payload.time ??
        payload.createdAt ??
        new Date().toISOString()
    ),
  };
}

export interface DashboardStreamState {
  connected: boolean;
  status: 'connecting' | 'open' | 'closed' | 'error';
  error: string | null;
  events: DashboardEvent[];
  agents: AgentSnapshot[];
  logs: DashboardLogEntry[];
  costSeries: CostPoint[];
  metrics: DashboardMetrics;
  memory: MemoryMetrics;
}

export function useDashboardStream(url: string): DashboardStreamState {
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [agentsById, setAgentsById] = useState<Record<string, AgentSnapshot>>({});
  const [logs, setLogs] = useState<DashboardLogEntry[]>([]);
  const [costSeries, setCostSeries] = useState<CostPoint[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [memory, setMemory] = useState<MemoryMetrics>(DEFAULT_MEMORY);

  const onMessage = useCallback((message: unknown) => {
    const event = normalizeEvent(message);

    setEvents((previous) => [event, ...previous].slice(0, 200));

    if (event.type === 'agent-status') {
      const agent = normalizeAgent(event.payload);
      if (agent) {
        setAgentsById((previous) => ({
          ...previous,
          [agent.id]: agent,
        }));
      }
    }

    if (event.type === 'system-status') {
      const agentCandidates = event.payload.agents;
      if (Array.isArray(agentCandidates)) {
        setAgentsById(() => {
          const next: Record<string, AgentSnapshot> = {};
          for (const candidate of agentCandidates) {
            const normalized = normalizeAgent(candidate);
            if (normalized) {
              next[normalized.id] = normalized;
            }
          }
          return Object.keys(next).length > 0 ? next : {};
        });
      }

      const memoryCandidate = event.payload.memory;
      if (memoryCandidate && typeof memoryCandidate === 'object') {
        const value = memoryCandidate as Record<string, unknown>;
        setMemory({
          hot: toNumber(value.hot, memory.hot),
          warm: toNumber(value.warm, memory.warm),
          cold: toNumber(value.cold, memory.cold),
        });
      }

      const providerCandidate = event.payload.providers;
      const onlineProviders = Array.isArray(providerCandidate)
        ? providerCandidate.length
        : typeof providerCandidate === 'object' && providerCandidate
          ? Object.keys(providerCandidate as Record<string, unknown>).length
          : metrics.onlineProviders;

      setMetrics((previous) => ({
        ...previous,
        activeAgents: Array.isArray(agentCandidates)
          ? agentCandidates.length
          : previous.activeAgents,
        onlineProviders,
      }));
    }

    if (event.type === 'metrics-update') {
      setMetrics((previous) => ({
        latencyMs: toNumber(event.payload.latencyMs ?? event.payload.latency, previous.latencyMs),
        memoryUsageMb: toNumber(
          event.payload.memoryUsageMb ?? event.payload.memoryUsage,
          previous.memoryUsageMb
        ),
        activeAgents: toNumber(event.payload.activeAgents, previous.activeAgents),
        onlineProviders: toNumber(event.payload.onlineProviders, previous.onlineProviders),
        activeClients: toNumber(event.payload.activeClients ?? event.payload.clients, previous.activeClients),
      }));
    }

    if (event.type === 'memory-update') {
      setMemory((previous) => ({
        hot: toNumber(event.payload.hot, previous.hot),
        warm: toNumber(event.payload.warm, previous.warm),
        cold: toNumber(event.payload.cold, previous.cold),
      }));
    }

    if (event.type === 'cost-update') {
      const amount = toNumber(event.payload.amount ?? event.payload.cost, 0);
      const source = String(event.payload.provider ?? event.payload.source ?? 'router');

      setCostSeries((previous) => [
        ...previous.slice(-47),
        {
          timestamp: event.timestamp,
          amount,
          source,
        },
      ]);
    }

    if (event.type === 'live-log' || event.type === 'task-update' || event.type === 'error') {
      setLogs((previous) => [
        {
          id: `${event.type}:${event.timestamp}:${previous.length}`,
          level: normalizeLogLevel(event.payload.level ?? event.type),
          message: String(event.payload.message ?? event.payload.task ?? event.type),
          timestamp: event.timestamp,
        },
        ...previous,
      ].slice(0, 400));
    }
  }, [memory.cold, memory.hot, memory.warm, metrics.onlineProviders]);

  const socket = useWebSocket<unknown>(url, {
    reconnect: true,
    reconnectInterval: 2_000,
    onMessage,
  });

  return useMemo(
    () => ({
      connected: socket.connected,
      status: socket.status,
      error: socket.error,
      events,
      agents: Object.values(agentsById),
      logs,
      costSeries,
      metrics,
      memory,
    }),
    [socket.connected, socket.status, socket.error, events, agentsById, logs, costSeries, metrics, memory]
  );
}
