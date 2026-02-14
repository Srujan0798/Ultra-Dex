// Copyright (c) 2026 Ultra-Dex
// Circuit Breaker — Fault tolerance for external service calls (providers, APIs)

import { EventEmitter } from 'events';

/**
 * CircuitBreaker — implements the circuit breaker pattern
 * States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing)
 */
export class CircuitBreaker extends EventEmitter {
    constructor({
        name = 'default',
        failureThreshold = 5,
        resetTimeoutMs = 30000,
        halfOpenMaxAttempts = 3,
        successThreshold = 2,
        timeoutMs = 10000,
    } = {}) {
        super();
        this.name = name;
        this.failureThreshold = failureThreshold;
        this.resetTimeoutMs = resetTimeoutMs;
        this.halfOpenMaxAttempts = halfOpenMaxAttempts;
        this.successThreshold = successThreshold;
        this.timeoutMs = timeoutMs;

        this.state = 'CLOSED';
        this.failures = 0;
        this.successes = 0;
        this.halfOpenAttempts = 0;
        this.lastFailure = null;
        this.openedAt = null;
        this.stats = { total: 0, success: 0, failure: 0, rejected: 0, timeout: 0 };
    }

    /**
     * Execute a function through the circuit breaker
     */
    async execute(fn, fallback = null) {
        this.stats.total++;

        // Check if circuit should transition from OPEN to HALF_OPEN
        if (this.state === 'OPEN') {
            if (Date.now() - this.openedAt >= this.resetTimeoutMs) {
                this._transitionTo('HALF_OPEN');
            } else {
                this.stats.rejected++;
                this.emit('rejected', { name: this.name, state: this.state });
                if (fallback) return fallback();
                throw new Error(`Circuit breaker "${this.name}" is OPEN — requests rejected`);
            }
        }

        // HALF_OPEN: limit attempts
        if (this.state === 'HALF_OPEN') {
            if (this.halfOpenAttempts >= this.halfOpenMaxAttempts) {
                this.stats.rejected++;
                if (fallback) return fallback();
                throw new Error(`Circuit breaker "${this.name}" is HALF_OPEN — max attempts reached`);
            }
            this.halfOpenAttempts++;
        }

        // Execute with timeout
        try {
            const result = await this._withTimeout(fn(), this.timeoutMs);
            this._onSuccess();
            return result;
        } catch (error) {
            this._onFailure(error);
            if (fallback) return fallback();
            throw error;
        }
    }

    async _withTimeout(promise, ms) {
        return Promise.race([
            promise,
            new Promise((_, reject) => {
                setTimeout(() => {
                    this.stats.timeout++;
                    reject(new Error(`Timeout after ${ms}ms`));
                }, ms);
            }),
        ]);
    }

    _onSuccess() {
        this.stats.success++;
        this.failures = 0;

        if (this.state === 'HALF_OPEN') {
            this.successes++;
            if (this.successes >= this.successThreshold) {
                this._transitionTo('CLOSED');
            }
        }
    }

    _onFailure(error) {
        this.stats.failure++;
        this.failures++;
        this.lastFailure = { error: error.message, timestamp: Date.now() };

        if (this.state === 'HALF_OPEN') {
            this._transitionTo('OPEN');
        } else if (this.state === 'CLOSED' && this.failures >= this.failureThreshold) {
            this._transitionTo('OPEN');
        }
    }

    _transitionTo(newState) {
        const oldState = this.state;
        this.state = newState;

        if (newState === 'OPEN') {
            this.openedAt = Date.now();
            this.successes = 0;
            this.halfOpenAttempts = 0;
        } else if (newState === 'HALF_OPEN') {
            this.halfOpenAttempts = 0;
            this.successes = 0;
        } else if (newState === 'CLOSED') {
            this.failures = 0;
            this.successes = 0;
            this.halfOpenAttempts = 0;
            this.openedAt = null;
        }

        this.emit('state-change', { name: this.name, from: oldState, to: newState });
    }

    /**
     * Force the circuit to a specific state (for testing/admin)
     */
    forceState(state) {
        this._transitionTo(state);
    }

    /**
     * Get circuit breaker status
     */
    getStatus() {
        return {
            name: this.name,
            state: this.state,
            failures: this.failures,
            lastFailure: this.lastFailure,
            openedAt: this.openedAt,
            stats: { ...this.stats },
        };
    }
}

/**
 * CircuitBreakerRegistry — manages multiple circuit breakers
 */
export class CircuitBreakerRegistry {
    constructor(defaults = {}) {
        this.breakers = new Map();
        this.defaults = defaults;
    }

    /**
     * Get or create a circuit breaker
     */
    get(name, config = {}) {
        if (!this.breakers.has(name)) {
            this.breakers.set(name, new CircuitBreaker({ name, ...this.defaults, ...config }));
        }
        return this.breakers.get(name);
    }

    /**
     * Execute through a named circuit breaker
     */
    async execute(name, fn, fallback = null) {
        return this.get(name).execute(fn, fallback);
    }

    /**
     * Get dashboard of all circuit breakers
     */
    getDashboard() {
        const breakers = {};
        for (const [name, cb] of this.breakers) {
            breakers[name] = cb.getStatus();
        }
        return {
            total: this.breakers.size,
            open: [...this.breakers.values()].filter(b => b.state === 'OPEN').length,
            halfOpen: [...this.breakers.values()].filter(b => b.state === 'HALF_OPEN').length,
            closed: [...this.breakers.values()].filter(b => b.state === 'CLOSED').length,
            breakers,
        };
    }

    /**
     * Reset all circuit breakers
     */
    resetAll() {
        for (const cb of this.breakers.values()) {
            cb.forceState('CLOSED');
        }
    }
}

export default CircuitBreaker;
