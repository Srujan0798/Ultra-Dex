// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Cloud API Gateway
 * Express server with REST endpoints for agent execution and planning.
 */

import express from 'express';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { apiKeyAuth, createRateLimiter } from './auth.js';
import { startWebSocketServer } from './websocket.js';

const DEFAULT_CONTEXT_FILES = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md'];

async function readContextFiles() {
  const context = {};
  for (const file of DEFAULT_CONTEXT_FILES) {
    try {
      context[file] = await fs.readFile(path.resolve(process.cwd(), file), 'utf8');
    } catch {
      context[file] = null;
    }
  }
  return context;
}

async function runAgent(providerId, agentName, task, extraContext) {
  const provider = createProvider(providerId, { agent: agentName });
  const systemPrompt = `You are @${agentName}. Execute the task with enterprise rigor.`;
  const userPrompt = extraContext
    ? `Context:\n${extraContext}\n\nTask:\n${task}`
    : `Task:\n${task}`;
  return provider.generate(systemPrompt, userPrompt);
}

export async function startApiGateway({ port = 3000, requireAuth = true } = {}) {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const authMiddleware = apiKeyAuth({ allowAnonymous: !requireAuth });
  const rateLimiter = createRateLimiter();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(rateLimiter);

  app.get('/context', authMiddleware, async (_req, res) => {
    const context = await readContextFiles();
    res.json({ context });
  });

  app.post('/agent/:name/execute', authMiddleware, async (req, res) => {
    const agentName = req.params.name;
    const { task, context } = req.body || {};

    if (!task) {
      return res.status(400).json({ error: 'Task is required' });
    }

    try {
      const providerId = getDefaultProvider() || 'claude';
      const output = await runAgent(providerId, agentName, task, context);
      res.json({ ok: true, agent: agentName, output });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post('/plan/generate', authMiddleware, async (req, res) => {
    const { objective, context } = req.body || {};
    if (!objective) {
      return res.status(400).json({ error: 'Objective is required' });
    }

    try {
      const providerId = getDefaultProvider() || 'claude';
      const plan = await runAgent(
        providerId,
        'planner',
        `Generate a step-by-step plan for: ${objective}`,
        context
      );
      res.json({ ok: true, plan });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  const server = http.createServer(app);
  const { broadcast, wss } = startWebSocketServer(server);

  server.on('request', (req, _res) => {
    broadcast({
      type: 'request',
      path: req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  });

  await new Promise((resolve) => server.listen(port, resolve));

  return { app, server, broadcast, wss };
}
