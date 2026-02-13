// Copyright (c) 2026 Ultra-Dex

/**
 * Core API Routes — Dashboard Data Endpoints
 *
 * Connects the Dashboard Analytics page to live data from:
 *   - Smart Router (strategies, provider health, latency)
 *   - Token Guard (budgets, costs, cache stats)
 *   - Agent Mesh (roles, tasks, coordination)
 *   - Agent Autopsy (incidents, health, post-mortems)
 *   - Memory system (unified stats, context windows)
 *   - Observability (traces, timelines, search)
 *
 * @module routes
 * @version 1.0.0
 */

import { Router } from 'express';

export function createRoutes({ router, tokenGuard, agentMesh, autopsy, memory, traceCollector }) {
    const api = Router();

    // ── Health & Meta ────────────────────────────────────────────────────────

    api.get('/health', (req, res) => {
        res.json({
            status: 'HEALTHY',
            version: '6.1.0',
            service: 'CORE-API',
            uptime: process.uptime(),
            timestamp: Date.now(),
        });
    });

    api.get('/meta', (req, res) => {
        res.json({
            name: 'Ultra-Dex',
            description: 'The Persistent Context & Orchestration Layer',
            version: '6.1.0',
            modules: {
                router: !!router,
                tokenGuard: !!tokenGuard,
                agentMesh: !!agentMesh,
                autopsy: !!autopsy,
                memory: !!memory,
                observability: !!traceCollector,
            },
        });
    });

    // ── Smart Router ─────────────────────────────────────────────────────────

    api.get('/router/status', (req, res) => {
        if (!router) return res.status(503).json({ error: 'Router not initialized' });
        try {
            const strategy = router.strategy || 'fastest';
            const providers = router.getProviderStats ? router.getProviderStats() : {};
            const healthMap = {};
            for (const [name, stats] of Object.entries(providers)) {
                healthMap[name] = {
                    healthy: stats.circuitBreaker ? !stats.circuitBreaker.isOpen : true,
                    latency: stats.latency || {},
                    requestCount: stats.requestCount || 0,
                    errorCount: stats.errorCount || 0,
                };
            }
            res.json({ strategy, providers: healthMap });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    api.post('/router/strategy', (req, res) => {
        if (!router) return res.status(503).json({ error: 'Router not initialized' });
        const { strategy } = req.body;
        const valid = ['fastest', 'cheapest', 'round-robin', 'fallback-chain'];
        if (!valid.includes(strategy)) {
            return res.status(400).json({ error: `Invalid strategy. Use: ${valid.join(', ')}` });
        }
        router.strategy = strategy;
        res.json({ strategy, applied: true });
    });

    api.get('/router/stats', (req, res) => {
        if (!router) return res.status(503).json({ error: 'Router not initialized' });
        try {
            res.json(router.getStats ? router.getStats() : {});
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── Token Guard ──────────────────────────────────────────────────────────

    api.get('/costs/dashboard', (req, res) => {
        if (!tokenGuard) return res.status(503).json({ error: 'TokenGuard not initialized' });
        try {
            res.json(tokenGuard.getDashboard());
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    api.get('/costs/forecast', (req, res) => {
        if (!tokenGuard) return res.status(503).json({ error: 'TokenGuard not initialized' });
        const windowMs = parseInt(req.query.window) || 3600000;
        res.json(tokenGuard.tracker.forecast(windowMs));
    });

    api.post('/costs/budget', (req, res) => {
        if (!tokenGuard) return res.status(503).json({ error: 'TokenGuard not initialized' });
        const { agentId, limit, global } = req.body;
        if (global) tokenGuard.setGlobalBudget(limit);
        else if (agentId) tokenGuard.setAgentBudget(agentId, limit);
        else return res.status(400).json({ error: 'Provide agentId or set global:true' });
        res.json({ applied: true });
    });

    api.get('/costs/cache', (req, res) => {
        if (!tokenGuard) return res.status(503).json({ error: 'TokenGuard not initialized' });
        res.json(tokenGuard.cache.getStats());
    });

    // ── Agent Mesh ───────────────────────────────────────────────────────────

    api.get('/agents', (req, res) => {
        if (!agentMesh) return res.status(503).json({ error: 'AgentMesh not initialized' });
        res.json(agentMesh.getDashboard());
    });

    api.get('/agents/roles', (req, res) => {
        if (!agentMesh) return res.status(503).json({ error: 'AgentMesh not initialized' });
        res.json(agentMesh.roles.list());
    });

    api.get('/agents/tasks', (req, res) => {
        if (!agentMesh) return res.status(503).json({ error: 'AgentMesh not initialized' });
        res.json(agentMesh.taskQueue.getStats());
    });

    api.post('/agents/register', (req, res) => {
        if (!agentMesh) return res.status(503).json({ error: 'AgentMesh not initialized' });
        const { agentId, role, capabilities, constraints } = req.body;
        if (!agentId || !role) return res.status(400).json({ error: 'agentId and role required' });
        agentMesh.registerAgent(agentId, { role, capabilities: capabilities || [], constraints: constraints || [] });
        res.json({ registered: true, agentId });
    });

    api.post('/agents/task', (req, res) => {
        if (!agentMesh) return res.status(503).json({ error: 'AgentMesh not initialized' });
        const { id, description, priority, requiredCapability, dependencies } = req.body;
        if (!id || !description) return res.status(400).json({ error: 'id and description required' });
        agentMesh.submitTask({ id, description, priority: priority || 5, requiredCapability, dependencies: dependencies || [] });
        res.json({ submitted: true, taskId: id });
    });

    // ── Agent Autopsy ────────────────────────────────────────────────────────

    api.get('/reliability/summary', (req, res) => {
        if (!autopsy) return res.status(503).json({ error: 'Autopsy not initialized' });
        try {
            res.json(autopsy.getStats());
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    api.get('/reliability/incidents', (req, res) => {
        if (!autopsy) return res.status(503).json({ error: 'Autopsy not initialized' });
        const limit = parseInt(req.query.limit) || 20;
        res.json(autopsy.getRecentFailures(limit));
    });

    api.get('/reliability/health/:agentId', (req, res) => {
        if (!autopsy) return res.status(503).json({ error: 'Autopsy not initialized' });
        res.json(autopsy.checkHealth(req.params.agentId));
    });

    api.get('/reliability/autopsy/:failureId', (req, res) => {
        if (!autopsy) return res.status(503).json({ error: 'Autopsy not initialized' });
        const report = autopsy.getAutopsy(req.params.failureId);
        if (!report) return res.status(404).json({ error: 'Autopsy not found' });
        res.json(report);
    });

    // ── Memory ───────────────────────────────────────────────────────────────

    api.get('/memory/stats', async (req, res) => {
        if (!memory) return res.status(503).json({ error: 'Memory not initialized' });
        try {
            res.json(memory.getStats());
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    api.post('/memory/store', async (req, res) => {
        if (!memory) return res.status(503).json({ error: 'Memory not initialized' });
        try {
            const result = await memory.store(req.body.context, req.body.options || {});
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    api.post('/memory/retrieve', async (req, res) => {
        if (!memory) return res.status(503).json({ error: 'Memory not initialized' });
        try {
            const result = await memory.retrieve(req.body.query, req.body.options || {});
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    api.post('/memory/graph', async (req, res) => {
        if (!memory) return res.status(503).json({ error: 'Memory not initialized' });
        try {
            const result = await memory.queryGraph(req.body.entity, req.body.options || {});
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // ── Observability ────────────────────────────────────────────────────────

    api.get('/traces', (req, res) => {
        if (!traceCollector) return res.status(503).json({ error: 'TraceCollector not initialized' });
        const limit = parseInt(req.query.limit) || 50;
        const status = req.query.status || null;
        res.json(traceCollector.list({ limit, status }));
    });

    api.get('/traces/:traceId', (req, res) => {
        if (!traceCollector) return res.status(503).json({ error: 'TraceCollector not initialized' });
        const trace = traceCollector.get(req.params.traceId);
        if (!trace) return res.status(404).json({ error: 'Trace not found' });
        res.json(trace);
    });

    api.get('/traces/:traceId/timeline', (req, res) => {
        if (!traceCollector) return res.status(503).json({ error: 'TraceCollector not initialized' });
        const timeline = traceCollector.getTimeline(req.params.traceId);
        if (!timeline) return res.status(404).json({ error: 'Trace not found' });
        res.json(timeline);
    });

    api.get('/observability/dashboard', (req, res) => {
        if (!traceCollector) return res.status(503).json({ error: 'TraceCollector not initialized' });
        res.json(traceCollector.getDashboard());
    });

    // ── Analytics (aggregated for dashboard) ─────────────────────────────────

    api.get('/analytics/overview', (req, res) => {
        const overview = {
            timestamp: Date.now(),
            router: router ? { strategy: router.strategy || 'fastest' } : null,
            costs: tokenGuard ? tokenGuard.getDashboard() : null,
            agents: agentMesh ? agentMesh.getDashboard() : null,
            reliability: autopsy ? (() => { try { return autopsy.getStats(); } catch { return null; } })() : null,
            traces: traceCollector ? traceCollector.getDashboard() : null,
        };
        res.json(overview);
    });

    return api;
}

export default createRoutes;
