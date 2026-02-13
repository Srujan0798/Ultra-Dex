/**
 * Ultra-Dex Smart Router
 *
 * Intelligent provider selection with:
 *  - Strategy-based routing (fastest / cheapest / round-robin / fallback-chain)
 *  - Per-provider latency tracking (p50 / p95 / p99)
 *  - Circuit-breaker pattern (auto-disable unhealthy providers)
 *  - Cost-aware selection with budget limits
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function percentile(sorted, p) {
    if (sorted.length === 0) return 0;
    const idx = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, idx)];
}

function nowMs() {
    return Date.now();
}

// ---------------------------------------------------------------------------
// ProviderStats — latency + cost tracker per provider
// ---------------------------------------------------------------------------

class ProviderStats {
    constructor(windowSize = 100) {
        this.windowSize = windowSize;
        this.latencies = [];
        this.totalTokens = 0;
        this.totalCost = 0;
        this.requestCount = 0;
        this.errorCount = 0;
    }

    recordLatency(ms) {
        this.latencies.push(ms);
        if (this.latencies.length > this.windowSize) {
            this.latencies.shift();
        }
        this.requestCount++;
    }

    recordError() {
        this.errorCount++;
        this.requestCount++;
    }

    recordCost(tokens, cost) {
        this.totalTokens += tokens;
        this.totalCost += cost;
    }

    get p50() {
        return percentile(this._sorted(), 50);
    }

    get p95() {
        return percentile(this._sorted(), 95);
    }

    get p99() {
        return percentile(this._sorted(), 99);
    }

    get avgLatency() {
        if (this.latencies.length === 0) return 0;
        return this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
    }

    get errorRate() {
        return this.requestCount === 0 ? 0 : this.errorCount / this.requestCount;
    }

    snapshot() {
        return {
            p50: this.p50,
            p95: this.p95,
            p99: this.p99,
            avgLatency: Math.round(this.avgLatency),
            totalTokens: this.totalTokens,
            totalCost: Number(this.totalCost.toFixed(6)),
            requestCount: this.requestCount,
            errorCount: this.errorCount,
            errorRate: Number(this.errorRate.toFixed(4)),
        };
    }

    _sorted() {
        return [...this.latencies].sort((a, b) => a - b);
    }
}

// ---------------------------------------------------------------------------
// CircuitBreaker — per-provider health tracking
// ---------------------------------------------------------------------------

class CircuitBreaker {
    /**
     * @param {object} opts
     * @param {number} opts.failureThreshold  Consecutive failures before tripping (default 3)
     * @param {number} opts.resetTimeoutMs    How long to stay open before half-open (default 30 000)
     */
    constructor({ failureThreshold = 3, resetTimeoutMs = 30_000 } = {}) {
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.failures = 0;
        this.state = 'closed';          // closed | open | half-open
        this.lastFailureTime = 0;
    }

    get isAvailable() {
        if (this.state === 'closed') return true;
        if (this.state === 'open') {
            // Check if enough time has passed to try again
            if (nowMs() - this.lastFailureTime >= this.resetTimeoutMs) {
                this.state = 'half-open';
                return true;
            }
            return false;
        }
        // half-open — allow one attempt
        return true;
    }

    recordSuccess() {
        this.failures = 0;
        this.state = 'closed';
    }

    recordFailure() {
        this.failures++;
        this.lastFailureTime = nowMs();
        if (this.failures >= this.failureThreshold) {
            this.state = 'open';
        }
    }
}

// ---------------------------------------------------------------------------
// SmartRouter
// ---------------------------------------------------------------------------

export class SmartRouter {
    /**
     * @param {object} config
     * @param {'fastest'|'cheapest'|'round-robin'|'fallback-chain'} config.strategy
     * @param {string[]}  config.fallbackOrder   Provider names in priority order
     * @param {number}    config.budgetLimit     Max total cost before refusing requests
     * @param {object}    config.costPerToken    { providerName: costPerToken }
     * @param {object}    config.circuitBreaker  { failureThreshold, resetTimeoutMs }
     */
    constructor(config = {}) {
        this.strategy = config.strategy || 'fallback-chain';
        this.fallbackOrder = config.fallbackOrder || [];
        this.budgetLimit = config.budgetLimit ?? Infinity;
        this.costPerToken = config.costPerToken || {};
        this.cbConfig = config.circuitBreaker || {};

        /** @type {Map<string, { provider: object, stats: ProviderStats, breaker: CircuitBreaker }>} */
        this.entries = new Map();
        this._rrIndex = 0;
    }

    // -----------------------------------------------------------------------
    // Registration
    // -----------------------------------------------------------------------

    addProvider(name, provider) {
        this.entries.set(name, {
            provider,
            stats: new ProviderStats(),
            breaker: new CircuitBreaker(this.cbConfig),
        });

        // Auto-add to fallback order if not already present
        if (!this.fallbackOrder.includes(name)) {
            this.fallbackOrder.push(name);
        }
        return this;
    }

    removeProvider(name) {
        this.entries.delete(name);
        this.fallbackOrder = this.fallbackOrder.filter((n) => n !== name);
    }

