import { z } from 'zod';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001';

// Task schema
export const TaskSchema = z.object({
  id: z.string(),
  description: z.string(),
  priority: z.number().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  createdAt: z.string(),
  updatedAt: z.string(),
  assignedAgent: z.string().optional(),
  progress: z.number().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// Agent schema
export const AgentSchema = z.object({
  id: z.string(),
  role: z.string(),
  capabilities: z.array(z.string()),
  status: z.enum(['online', 'offline', 'busy']),
});

export type Agent = z.infer<typeof AgentSchema>;

// Trace schema
export const TraceSchema = z.object({
  id: z.string(),
  taskId: z.string(),
  agentId: z.string(),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().optional(),
  status: z.string(),
  events: z.array(
    z.object({
      timestamp: z.string(),
      event: z.string(),
      data: z.record(z.any()),
    })
  ),
});

export type Trace = z.infer<typeof TraceSchema>;

// API functions
export async function fetchTasks(): Promise<Task[]> {
  const response = await fetch(`${API_BASE}/agents/tasks`);
  if (!response.ok) throw new Error('Failed to fetch tasks');
  const data = await response.json();
  return z.array(TaskSchema).parse(data.tasks || []);
}

export async function createTask(task: {
  id: string;
  description: string;
  priority?: number;
  requiredCapability?: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE}/agents/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  if (!response.ok) throw new Error('Failed to create task');
}

export async function cancelTask(taskId: string): Promise<void> {
  // Assume there's a cancel endpoint, or use WS
  const response = await fetch(`${API_BASE}/agents/task/${taskId}/cancel`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to cancel task');
}

export async function fetchAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_BASE}/agents`);
  if (!response.ok) throw new Error('Failed to fetch agents');
  const data = await response.json();
  return z.array(AgentSchema).parse(data.agents || []);
}

export async function fetchTraces(limit?: number): Promise<Trace[]> {
  const url = new URL(`${API_BASE}/traces`);
  if (limit) url.searchParams.set('limit', limit.toString());
  const response = await fetch(url);
  if (!response.ok) throw new Error('Failed to fetch traces');
  const data = await response.json();
  return z.array(TraceSchema).parse(data);
}

export async function fetchTrace(traceId: string): Promise<Trace> {
  const response = await fetch(`${API_BASE}/traces/${traceId}`);
  if (!response.ok) throw new Error('Failed to fetch trace');
  const data = await response.json();
  return TraceSchema.parse(data);
}

// Authentication (mock for now)
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
}

let currentUser: User | null = null;

export function login(email: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    // Mock auth
    if (email === 'admin@example.com' && password === 'admin') {
      currentUser = { id: '1', email, role: 'admin' };
      resolve(currentUser);
    } else if (email === 'user@example.com' && password === 'user') {
      currentUser = { id: '2', email, role: 'user' };
      resolve(currentUser);
    } else {
      reject(new Error('Invalid credentials'));
    }
  });
}

export function logout(): void {
  currentUser = null;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function isAuthenticated(): boolean {
  return currentUser !== null;
}

export function hasRole(role: string): boolean {
  return currentUser?.role === role || currentUser?.role === 'admin';
}
