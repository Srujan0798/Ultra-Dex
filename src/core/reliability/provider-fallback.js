// Copyright (c) 2026 Ultra-Dex
// Provider Fallback — Automatic fail-over between AI providers with cost-aware routing

import { EventEmitter } from 'events';
import { CircuitBreaker } from './circuit-breaker.js';

/**
 * ProviderFallback — manages provider chains with automatic failover
 */
export class ProviderFallback extends EventEmitter {
    constructor({ strategy = 'priority', maxRetries = 2 } = {}) {
        super();
        this.providers = new Map(); // name → { config, circuitBreaker, stats }
        this.strategy = strategy; // 'priority' | 'round-robin' | 'cost-optimized' | 'latency-optimized'
        this.maxRetries = maxRetries;
        this.roundRobinIndex = 0;
        this.stats = { totalCalls: 0, failovers: 0, totalCost: 0 };
    }

    /**
     * Register a provider with priority and cost info
     */
    addProvider(name, {
        priority = 10,
        costPer1kTokens = 0.01,
        maxTokens = 8192,
        latencyMs = 500,
        execute = null,
        healthCheck = null,
        rateLimit = 100,
    } = {}) {
        this.providers.set(name, {
            name,
            priority,
            costPer1kTokens,
            maxTokens,
            latencyMs,
            execute: execute || (() => Promise.reject(new Error(`Provider "${name}" has no execute function`))),
            healthCheck,
            rateLimit,
            enabled: true,
            circuitBreaker: new CircuitBreaker({
                name: `provider-${name}`,
                failureThreshold: 3,
                resetTimeoutMs: 60000,
                timeoutMs: 30000,
            }),
            stats: { calls: 0, successes: 0, failures: 0, totalLatency: 0, totalCost: 0 },
        });

        this.emit('provider:added', { name, priority });
        return this;
    }

    /**
     * Remove a provider
     */
    removeProvider(name) {
        this.providers.delete(name);
    }

    /**
     * Enable/disable a provider
     */
    setEnabled(name, enabled) {
        const p = this.providers.get(name);
        if (p) p.enabled = enabled;
    }

    /**
     * Execute a request with automatic failover
     */
    async execute(request) {
        this.stats.totalCalls++;
        const chain = this._getProviderChain();

        let lastError = null;

        for (const provider of chain) {
            if (!provider.enabled) continue;

            try {
                const start = Date.now();
                const result = await provider.circuitBreaker.execute(
                    () => provider.execute(request),
                    null // No fallback at circuit breaker level — we handle it here
                );

                const latency = Date.now() - start;
                const tokenCost = (request.estimatedTokens || 1000) / 1000 * provider.costPer1kTokens;

                provider.stats.calls++;
                provider.stats.successes++;
                provider.stats.totalLatency += latency;
                provider.stats.totalCost += tokenCost;
                this.stats.totalCost += tokenCost;

                this.emit('execution:success', {
                    provider: provider.name,
                    latency,
                    cost: tokenCost,
                });

                return {
                    result,
                    provider: provider.name,
                    latency,
                    cost: tokenCost,
                    failedProviders: lastError ? [lastError.provider] : [],
                };
            } catch (error) {
                provider.stats.calls++;
                provider.stats.failures++;
                lastError = { provider: provider.name, error: error.message };
                this.stats.failovers++;

                this.emit('execution:failover', {
                    from: provider.name,
                    error: error.message,
                });
            }
        }

        // All providers failed
        this.emit('execution:allFailed', { lastError });
        throw new Error(
            `All providers failed. Last error from "${lastError?.provider}": ${lastError?.error}`
        );
    }

    /**
     * Get the ordered provider chain based on strategy
     */
    _getProviderChain() {
        const providers = [...this.providers.values()].filter(p => p.enabled);

        switch (this.strategy) {
            case 'priority':
                return providers.sort((a, b) => a.priority - b.priority);

            case 'round-robin': {
                const sorted = providers.sort((a, b) => a.priority - b.priority);
                this.roundRobinIndex = (this.roundRobinIndex + 1) % sorted.length;
                const rotated = [
                    ...sorted.slice(this.roundRobinIndex),
                    ...sorted.slice(0, this.roundRobinIndex),
                ];
                return rotated;
            }

            case 'cost-optimized':
                return providers.sort((a, b) => a.costPer1kTokens - b.costPer1kTokens);

            case 'latency-optimized': {
                return providers.sort((a, b) => {
                    const aAvg = a.stats.calls > 0 ? a.stats.totalLatency / a.stats.calls : a.latencyMs;
                    const bAvg = b.stats.calls > 0 ? b.stats.totalLatency / b.stats.calls : b.latencyMs;
                    return aAvg - bAvg;
                });
            }

            default:
                return providers;
        }
    }

    /**
     * Run health checks on all providers
     */
    async healthCheck() {
        const results = {};
        for (const [name, provider] of this.providers) {
            if (provider.healthCheck) {
                try {
                    await provider.healthCheck();
                    results[name] = { healthy: true };
                } catch (error) {
                    results[name] = { healthy: false, error: error.message };
                }
            } else {
                results[name] = { healthy: provider.circuitBreaker.state !== 'OPEN', inferred: true };
            }
        }
        return results;
    }

    /**
     * Get comprehensive dashboard
     */
    getDashboard() {
        const providers = {};
        for (const [name, p] of this.providers) {
            providers[name] = {
                enabled: p.enabled,
                priority: p.priority,
                costPer1kTokens: p.costPer1kTokens,
                circuitState: p.circuitBreaker.state,
                stats: {
                    ...p.stats,
                    avgLatency: p.stats.calls > 0 ? Math.round(p.stats.totalLatency / p.stats.calls) : 0,
                    successRate: p.stats.calls > 0
                        ? Math.round((p.stats.successes / p.stats.calls) * 100)
                        : 100,
                },
            };
        }

        return {
            strategy: this.strategy,
            totalProviders: this.providers.size,
            enabledProviders: [...this.providers.values()].filter(p => p.enabled).length,
            stats: { ...this.stats },
            providers,
        };
    }
}

export default ProviderFallback;
