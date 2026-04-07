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
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
import { singleton, inject } from "tsyringe";
import { DI_TOKENS } from '../di/tokens.js';
import {
  AlertSeverity
} from '../interfaces/IAlertManager.js';
import {
  ProviderFailoverStrategy,
  MemoryReliefStrategy,
  AgentRestartStrategy,
  CircuitBreakerStrategy,
  ScaleUpStrategy
} from './healing-strategies.js';
import { randomUUID } from "crypto";
let SiteReliabilityAgent = class {
  constructor(alerts, ai, telemetry, logger) {
    this.alerts = alerts;
    this.ai = ai;
    this.telemetry = telemetry;
    this.logger = logger;
    this.registerStrategies();
    this.setupAlertSubscription();
  }
  strategies = /* @__PURE__ */ new Map();
  healingHistory = [];
  maxHistory = 1e3;
  enabled = true;
  registerStrategies() {
    const strategies = [
      new ProviderFailoverStrategy(this.ai, this.logger),
      new MemoryReliefStrategy(this.logger),
      new AgentRestartStrategy(this.logger),
      new CircuitBreakerStrategy(this.logger),
      new ScaleUpStrategy(this.logger)
    ];
    for (const strategy of strategies) {
      this.strategies.set(strategy.name, strategy);
      this.logger.debug(`Registered healing strategy: ${strategy.name}`);
    }
  }
  setupAlertSubscription() {
    this.alerts.on("auto-heal:trigger", (alert) => {
      if (!this.enabled) {
        this.logger.debug("Auto-healing disabled, ignoring alert", { alertId: alert.id });
        return;
      }
      this.handleAutoHeal(alert).catch((error) => {
        this.logger.error("Auto-heal handler failed", error);
      });
    });
    this.logger.info("SiteReliabilityAgent subscribed to alerts");
  }
  async handleAutoHeal(alert) {
    const startTime = Date.now();
    this.logger.info(`Processing auto-heal for alert: ${alert.type}`, {
      alertId: alert.id,
      severity: alert.severity,
      source: alert.source
    });
    const applicableStrategies = Array.from(this.strategies.values()).filter((s) => s.canHandle(alert));
    if (applicableStrategies.length === 0) {
      this.logger.warn(`No healing strategy found for alert type: ${alert.type}`);
      this.telemetry.recordEvent({
        type: "self-heal:no-strategy",
        timestamp: Date.now(),
        data: {
          alertId: alert.id,
          alertType: alert.type
        }
      });
      if (alert.severity >= AlertSeverity.HIGH) {
        this.alerts.emitAlert({
          id: randomUUID(),
          type: "self-heal.escalation",
          severity: AlertSeverity.CRITICAL,
          timestamp: /* @__PURE__ */ new Date(),
          source: "SiteReliabilityAgent",
          message: `No healing strategy for ${alert.type}`,
          metrics: {},
          context: { originalAlert: alert }
        });
      }
      return;
    }
    for (const strategy of applicableStrategies) {
      const attempt = await this.executeStrategy(strategy, alert);
      if (attempt.result?.success) {
        this.logger.info(`Healing successful with strategy: ${strategy.name}`, {
          alertId: alert.id,
          action: attempt.result.action,
          duration: attempt.result.duration
        });
        this.telemetry.recordEvent({
          type: "self-heal:success",
          timestamp: Date.now(),
          data: {
            alertId: alert.id,
            alertType: alert.type,
            strategy: strategy.name,
            action: attempt.result.action,
            duration: attempt.result.duration
          }
        });
        return;
      } else {
        this.logger.warn(`Healing failed with strategy: ${strategy.name}`, {
          alertId: alert.id,
          error: attempt.result?.error
        });
      }
    }
    this.logger.error(`All healing strategies failed for alert: ${alert.type}`, void 0, {
      alertId: alert.id,
      strategies: applicableStrategies.map((s) => s.name)
    });
    this.telemetry.recordEvent({
      type: "self-heal:failure",
      timestamp: Date.now(),
      data: {
        alertId: alert.id,
        alertType: alert.type,
        strategies: applicableStrategies.map((s) => s.name),
        duration: Date.now() - startTime
      }
    });
    this.alerts.emitAlert({
      id: randomUUID(),
      type: "self-heal.escalation",
      severity: AlertSeverity.CRITICAL,
      timestamp: /* @__PURE__ */ new Date(),
      source: "SiteReliabilityAgent",
      message: `All healing strategies failed for ${alert.type}`,
      metrics: {},
      context: {
        originalAlert: alert,
        attemptedStrategies: applicableStrategies.map((s) => s.name)
      }
    });
  }
  async executeStrategy(strategy, alert) {
    const attempt = {
      id: randomUUID(),
      alertId: alert.id,
      strategyName: strategy.name,
      startTime: Date.now()
    };
    try {
      const result = await strategy.execute(alert);
      attempt.result = result;
      attempt.endTime = Date.now();
    } catch (error) {
      attempt.result = {
        success: false,
        action: "exception",
        error: error.message,
        duration: Date.now() - attempt.startTime
      };
      attempt.endTime = Date.now();
    }
    this.healingHistory.push(attempt);
    if (this.healingHistory.length > this.maxHistory) {
      this.healingHistory.shift();
    }
    return attempt;
  }
  /**
   * Enable/disable auto-healing
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    this.logger.info(`Auto-healing ${enabled ? "enabled" : "disabled"}`);
  }
  /**
   * Get healing statistics
   */
  getStats() {
    const byStrategy = {};
    for (const attempt of this.healingHistory) {
      if (!byStrategy[attempt.strategyName]) {
        byStrategy[attempt.strategyName] = { attempts: 0, successes: 0 };
      }
      byStrategy[attempt.strategyName].attempts++;
      if (attempt.result?.success) {
        byStrategy[attempt.strategyName].successes++;
      }
    }
    return {
      totalAttempts: this.healingHistory.length,
      successful: this.healingHistory.filter((h) => h.result?.success).length,
      failed: this.healingHistory.filter((h) => !h.result?.success).length,
      byStrategy
    };
  }
  /**
   * Get healing history
   */
  getHistory(limit = 100) {
    return this.healingHistory.slice(-limit);
  }
  /**
   * Check if a circuit is open (from CircuitBreakerStrategy)
   */
  isCircuitOpen(serviceId) {
    const circuitBreaker = this.strategies.get("circuit-breaker");
    return circuitBreaker?.isCircuitOpen(serviceId) || false;
  }
};
SiteReliabilityAgent = __decorateClass([
  singleton(),
  __decorateParam(0, inject(DI_TOKENS.AlertManager)),
  __decorateParam(1, inject(DI_TOKENS.AIMetaLayer)),
  __decorateParam(2, inject(DI_TOKENS.TelemetryService)),
  __decorateParam(3, inject(DI_TOKENS.Logger))
], SiteReliabilityAgent);
export {
  SiteReliabilityAgent
};
