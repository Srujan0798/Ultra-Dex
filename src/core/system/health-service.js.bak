// Copyright (c) 2026 Ultra-Dex
// Health Check Service — Liveness/readiness probes + dependency health monitoring

import { EventEmitter } from 'events';

/**
 * HealthCheck — a single health check probe
 */
export class HealthCheck {
    constructor({ name, check, critical = false, intervalMs = 30000, timeoutMs = 5000 }) {
        this.name = name;
        this.check = check;
        this.critical = critical;
        this.intervalMs = intervalMs;
        this.timeoutMs = timeoutMs;
        this.status = 'unknown'; // healthy | degraded | unhealthy | unknown
        this.lastCheck = null;
        this.lastError = null;
        this.latency = 0;
        this.consecutiveFailures = 0;
        this.timer = null;
    }

    async run() {
        const start = Date.now();
        try {
            const result = await Promise.race([
                this.check(),
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Health check timeout')), this.timeoutMs)
                ),
            ]);
            this.latency = Date.now() - start;
            this.lastCheck = Date.now();
            this.status = 'healthy';
            this.lastError = null;
            this.consecutiveFailures = 0;
            return { name: this.name, status: 'healthy', latency: this.latency, details: result };
        } catch (error) {
            this.latency = Date.now() - start;
            this.lastCheck = Date.now();
            this.consecutiveFailures++;
            this.lastError = error.message;
            this.status = this.consecutiveFailures >= 3 ? 'unhealthy' : 'degraded';
            return { name: this.name, status: this.status, error: error.message, latency: this.latency };
        }
    }

    toJSON() {
        return {
            name: this.name,
            status: this.status,
            critical: this.critical,
            lastCheck: this.lastCheck,
            lastError: this.lastError,
            latency: this.latency,
            consecutiveFailures: this.consecutiveFailures,
        };
    }
}

/**
 * HealthService — manages health checks for the entire system
 */
export class HealthService extends EventEmitter {
    constructor({ appName = 'ultra-dex', version = '1.0.0' } = {}) {
        super();
        this.appName = appName;
        this.version = version;
        this.checks = new Map();
        this.startTime = Date.now();
        this.running = false;
    }

    /**
     * Register a health check
     */
    addCheck(config) {
        const check = config instanceof HealthCheck ? config : new HealthCheck(config);
        this.checks.set(check.name, check);
        return this;
    }

    /**
     * Start periodic health checking
     */
    start() {
        this.running = true;
        for (const check of this.checks.values()) {
            check.timer = setInterval(async () => {
                const result = await check.run();
                this.emit('check:completed', result);
                if (result.status !== 'healthy') {
                    this.emit('check:unhealthy', result);
                }
            }, check.intervalMs);
            // Run immediately
            check.run().then(r => this.emit('check:completed', r));
        }
        this.emit('health:started');
    }

    /**
     * Stop periodic health checking
     */
    stop() {
        this.running = false;
        for (const check of this.checks.values()) {
            if (check.timer) {
                clearInterval(check.timer);
                check.timer = null;
            }
        }
        this.emit('health:stopped');
    }

    /**
     * Run all health checks now
     */
    async checkAll() {
        const results = {};
        for (const [name, check] of this.checks) {
            results[name] = await check.run();
        }
        return results;
    }

    /**
     * Liveness probe — is the process alive?
     */
    liveness() {
        return {
            status: 'ok',
            app: this.appName,
            version: this.version,
            uptime: Date.now() - this.startTime,
            timestamp: Date.now(),
        };
    }

    /**
     * Readiness probe — is the system ready to serve requests?
     */
    async readiness() {
        const results = await this.checkAll();
        const criticalChecks = [...this.checks.values()].filter(c => c.critical);
        const allCriticalHealthy = criticalChecks.every(c => c.status === 'healthy');
        const anyUnhealthy = [...this.checks.values()].some(c => c.status === 'unhealthy');

        let status;
        if (!allCriticalHealthy) {
            status = 'not_ready';
        } else if (anyUnhealthy) {
            status = 'degraded';
        } else {
            status = 'ready';
        }

        return {
            status,
            app: this.appName,
            version: this.version,
            uptime: Date.now() - this.startTime,
            checks: Object.fromEntries(
                [...this.checks.values()].map(c => [c.name, c.toJSON()])
            ),
            timestamp: Date.now(),
        };
    }

    /**
     * Express middleware for health endpoints
     */
    middleware() {
        return {
            liveness: (req, res) => {
                res.json(this.liveness());
            },
            readiness: async (req, res) => {
                const result = await this.readiness();
                const statusCode = result.status === 'not_ready' ? 503 : 200;
                res.status(statusCode).json(result);
            },
            full: async (req, res) => {
                const results = await this.checkAll();
                res.json({
                    ...this.liveness(),
                    checks: results,
                });
            },
        };
    }

    /**
     * Get compact dashboard
     */
    getDashboard() {
        const checks = [...this.checks.values()];
        return {
            app: this.appName,
            version: this.version,
            running: this.running,
            uptime: Date.now() - this.startTime,
            totalChecks: checks.length,
            healthy: checks.filter(c => c.status === 'healthy').length,
            degraded: checks.filter(c => c.status === 'degraded').length,
            unhealthy: checks.filter(c => c.status === 'unhealthy').length,
            unknown: checks.filter(c => c.status === 'unknown').length,
            checks: Object.fromEntries(checks.map(c => [c.name, c.toJSON()])),
        };
    }
}

export default HealthService;
