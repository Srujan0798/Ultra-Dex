var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { EventEmitter } from 'events';
let HealthCheck = class {
  constructor({ name, check, critical = false, intervalMs = 3e4, timeoutMs = 5e3 }) {
    this.name = name;
    this.check = check;
    this.critical = critical;
    this.intervalMs = intervalMs;
    this.timeoutMs = timeoutMs;
    this.status = 'unknown';
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
};
HealthCheck = __decorateClass([singleton()], HealthCheck);
let HealthService = class extends EventEmitter {
  constructor({
    appName = 'ultra-dex',
    version = '1.0.0',
    readinessChecks = [],
    deepChecks = [],
  } = {}) {
    super();
    this.appName = appName;
    this.version = version;
    this.checks = /* @__PURE__ */ new Map();
    this.readinessChecks = /* @__PURE__ */ new Map();
    this.deepChecks = /* @__PURE__ */ new Map();
    this.startTime = Date.now();
    this.running = false;
    for (const check of readinessChecks) {
      this.addReadinessCheck(check);
    }
    for (const check of deepChecks) {
      this.addDeepCheck(check);
    }
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
   * Register a readiness dependency check
   */
  addReadinessCheck(config) {
    const check =
      config instanceof HealthCheck ? config : new HealthCheck({ critical: true, ...config });
    this.readinessChecks.set(check.name, check);
    return this;
  }
  /**
   * Register a deep health dependency check
   */
  addDeepCheck(config) {
    const check =
      config instanceof HealthCheck ? config : new HealthCheck({ critical: true, ...config });
    this.deepChecks.set(check.name, check);
    return this;
  }
  async runChecks(checkMap) {
    const results = {};
    for (const [name, check] of checkMap) {
      results[name] = await check.run();
    }
    return results;
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
      check.run().then((r) => this.emit('check:completed', r));
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
    return this.runChecks(this.checks);
  }
  async checkReadinessDependencies() {
    return this.runChecks(this.readinessChecks);
  }
  async checkDeepDependencies() {
    return this.runChecks(this.deepChecks);
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
    const readinessResults = await this.checkReadinessDependencies();
    const serviceChecks = [...this.checks.values()];
    const dependencyChecks = [...this.readinessChecks.values()];
    const allChecks = [...serviceChecks, ...dependencyChecks];
    const criticalChecks = allChecks.filter((c) => c.critical);
    const allCriticalHealthy = criticalChecks.every((c) => c.status === 'healthy');
    const anyUnhealthy = allChecks.some((c) => c.status === 'unhealthy');
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
      checks: Object.fromEntries(allChecks.map((c) => [c.name, c.toJSON()])),
      probes: {
        service: results,
        readiness: readinessResults,
      },
      timestamp: Date.now(),
    };
  }
  /**
   * Deep readiness probe — verifies external infrastructure dependencies.
   */
  async deep() {
    const readiness = await this.readiness();
    const deepResults = await this.checkDeepDependencies();
    const deepChecks = [...this.deepChecks.values()];
    const deepHealthy = deepChecks.every((check) => check.status === 'healthy');
    const status = readiness.status === 'ready' && deepHealthy ? 'ready' : 'not_ready';
    return {
      ...readiness,
      status,
      deepChecks: Object.fromEntries(deepChecks.map((check) => [check.name, check.toJSON()])),
      probes: {
        ...readiness.probes,
        deep: deepResults,
      },
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
      deep: async (req, res) => {
        const result = await this.deep();
        const statusCode = result.status === 'ready' ? 200 : 503;
        res.status(statusCode).json(result);
      },
      full: async (req, res) => {
        const results = await this.deep();
        res.json({
          ...this.liveness(),
          checks: results.checks,
          probes: results.probes,
        });
      },
    };
  }
  registerRoutes(app, { basePath = '/health' } = {}) {
    const handlers = this.middleware();
    app.get(basePath, handlers.liveness);
    app.get(`${basePath}/ready`, handlers.readiness);
    app.get(`${basePath}/deep`, handlers.deep);
    return app;
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
      healthy: checks.filter((c) => c.status === 'healthy').length,
      degraded: checks.filter((c) => c.status === 'degraded').length,
      unhealthy: checks.filter((c) => c.status === 'unhealthy').length,
      unknown: checks.filter((c) => c.status === 'unknown').length,
      checks: Object.fromEntries(checks.map((c) => [c.name, c.toJSON()])),
    };
  }
};
HealthService = __decorateClass([singleton()], HealthService);
var health_service_default = HealthService;
export { HealthCheck, HealthService, health_service_default as default };
