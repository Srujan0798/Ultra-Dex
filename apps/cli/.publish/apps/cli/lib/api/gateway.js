// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Ultra-Dex Cloud API Gateway
 * @module api/gateway
 * @description Express server with REST endpoints for agent execution,
 * planning, and real-time WebSocket communication.
 */

import express from 'express';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { createProvider, getDefaultProvider } from '../providers/index.js';
import { apiKeyAuth, createRateLimiter } from './auth.js';
import { startWebSocketServer } from './websocket.js';

const DEFAULT_CONTEXT_FILES = ['CONTEXT.md', 'IMPLEMENTATION-PLAN.md'];

/**
 * Read context files from the project directory
 * @api private
 * @async
 * @returns {Promise<Object>} Object with file names as keys and content as values
 */
async function readContextFiles() {
  const context = {};
  for (const file of DEFAULT_CONTEXT_FILES) {
    try {
      context[file] = await fs.readFile(path.resolve(process.cwd(), file), 'utf8');
    } catch (_error) {
      context[file] = null;
    }
  }
  return context;
}

/**
 * Execute an AI agent with the specified task
 * @api private
 * @async
 * @param {string} providerId - AI provider identifier (e.g., 'claude', 'openai')
 * @param {string} agentName - Name of the agent to execute
 * @param {string} task - Task description
 * @param {string} [extraContext] - Additional context for the agent
 * @returns {Promise<string>} Agent output
 * @throws {Error} If provider fails to generate response
 */
async function runAgent(providerId, agentName, task, extraContext) {
  try {
    const provider = createProvider(providerId, { agent: agentName });
    const systemPrompt = `You are @${agentName}. Execute the task with enterprise rigor.`;
    const userPrompt = extraContext
      ? `Context:\n${extraContext}\n\nTask:\n${task}`
      : `Task:\n${task}`;
    return await provider.generate(systemPrompt, userPrompt);
  } catch (error) {
    console.error(`[Agent:${agentName}] Execution error:`, error.message);
    throw error;
  }
}

/**
 * Start the Ultra-Dex API Gateway server
 * @api public
 * @async
 * @param {Object} options - Server configuration
 * @param {number} [options.port=3000] - Port to listen on
 * @param {boolean} [options.requireAuth=true] - Require API key authentication
 * @returns {Promise<{app: express.Application, server: http.Server, broadcast: Function, wss: WebSocketServer}>}
 * @example
 * const { server, app } = await startApiGateway({ port: 8080 });
 * console.log('Gateway running on port 8080');
 *
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Server is healthy
 *
 * /context:
 *   get:
 *     summary: Get project context files
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Context files content
 *
 * /agent/{name}/execute:
 *   post:
 *     summary: Execute an AI agent
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - name: name
 *         in: path
 *         required: true
 *         description: Agent name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               task:
 *                 type: string
 *                 required: true
 *               context:
 *                 type: string
 *     responses:
 *       200:
 *         description: Agent execution result
 *       400:
 *         description: Missing required task
 *       500:
 *         description: Agent execution failed
 *
 * /plan/generate:
 *   post:
 *     summary: Generate a step-by-step plan
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               objective:
 *                 type: string
 *                 required: true
 *               context:
 *                 type: string
 *     responses:
 *       200:
 *         description: Generated plan
 *       400:
 *         description: Missing required objective
 */
export async function startApiGateway({ port = 3000, requireAuth = true } = {}) {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const authMiddleware = apiKeyAuth({ allowAnonymous: !requireAuth });
  const rateLimiter = createRateLimiter();

  /**
   * @api {get} /health Health Check
   * @apiName GetHealth
   * @apiGroup System
   * @apiSuccess {String} status Server status
   * @apiSuccess {String} timestamp Current ISO timestamp
   */
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(rateLimiter);

  /**
   * @api {get} /context Get Context
   * @apiName GetContext
   * @apiGroup Context
   * @apiHeader {String} Authorization Bearer API key
   * @apiSuccess {Object} context Project context files
   */
  app.get('/context', authMiddleware, async (_req, res) => {
    try {
      const context = await readContextFiles();
      res.json({ context });
    } catch (error) {
      console.error('[Context] Error reading files:', error.message);
      res.status(500).json({ error: 'Failed to read context' });
    }
  });

  /**
   * @api {post} /agent/:name/execute Execute Agent
   * @apiName ExecuteAgent
   * @apiGroup Agents
   * @apiHeader {String} Authorization Bearer API key
   * @apiParam {String} name Agent name
   * @apiBody {String} task Task description
   * @apiBody {String} [context] Additional context
   * @apiSuccess {Boolean} ok Success status
   * @apiSuccess {String} agent Agent name
   * @apiSuccess {String} output Agent output
   */
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
      console.error(`[Agent:${agentName}] Error:`, error.message);
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  /**
   * @api {post} /plan/generate Generate Plan
   * @apiName GeneratePlan
   * @apiGroup Planning
   * @apiHeader {String} Authorization Bearer API key
   * @apiBody {String} objective Plan objective
   * @apiBody {String} [context] Additional context
   * @apiSuccess {Boolean} ok Success status
   * @apiSuccess {String} plan Generated plan
   */
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
      console.error('[Planner] Error:', error.message);
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
