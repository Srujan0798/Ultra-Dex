var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if (decorator = decorators[i])
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result)
    __defProp(target, key, result);
  return result;
};
import { singleton } from "tsyringe";
import { EventEmitter } from "events";
let EvaluationLoop = class extends EventEmitter {
  constructor(options = {}) {
    super();
    this.interval = options.interval || 6e4;
    this.providers = options.providers || [];
    this.metrics = /* @__PURE__ */ new Map();
    this.evaluations = [];
    this.isRunning = false;
    this.timer = null;
  }
  start() {
    if (this.isRunning)
      return;
    this.isRunning = true;
    this.timer = setInterval(() => this.runEvaluation(), this.interval);
    this.emit("evaluation.started");
  }
  stop() {
    if (!this.isRunning)
      return;
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.emit("evaluation.stopped");
  }
  async runEvaluation() {
    const evaluation = {
      id: this.generateId(),
      timestamp: /* @__PURE__ */ new Date(),
      providers: [],
      metrics: {},
      summary: {}
    };
    this.emit("evaluation.start", evaluation);
    try {
      for (const provider of this.providers) {
        const providerResult = await this.evaluateProvider(provider);
        evaluation.providers.push(providerResult);
        this.updateMetrics(provider.name, providerResult);
      }
      evaluation.summary = this.calculateSummary(evaluation.providers);
      evaluation.status = "completed";
    } catch (error) {
      evaluation.error = error.message;
      evaluation.status = "failed";
      this.emit("evaluation.error", { evaluation, error });
    }
    this.evaluations.push(evaluation);
    this.emit("evaluation.complete", evaluation);
    if (this.evaluations.length > 100) {
      this.evaluations.shift();
    }
    return evaluation;
  }
  async evaluateProvider(provider) {
    const startTime = Date.now();
    const result = {
      provider: provider.name,
      timestamp: /* @__PURE__ */ new Date(),
      metrics: {}
    };
    try {
      const testPrompt = "Hello, respond with 'OK'";
      const response = await provider.complete(testPrompt);
      result.metrics.responseTime = Date.now() - startTime;
      result.metrics.responseLength = response.length;
      result.metrics.success = true;
      result.metrics.quality = this.assessQuality(response, testPrompt);
    } catch (error) {
      result.metrics.success = false;
      result.metrics.error = error.message;
      result.metrics.responseTime = Date.now() - startTime;
    }
    return result;
  }
  assessQuality(response, prompt) {
    let score = 0.5;
    if (response.toLowerCase().includes("ok"))
      score += 0.3;
    if (response.length > 0 && response.length < 100)
      score += 0.2;
    return Math.min(1, score);
  }
  updateMetrics(providerName, result) {
    if (!this.metrics.has(providerName)) {
      this.metrics.set(providerName, {
        totalEvaluations: 0,
        successCount: 0,
        avgResponseTime: 0,
        avgQuality: 0,
        lastEvaluation: null
      });
    }
    const metrics = this.metrics.get(providerName);
    metrics.totalEvaluations++;
    metrics.lastEvaluation = result.timestamp;
    if (result.metrics.success) {
      metrics.successCount++;
      const n = metrics.successCount;
      metrics.avgResponseTime = (metrics.avgResponseTime * (n - 1) + result.metrics.responseTime) / n;
      if (result.metrics.quality) {
        metrics.avgQuality = (metrics.avgQuality * (n - 1) + result.metrics.quality) / n;
      }
    }
    this.metrics.set(providerName, metrics);
  }
  calculateSummary(providerResults) {
    if (providerResults.length === 0)
      return {};
    const successful = providerResults.filter((r) => r.metrics.success);
    const avgResponseTime = successful.reduce((sum, r) => sum + r.metrics.responseTime, 0) / successful.length;
    const avgQuality = successful.reduce((sum, r) => sum + (r.metrics.quality || 0), 0) / successful.length;
    return {
      totalProviders: providerResults.length,
      successfulProviders: successful.length,
      successRate: successful.length / providerResults.length,
      avgResponseTime: avgResponseTime || 0,
      avgQuality: avgQuality || 0,
      timestamp: /* @__PURE__ */ new Date()
    };
  }
  getMetrics(providerName = null) {
    if (providerName) {
      return this.metrics.get(providerName);
    }
    return Object.fromEntries(this.metrics);
  }
  getRecentEvaluations(limit = 10) {
    return this.evaluations.slice(-limit).reverse();
  }
  generateId() {
    return `eval_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
};
EvaluationLoop = __decorateClass([
  singleton()
], EvaluationLoop);
var eval_loop_default = EvaluationLoop;
export {
  EvaluationLoop,
  eval_loop_default as default
};
