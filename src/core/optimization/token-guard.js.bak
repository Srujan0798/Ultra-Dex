// Copyright (c) 2026 Ultra-Dex

/**
 * Token Guard — Intelligent Cost Optimization for AI Agent Operations
 *
 * Enterprises burn millions in unnecessary token usage. Agents repeat work,
 * make redundant API calls, never cache. This module enforces cost discipline.
 *
 * Features:
 *   1. Budget enforcement — per-agent/session/global budgets with hard stops
 *   2. Response caching — LLM response deduplication (same-prompt → cached)
 *   3. Smart routing — cheaper model when cheaper is sufficient
 *   4. Token analytics — cost attribution per agent/model/workflow
 *   5. Usage forecasting — predict burn rate, alert before overspend
 *
 * ROI: "Reduce AI costs by 40-60% while improving reliability"
 *
 * @module TokenGuard
 * @version 1.0.0
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';

// ───────────────────────────────────────────────────────────────────────────
// Budget Manager — Hard budgets with alerts
// ───────────────────────────────────────────────────────────────────────────

export class BudgetManager {
    constructor(config = {}) {
        this.globalBudget = config.globalBudget || Infinity;
        this.agentBudgets = new Map();       // agentId → budget limit
        this.sessionBudgets = new Map();     // sessionId → budget limit
        this.spent = { global: 0 };
        this.agentSpent = new Map();         // agentId → amount spent
        this.sessionSpent = new Map();       // sessionId → amount spent
        this.alertThreshold = config.alertThreshold || 0.8; // Alert at 80% usage
        this.onAlert = config.onAlert || null;
        this.onBudgetExceeded = config.onBudgetExceeded || null;
    }

    setBudget(scope, id, limit) {
        if (scope === 'agent') this.agentBudgets.set(id, limit);
        else if (scope === 'session') this.sessionBudgets.set(id, limit);
        else if (scope === 'global') this.globalBudget = limit;
    }

    /**
     * Record cost and enforce budgets
     * @returns {{ allowed: boolean, reason?: string }}
     */
    record(cost, { agentId = null, sessionId = null } = {}) {
        // Check global budget
        if (this.spent.global + cost > this.globalBudget) {
            this._triggerExceeded('global', 'global', this.spent.global, this.globalBudget);
            return { allowed: false, reason: `Global budget exceeded ($${this.spent.global.toFixed(4)} / $${this.globalBudget.toFixed(2)})` };
        }

        // Check agent budget
        if (agentId && this.agentBudgets.has(agentId)) {
            const agentTotal = (this.agentSpent.get(agentId) || 0) + cost;
            const limit = this.agentBudgets.get(agentId);
            if (agentTotal > limit) {
                this._triggerExceeded('agent', agentId, agentTotal - cost, limit);
                return { allowed: false, reason: `Agent "${agentId}" budget exceeded ($${(agentTotal - cost).toFixed(4)} / $${limit.toFixed(2)})` };
            }
        }

        // Check session budget
        if (sessionId && this.sessionBudgets.has(sessionId)) {
            const sessionTotal = (this.sessionSpent.get(sessionId) || 0) + cost;
            const limit = this.sessionBudgets.get(sessionId);
            if (sessionTotal > limit) {
                this._triggerExceeded('session', sessionId, sessionTotal - cost, limit);
                return { allowed: false, reason: `Session budget exceeded` };
            }
        }

        // Record spending
        this.spent.global += cost;
        if (agentId) {
            this.agentSpent.set(agentId, (this.agentSpent.get(agentId) || 0) + cost);
        }
        if (sessionId) {
            this.sessionSpent.set(sessionId, (this.sessionSpent.get(sessionId) || 0) + cost);
        }

        // Check alert thresholds
        this._checkAlerts(agentId, sessionId);

        return { allowed: true };
    }

    getSpending(scope = 'global', id = null) {
        if (scope === 'global') return { spent: this.spent.global, budget: this.globalBudget, utilization: this.spent.global / this.globalBudget };
        if (scope === 'agent' && id) return { spent: this.agentSpent.get(id) || 0, budget: this.agentBudgets.get(id) || Infinity };
        if (scope === 'session' && id) return { spent: this.sessionSpent.get(id) || 0, budget: this.sessionBudgets.get(id) || Infinity };
        return null;
    }

    getAllSpending() {
        const agents = {};
        for (const [id, spent] of this.agentSpent) {
            agents[id] = { spent, budget: this.agentBudgets.get(id) || Infinity };
        }
        return { global: { spent: this.spent.global, budget: this.globalBudget }, agents };
    }

    _checkAlerts(agentId, sessionId) {
        const globalUtil = this.spent.global / this.globalBudget;
        if (globalUtil >= this.alertThreshold && this.onAlert) {
            this.onAlert({ scope: 'global', utilization: globalUtil, spent: this.spent.global, budget: this.globalBudget });
        }
    }

    _triggerExceeded(scope, id, spent, budget) {
        if (this.onBudgetExceeded) {
            this.onBudgetExceeded({ scope, id, spent, budget });
        }
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Response Cache — Deduplicates identical LLM calls
// ───────────────────────────────────────────────────────────────────────────

export class ResponseCache {
    constructor({ maxSize = 500, ttlMs = 300000 } = {}) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMs;
        this.cache = new Map();    // hash → { response, timestamp, hitCount }
        this.stats = { hits: 0, misses: 0, saves: 0, evictions: 0 };
    }

    _hash(model, messages) {
        const key = JSON.stringify({ model, messages });
        return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
    }

    get(model, messages) {
        const hash = this._hash(model, messages);
        const entry = this.cache.get(hash);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(hash);
            this.stats.misses++;
            return null;
        }

        entry.hitCount++;
        this.stats.hits++;
        return entry.response;
    }

    set(model, messages, response) {
        const hash = this._hash(model, messages);

        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldest = [...this.cache.entries()]
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
            if (oldest) {
                this.cache.delete(oldest[0]);
                this.stats.evictions++;
            }
        }

        this.cache.set(hash, {
            response,
            timestamp: Date.now(),
            hitCount: 0,
            model,
        });
        this.stats.saves++;
    }

    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            size: this.cache.size,
            maxSize: this.maxSize,
            hitRate: total > 0 ? Math.round((this.stats.hits / total) * 100) : 0,
        };
    }

    clear() {
        this.cache.clear();
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Cost Tracker — Attribution per agent/model/workflow
// ───────────────────────────────────────────────────────────────────────────

export class CostTracker {
    constructor() {
        this.records = [];
        this.byAgent = new Map();
        this.byModel = new Map();
        this.byWorkflow = new Map();
    }

    record({ agentId, model, workflow = 'default', promptTokens = 0, completionTokens = 0, costPerToken = 0 }) {
        const totalTokens = promptTokens + completionTokens;
        const cost = totalTokens * costPerToken;

        const entry = {
            agentId,
            model,
            workflow,
            promptTokens,
            completionTokens,
            totalTokens,
            cost,
            timestamp: Date.now(),
        };

        this.records.push(entry);
        if (this.records.length > 10000) this.records.shift();

        // Accumulate by dimensions
        this._accumulate(this.byAgent, agentId, entry);
        this._accumulate(this.byModel, model, entry);
        this._accumulate(this.byWorkflow, workflow, entry);

        return { cost, totalTokens };
    }

    _accumulate(map, key, entry) {
        if (!key) return;
        const existing = map.get(key) || { totalTokens: 0, totalCost: 0, requestCount: 0 };
        existing.totalTokens += entry.totalTokens;
        existing.totalCost += entry.cost;
        existing.requestCount++;
        map.set(key, existing);
    }

    getByAgent(agentId) { return this.byAgent.get(agentId) || { totalTokens: 0, totalCost: 0, requestCount: 0 }; }
    getByModel(model) { return this.byModel.get(model) || { totalTokens: 0, totalCost: 0, requestCount: 0 }; }

    getSummary() {
        const agents = Object.fromEntries(this.byAgent);
        const models = Object.fromEntries(this.byModel);
        const totalCost = [...this.byAgent.values()].reduce((sum, a) => sum + a.totalCost, 0);
        const totalTokens = [...this.byAgent.values()].reduce((sum, a) => sum + a.totalTokens, 0);

        return {
            totalCost: Math.round(totalCost * 1000000) / 1000000,
            totalTokens,
            totalRequests: this.records.length,
            agents,
            models,
        };
    }

    /**
     * Forecast burn rate based on recent usage
     */
    forecast(windowMs = 3600000) {
        const cutoff = Date.now() - windowMs;
        const recent = this.records.filter((r) => r.timestamp >= cutoff);
        if (recent.length === 0) return { burnRatePerHour: 0, projectedDailyCost: 0 };

        const windowCost = recent.reduce((sum, r) => sum + r.cost, 0);
        const windowTokens = recent.reduce((sum, r) => sum + r.totalTokens, 0);
        const hoursInWindow = windowMs / 3600000;
        const burnRatePerHour = windowCost / hoursInWindow;

        return {
            burnRatePerHour: Math.round(burnRatePerHour * 10000) / 10000,
            projectedDailyCost: Math.round(burnRatePerHour * 24 * 100) / 100,
            tokensPerHour: Math.round(windowTokens / hoursInWindow),
            recentRequests: recent.length,
        };
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Token Guard — Main entry point
// ───────────────────────────────────────────────────────────────────────────

export class TokenGuard extends EventEmitter {
    constructor(config = {}) {
        super();
        this.budget = new BudgetManager({
            globalBudget: config.globalBudget || 100,
            alertThreshold: config.alertThreshold || 0.8,
            onAlert: (info) => this.emit('budget:alert', info),
            onBudgetExceeded: (info) => this.emit('budget:exceeded', info),
        });

        this.cache = new ResponseCache({
            maxSize: config.cacheSize || 500,
            ttlMs: config.cacheTtlMs || 300000,
        });

        this.tracker = new CostTracker();

        // Model cost table (cost per token)
        this.modelCosts = config.modelCosts || {
            'gpt-4o': 0.000005,
            'gpt-4o-mini': 0.00000015,
            'claude-3.5-sonnet': 0.000003,
            'claude-3-haiku': 0.00000025,
            'gemini-2.0-flash': 0.0000001,
            'deepseek-r1': 0.00000055,
            'llama-3.3-70b': 0.0000002,
        };
    }

    /**
     * Guard a model call — cache check, budget check, cost tracking
     * @param {Object} params - { agentId, model, messages, sessionId, workflow }
     * @param {Function} callFn - The actual LLM call to make if not cached
     * @returns {Object} { result, cached, cost, budgetStatus }
     */
    async guard({ agentId, model, messages, sessionId = null, workflow = 'default' }, callFn) {
        // 1. Check cache first
        const cached = this.cache.get(model, messages);
        if (cached) {
            this.emit('cache:hit', { agentId, model });
            return { result: cached, cached: true, cost: 0, budgetStatus: { allowed: true } };
        }

        // 2. Estimate cost and check budget (rough pre-check)
        const costPerToken = this.modelCosts[model] || 0.000003;
        const estimatedTokens = JSON.stringify(messages).length / 4; // rough estimate
        const estimatedCost = estimatedTokens * costPerToken;

        const budgetCheck = this.budget.record(estimatedCost, { agentId, sessionId });
        if (!budgetCheck.allowed) {
            this.emit('budget:blocked', { agentId, model, reason: budgetCheck.reason });
            throw new Error(`TokenGuard: ${budgetCheck.reason}`);
        }

        // 3. Make the actual call
        const startTime = Date.now();
        const result = await callFn();
        const latencyMs = Date.now() - startTime;

        // 4. Record actual cost
        const promptTokens = result?.usage?.promptTokens || Math.round(estimatedTokens * 0.6);
        const completionTokens = result?.usage?.completionTokens || Math.round(estimatedTokens * 0.4);

        const tracked = this.tracker.record({
            agentId,
            model,
            workflow,
            promptTokens,
            completionTokens,
            costPerToken,
        });

        // 5. Cache the response
        this.cache.set(model, messages, result);

        this.emit('call:complete', {
            agentId,
            model,
            latencyMs,
            tokens: promptTokens + completionTokens,
            cost: tracked.cost,
        });

        return {
            result,
            cached: false,
            cost: tracked.cost,
            budgetStatus: budgetCheck,
            latencyMs,
        };
    }

    /**
     * Suggest a cheaper model for a given task
     */
    suggestModel(task = 'general', currentModel = 'gpt-4o') {
        const taskRoutes = {
            'simple-qa': 'gemini-2.0-flash',
            'summarization': 'claude-3-haiku',
            'code-review': 'claude-3.5-sonnet',
            'reasoning': 'deepseek-r1',
            'general': 'gpt-4o-mini',
            'creative': 'gpt-4o',
        };

        const suggested = taskRoutes[task] || 'gpt-4o-mini';
        const currentCost = this.modelCosts[currentModel] || 0.000003;
        const suggestedCost = this.modelCosts[suggested] || 0.000003;
        const savings = ((currentCost - suggestedCost) / currentCost * 100).toFixed(1);

        return {
            current: currentModel,
            suggested,
            currentCostPerToken: currentCost,
            suggestedCostPerToken: suggestedCost,
            percentSavings: parseFloat(savings),
        };
    }

    /**
     * Get a comprehensive cost dashboard
     */
    getDashboard() {
        return {
            budget: this.budget.getAllSpending(),
            cache: this.cache.getStats(),
            costs: this.tracker.getSummary(),
            forecast: this.tracker.forecast(),
            modelCosts: this.modelCosts,
        };
    }

    /**
     * Set budget for an agent
     */
    setAgentBudget(agentId, limit) {
        this.budget.setBudget('agent', agentId, limit);
    }

    /**
     * Set global budget
     */
    setGlobalBudget(limit) {
        this.budget.setBudget('global', null, limit);
    }
}

export default TokenGuard;