    // -----------------------------------------------------------------------
    // Routing — select the best provider based on strategy
    // -----------------------------------------------------------------------

    selectProvider() {
        const available = this._availableProviders();
        if (available.length === 0) {
            throw new Error('SmartRouter: all providers are unavailable (circuit breakers open)');
        }

        switch (this.strategy) {
            case 'fastest':
                return this._selectFastest(available);
            case 'cheapest':
                return this._selectCheapest(available);
            case 'round-robin':
                return this._selectRoundRobin(available);
            case 'fallback-chain':
            default:
                return this._selectFallback(available);
        }
    }

    // -----------------------------------------------------------------------
    // Execute — route a request through the selected provider
    // -----------------------------------------------------------------------

    async route(method, args) {
        this._checkBudget();

        const candidates = this._availableProviders();
        if (candidates.length === 0) {
            throw new Error('SmartRouter: all providers are unavailable');
        }

        // Build ordered list based on strategy
        const ordered = this._orderedCandidates(candidates);

        let lastError;
        for (const name of ordered) {
            const entry = this.entries.get(name);
            if (!entry) continue;

            const start = nowMs();
            try {
                const result = await entry.provider[method](...args);
                const elapsed = nowMs() - start;

                // Record success metrics
                entry.stats.recordLatency(elapsed);
                entry.breaker.recordSuccess();

                // Estimate cost if we have a cost-per-token rate
                if (result && result.usage && this.costPerToken[name]) {
                    const tokens = (result.usage.promptTokens || 0) + (result.usage.completionTokens || 0);
                    const cost = tokens * this.costPerToken[name];
                    entry.stats.recordCost(tokens, cost);
                }

                return { result, provider: name, latencyMs: elapsed };
            } catch (err) {
                const elapsed = nowMs() - start;
                entry.stats.recordLatency(elapsed);
                entry.stats.recordError();
                entry.breaker.recordFailure();
                lastError = err;
                // Continue to next provider in the chain
            }
        }

        throw new Error(
            `SmartRouter: all providers failed. Last error: ${lastError?.message || 'unknown'}`
        );
    }

    // -----------------------------------------------------------------------
    // Metrics
    // -----------------------------------------------------------------------

    getStats(providerName) {
        const entry = this.entries.get(providerName);
        if (!entry) return null;
        return {
            ...entry.stats.snapshot(),
            circuitState: entry.breaker.state,
        };
    }

    getAllStats() {
        const result = {};
        for (const [name] of this.entries) {
            result[name] = this.getStats(name);
        }
        return result;
    }

    get totalCost() {
        let total = 0;
        for (const [, entry] of this.entries) {
            total += entry.stats.totalCost;
        }
        return Number(total.toFixed(6));
    }

    get totalRequests() {
        let total = 0;
        for (const [, entry] of this.entries) {
            total += entry.stats.requestCount;
        }
        return total;
    }

    // -----------------------------------------------------------------------
    // Internals
    // -----------------------------------------------------------------------

    _availableProviders() {
        const available = [];
        for (const [name, entry] of this.entries) {
            if (entry.breaker.isAvailable) {
                available.push(name);
            }
        }
        return available;
    }

    _orderedCandidates(available) {
        switch (this.strategy) {
            case 'fastest':
                return [...available].sort((a, b) => {
                    const sa = this.entries.get(a).stats;
                    const sb = this.entries.get(b).stats;
                    return sa.avgLatency - sb.avgLatency;
                });

            case 'cheapest':
                return [...available].sort((a, b) => {
                    const ca = this.costPerToken[a] ?? Infinity;
                    const cb = this.costPerToken[b] ?? Infinity;
                    return ca - cb;
                });

            case 'round-robin': {
                // Rotate through available providers
                const idx = this._rrIndex % available.length;
                this._rrIndex++;
                return [...available.slice(idx), ...available.slice(0, idx)];
            }

            case 'fallback-chain':
            default:
                // Use configured fallback order, filtered to available
                return this.fallbackOrder.filter((n) => available.includes(n));
        }
    }

    _selectFastest(available) {
        let best = available[0];
        let bestLatency = Infinity;
        for (const name of available) {
            const avg = this.entries.get(name).stats.avgLatency;
            if (avg < bestLatency) {
                bestLatency = avg;
                best = name;
            }
        }
        return best;
    }

    _selectCheapest(available) {
        let best = available[0];
        let bestCost = Infinity;
        for (const name of available) {
            const cost = this.costPerToken[name] ?? Infinity;
            if (cost < bestCost) {
                bestCost = cost;
                best = name;
            }
        }
        return best;
    }

    _selectRoundRobin(available) {
        const idx = this._rrIndex % available.length;
        this._rrIndex++;
        return available[idx];
    }

    _selectFallback(available) {
        for (const name of this.fallbackOrder) {
            if (available.includes(name)) return name;
        }
        return available[0];
    }

    _checkBudget() {
        if (this.totalCost >= this.budgetLimit) {
            throw new Error(
                `SmartRouter: budget limit reached ($${this.totalCost.toFixed(4)} / $${this.budgetLimit.toFixed(4)})`
            );
        }
    }
}

export { ProviderStats, CircuitBreaker };
export default SmartRouter;
