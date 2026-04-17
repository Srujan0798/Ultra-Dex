import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serve } from '@hono/node-server';

const app = new Hono();
const startTime = Date.now();
const VERSION = '2.0.0-alpha.0';
const isMock = process.env.MOCK_AI === 'true';

// ── Middleware ────────────────────────────────────────────────────────────

app.use('*', cors());

app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${c.req.method} ${c.req.path} ${c.res.status} ${ms}ms`);
});

app.onError((err, c) => {
  console.error(`[api] ${err.message}`);
  return c.json({ error: err.message, code: 'INTERNAL_ERROR' }, 500);
});

// ── Agent definitions ────────────────────────────────────────────────────

const AGENTS = [
  {
    id: 'planner',
    name: '@Planner',
    tier: 'Leadership',
    description: 'Project planning, task breakdown, dependencies',
  },
  {
    id: 'cto',
    name: '@CTO',
    tier: 'Leadership',
    description: 'Architecture, technology decisions, trade-off analysis',
  },
  {
    id: 'backend',
    name: '@Backend',
    tier: 'Development',
    description: 'APIs, business logic, data processing',
  },
  {
    id: 'frontend',
    name: '@Frontend',
    tier: 'Development',
    description: 'UI/UX, client-side functionality',
  },
  {
    id: 'database',
    name: '@Database',
    tier: 'Development',
    description: 'Schema design, queries, migrations',
  },
  {
    id: 'auth',
    name: '@Auth',
    tier: 'Security',
    description: 'Authentication, security protocols',
  },
  {
    id: 'devops',
    name: '@DevOps',
    tier: 'DevOps',
    description: 'CI/CD, infrastructure, monitoring',
  },
  {
    id: 'reviewer',
    name: '@Reviewer',
    tier: 'Quality',
    description: 'Code review, architectural compliance',
  },
  {
    id: 'debugger',
    name: '@Debugger',
    tier: 'Quality',
    description: 'Bug investigation, root cause analysis',
  },
];

// ── Provider definitions ─────────────────────────────────────────────────

const PROVIDERS = [
  { name: 'openai', models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini'], status: 'available' },
  {
    name: 'anthropic',
    models: ['claude-sonnet-4-20250514', 'claude-haiku-4-5-20251001'],
    status: 'available',
  },
  { name: 'google', models: ['gemini-2.5-flash', 'gemini-2.5-pro'], status: 'available' },
  { name: 'groq', models: ['llama-3.3-70b', 'mixtral-8x7b'], status: 'available' },
  { name: 'mistral', models: ['mistral-large', 'mistral-small'], status: 'available' },
  { name: 'deepseek', models: ['deepseek-chat', 'deepseek-reasoner'], status: 'available' },
  { name: 'cohere', models: ['command-r-plus', 'command-r'], status: 'available' },
  { name: 'together', models: ['meta-llama/Meta-Llama-3.1-70B'], status: 'available' },
  { name: 'fireworks', models: ['llama-v3p1-70b-instruct'], status: 'available' },
  { name: 'perplexity', models: ['sonar-pro', 'sonar'], status: 'available' },
  { name: 'nvidia', models: ['nemotron-4-340b'], status: 'available' },
  { name: 'grok', models: ['grok-2'], status: 'available' },
  { name: 'llama', models: ['llama-4-scout', 'llama-4-maverick'], status: 'available' },
];

// ── Swarm store (in-memory) ──────────────────────────────────────────────

const swarms = new Map<
  string,
  {
    id: string;
    objective: string;
    agents: string[];
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    results: Record<string, unknown>[];
    startedAt: number;
    completedAt?: number;
  }
>();

// ── Mock AI response ─────────────────────────────────────────────────────

function mockChatResponse(
  messages: { role: string; content: string }[],
  provider: string,
  model: string
) {
  const lastMessage = messages[messages.length - 1]?.content || '';
  return {
    content: `[MOCK] Response to: "${lastMessage.slice(0, 80)}${lastMessage.length > 80 ? '...' : ''}"`,
    provider,
    model,
    usage: { promptTokens: lastMessage.length, completionTokens: 42 },
    mock: true,
  };
}

// ── Routes ───────────────────────────────────────────────────────────────

// Health
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    version: VERSION,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    mock: isMock,
  });
});

// Providers
app.get('/api/providers', (c) => {
  return c.json({ providers: PROVIDERS, count: PROVIDERS.length });
});

// Agents
app.get('/api/agents', (c) => {
  return c.json({ agents: AGENTS, count: AGENTS.length });
});

// Chat
app.post('/api/chat', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: 'messages array is required', code: 'VALIDATION_ERROR' }, 400);
  }

  const provider = body.provider || 'openai';
  const model = body.model || 'gpt-4o';

  if (isMock) {
    return c.json(mockChatResponse(body.messages, provider, model));
  }

  // Real provider routing
  try {
    const { AIMetaLayer } = await import('../ai/ai-meta-layer.js');
    const metaLayer = new AIMetaLayer();
    const result = await metaLayer.call({
      messages: body.messages,
      provider,
      model,
    });
    return c.json({
      content: result.content || result.response || '',
      provider,
      model,
      usage: result.usage || {},
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message, code: 'PROVIDER_ERROR' }, 502);
  }
});

// Run agent
app.post('/api/agent/run', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.agent || !body?.task) {
    return c.json({ error: 'agent and task fields are required', code: 'VALIDATION_ERROR' }, 400);
  }

  const agent = AGENTS.find((a) => a.id === body.agent || a.name === body.agent);
  if (!agent) {
    return c.json({ error: `Unknown agent: ${body.agent}`, code: 'NOT_FOUND' }, 404);
  }

  if (isMock) {
    return c.json({
      agent: agent.id,
      task: body.task,
      status: 'completed',
      result: `[MOCK] ${agent.name} completed: "${body.task.slice(0, 80)}"`,
      duration: 1200,
    });
  }

  try {
    const { AgentOrchestrator } = await import('../orchestration/index.js');
    const orchestrator = new AgentOrchestrator();
    const result = await orchestrator.executeTask({
      agent: body.agent,
      task: body.task,
    });
    return c.json({ agent: agent.id, task: body.task, status: 'completed', result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message, code: 'EXECUTION_ERROR' }, 500);
  }
});

// Start swarm
app.post('/api/swarm', async (c) => {
  const body = await c.req.json().catch(() => null);
  if (!body?.objective) {
    return c.json({ error: 'objective field is required', code: 'VALIDATION_ERROR' }, 400);
  }

  const id = `swarm-${Date.now().toString(36)}`;
  const agents = body.agents || ['planner', 'backend', 'frontend', 'reviewer'];

  const swarm = {
    id,
    objective: body.objective,
    agents,
    status: 'running' as const,
    progress: 0,
    results: [] as Record<string, unknown>[],
    startedAt: Date.now(),
  };
  swarms.set(id, swarm);

  if (isMock) {
    // Simulate async completion
    setTimeout(() => {
      const s = swarms.get(id);
      if (s) {
        s.status = 'completed';
        s.progress = 100;
        s.completedAt = Date.now();
        s.results = agents.map((a: string) => ({
          agent: a,
          status: 'completed',
          result: `[MOCK] ${a} completed its portion of: "${body.objective.slice(0, 60)}"`,
        }));
      }
    }, 3000);
  }

  return c.json({ id, status: 'running', agents }, 201);
});

// Get swarm status
app.get('/api/swarm/:id', (c) => {
  const swarm = swarms.get(c.req.param('id'));
  if (!swarm) {
    return c.json({ error: 'Swarm not found', code: 'NOT_FOUND' }, 404);
  }
  return c.json(swarm);
});

// Memory search
app.get('/api/memory/search', async (c) => {
  const query = c.req.query('query');
  const limit = parseInt(c.req.query('limit') || '10', 10);

  if (!query) {
    return c.json({ error: 'query parameter is required', code: 'VALIDATION_ERROR' }, 400);
  }

  if (isMock) {
    return c.json({
      query,
      results: [
        { id: 'mem-1', content: `[MOCK] Memory matching "${query}"`, score: 0.95, type: 'task' },
        {
          id: 'mem-2',
          content: `[MOCK] Related memory for "${query}"`,
          score: 0.82,
          type: 'knowledge',
        },
      ],
      count: 2,
    });
  }

  try {
    const { ppmManager } = await import('../memory/unified-api.js');
    const results = await ppmManager.search(query, { limit });
    return c.json({ query, results, count: results?.length || 0 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return c.json({ error: message, code: 'MEMORY_ERROR' }, 500);
  }
});

// Stats
app.get('/api/stats', (c) => {
  return c.json({
    providers: PROVIDERS.length,
    agents: AGENTS.length,
    activeSwarms: [...swarms.values()].filter((s) => s.status === 'running').length,
    totalSwarms: swarms.size,
    uptime: Math.floor((Date.now() - startTime) / 1000),
    mock: isMock,
  });
});

// ── Start ────────────────────────────────────────────────────────────────

if (process.argv[1] && process.argv[1].endsWith('api-server.ts')) {
  const port = parseInt(process.env.PORT || '3001', 10);
  serve({ fetch: app.fetch, port }, () => {
    console.log(`\n  Ultra-Dex API Server`);
    console.log(`  ${isMock ? '[MOCK MODE]' : '[LIVE]'} http://localhost:${port}`);
    console.log(`  ${PROVIDERS.length} providers | ${AGENTS.length} agents\n`);
  });
}

export { app };
