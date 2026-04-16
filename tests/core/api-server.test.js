/**
 * Tests for src/core/server/api-server.ts
 * Tests the Hono-based API server routes and middleware
 */

import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';

// Mock MOCK_AI before importing
process.env.MOCK_AI = 'true';

let app;

describe('API Server', async () => {
  before(async () => {
    const mod = await import('../../src/core/server/api-server.ts');
    app = mod.app;
  });

  // ── Health ──────────────────────────────────────────────────────────────

  describe('GET /health', () => {
    it('returns status ok with version and uptime', async () => {
      const res = await app.request('/health');
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.status, 'ok');
      assert.equal(body.version, '2.0.0-alpha.0');
      assert.equal(typeof body.uptime, 'number');
      assert.equal(body.mock, true);
    });
  });

  // ── Providers ───────────────────────────────────────────────────────────

  describe('GET /api/providers', () => {
    it('returns all 13 providers', async () => {
      const res = await app.request('/api/providers');
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.count, 13);
      assert.equal(Array.isArray(body.providers), true);
      // Spot-check a few
      const names = body.providers.map((p) => p.name);
      assert.ok(names.includes('openai'));
      assert.ok(names.includes('anthropic'));
      assert.ok(names.includes('google'));
    });
  });

  // ── Agents ──────────────────────────────────────────────────────────────

  describe('GET /api/agents', () => {
    it('returns all 9 agents', async () => {
      const res = await app.request('/api/agents');
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.count, 9);
      assert.equal(Array.isArray(body.agents), true);
      const ids = body.agents.map((a) => a.id);
      assert.ok(ids.includes('planner'));
      assert.ok(ids.includes('backend'));
      assert.ok(ids.includes('reviewer'));
    });

    it('agents have required fields', async () => {
      const res = await app.request('/api/agents');
      const body = await res.json();
      for (const agent of body.agents) {
        assert.ok(agent.id, 'agent must have id');
        assert.ok(agent.name, 'agent must have name');
        assert.ok(agent.tier, 'agent must have tier');
        assert.ok(agent.description, 'agent must have description');
      }
    });
  });

  // ── Chat ────────────────────────────────────────────────────────────────

  describe('POST /api/chat', () => {
    it('returns mock response in mock mode', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Hello world' }],
        }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.content.includes('[MOCK]'));
      assert.ok(body.content.includes('Hello world'));
      assert.equal(body.mock, true);
      assert.equal(body.provider, 'openai');
      assert.equal(body.model, 'gpt-4o');
    });

    it('uses specified provider and model', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test' }],
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
        }),
      });
      const body = await res.json();
      assert.equal(body.provider, 'anthropic');
      assert.equal(body.model, 'claude-sonnet-4-20250514');
    });

    it('rejects empty messages', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [] }),
      });
      assert.equal(res.status, 400);
      const body = await res.json();
      assert.equal(body.code, 'VALIDATION_ERROR');
    });

    it('rejects missing messages field', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'hi' }),
      });
      assert.equal(res.status, 400);
    });

    it('rejects malformed JSON body', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'not json',
      });
      assert.equal(res.status, 400);
    });
  });

  // ── Agent Run ───────────────────────────────────────────────────────────

  describe('POST /api/agent/run', () => {
    it('runs agent in mock mode', async () => {
      const res = await app.request('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'backend', task: 'Build a REST API' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.agent, 'backend');
      assert.equal(body.status, 'completed');
      assert.ok(body.result.includes('[MOCK]'));
      assert.ok(body.result.includes('@Backend'));
    });

    it('accepts agent by name', async () => {
      const res = await app.request('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: '@Planner', task: 'Plan the sprint' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.agent, 'planner');
    });

    it('rejects unknown agent', async () => {
      const res = await app.request('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'nonexistent', task: 'do stuff' }),
      });
      assert.equal(res.status, 404);
      const body = await res.json();
      assert.equal(body.code, 'NOT_FOUND');
    });

    it('rejects missing agent or task', async () => {
      const res = await app.request('/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agent: 'backend' }),
      });
      assert.equal(res.status, 400);
      assert.equal((await res.json()).code, 'VALIDATION_ERROR');
    });
  });

  // ── Swarm ───────────────────────────────────────────────────────────────

  describe('POST /api/swarm', () => {
    it('creates a swarm and returns 201', async () => {
      const res = await app.request('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: 'Build a dashboard' }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.ok(body.id.startsWith('swarm-'));
      assert.equal(body.status, 'running');
      assert.deepEqual(body.agents, ['planner', 'backend', 'frontend', 'reviewer']);
    });

    it('accepts custom agents list', async () => {
      const res = await app.request('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: 'Security audit', agents: ['auth', 'reviewer'] }),
      });
      const body = await res.json();
      assert.deepEqual(body.agents, ['auth', 'reviewer']);
    });

    it('rejects missing objective', async () => {
      const res = await app.request('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 400);
    });
  });

  describe('GET /api/swarm/:id', () => {
    it('returns swarm status', async () => {
      // Create a swarm first
      const createRes = await app.request('/api/swarm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objective: 'Test lookup' }),
      });
      const { id } = await createRes.json();

      const res = await app.request(`/api/swarm/${id}`);
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.id, id);
      assert.equal(body.objective, 'Test lookup');
    });

    it('returns 404 for unknown swarm', async () => {
      const res = await app.request('/api/swarm/swarm-nonexistent');
      assert.equal(res.status, 404);
      assert.equal((await res.json()).code, 'NOT_FOUND');
    });
  });

  // ── Memory Search ─────────────────────────────────────────────────────

  describe('GET /api/memory/search', () => {
    it('returns mock results in mock mode', async () => {
      const res = await app.request('/api/memory/search?query=test&limit=5');
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.query, 'test');
      assert.equal(body.count, 2);
      assert.ok(Array.isArray(body.results));
    });

    it('rejects missing query parameter', async () => {
      const res = await app.request('/api/memory/search');
      assert.equal(res.status, 400);
      assert.equal((await res.json()).code, 'VALIDATION_ERROR');
    });
  });

  // ── Stats ───────────────────────────────────────────────────────────────

  describe('GET /api/stats', () => {
    it('returns system stats', async () => {
      const res = await app.request('/api/stats');
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.providers, 13);
      assert.equal(body.agents, 9);
      assert.equal(typeof body.activeSwarms, 'number');
      assert.equal(typeof body.totalSwarms, 'number');
      assert.equal(typeof body.uptime, 'number');
      assert.equal(body.mock, true);
    });
  });

  // ── CORS ────────────────────────────────────────────────────────────────

  describe('CORS middleware', () => {
    it('includes CORS headers', async () => {
      const res = await app.request('/health', {
        headers: { Origin: 'http://localhost:3000' },
      });
      // Hono cors() sets access-control-allow-origin
      const aclHeader = res.headers.get('access-control-allow-origin');
      assert.ok(aclHeader, 'Should have CORS header');
    });
  });
});
