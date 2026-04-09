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
var __decorateParam = (index, decorator) => (target, key) => decorator(target, key, index);
import { singleton, inject } from 'tsyringe';
import { EventEmitter } from 'events';
import { DI_TOKENS } from '../di/tokens.js';
import { AlertSeverity } from '../interfaces/IAlertManager.js';
import { randomUUID } from 'crypto';
let AlertManager = class extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.maxHistory = 1e3;
  }
  alertHistory = [];
  maxHistory;
  subscribers = /* @__PURE__ */ new Set();
  emitAlert(alert) {
    const completeAlert = {
      id: alert.id || randomUUID(),
      timestamp: alert.timestamp || /* @__PURE__ */ new Date(),
      ...alert,
    };
    this.alertHistory.push(completeAlert);
    if (this.alertHistory.length > this.maxHistory) {
      this.alertHistory.shift();
    }
    this.logAlert(completeAlert);
    this.emit('alert', completeAlert);
    this.subscribers.forEach((callback) => {
      try {
        callback(completeAlert);
      } catch (error) {
        this.logger.error('Alert subscriber failed', error);
      }
    });
    if (completeAlert.severity >= AlertSeverity.HIGH) {
      this.emit('auto-heal:trigger', completeAlert);
    }
    if (completeAlert.severity === AlertSeverity.CRITICAL) {
      this.emit('pager-duty:escalate', completeAlert);
    }
  }
  logAlert(alert) {
    const context = {
      alertId: alert.id,
      type: alert.type,
      source: alert.source,
      metrics: alert.metrics,
      context: alert.context,
    };
    switch (alert.severity) {
      case AlertSeverity.LOW:
        this.logger.debug(alert.message, context);
        break;
      case AlertSeverity.MEDIUM:
        this.logger.info(alert.message, context);
        break;
      case AlertSeverity.HIGH:
        this.logger.warn(alert.message, context);
        break;
      case AlertSeverity.CRITICAL:
        this.logger.error(alert.message, void 0, context);
        break;
    }
  }
  /**
   * Create and emit an alert with builder pattern
   */
  builder() {
    return new AlertBuilder(this);
  }
  getHistory(filter) {
    let result = [...this.alertHistory];
    if (filter?.type) {
      result = result.filter((a) => a.type === filter.type);
    }
    if (filter?.severity !== void 0) {
      result = result.filter((a) => a.severity === filter.severity);
    }
    if (filter?.since) {
      result = result.filter((a) => a.timestamp >= filter.since);
    }
    if (filter?.source) {
      result = result.filter((a) => a.source === filter.source);
    }
    return result;
  }
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  /**
   * Get alert statistics
   */
  getStats(timeRange) {
    let alerts = this.alertHistory;
    if (timeRange) {
      alerts = alerts.filter((a) => a.timestamp >= timeRange.start && a.timestamp <= timeRange.end);
    }
    const bySeverity = {
      [AlertSeverity.LOW]: 0,
      [AlertSeverity.MEDIUM]: 0,
      [AlertSeverity.HIGH]: 0,
      [AlertSeverity.CRITICAL]: 0,
    };
    const byType = {};
    for (const alert of alerts) {
      bySeverity[alert.severity]++;
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    }
    return {
      total: alerts.length,
      bySeverity,
      byType,
      autoHealed: alerts.filter((a) => a.context?.autoHealed).length,
    };
  }
  /**
   * Clear old alerts
   */
  prune(before) {
    const initialLength = this.alertHistory.length;
    this.alertHistory = this.alertHistory.filter((a) => a.timestamp >= before);
    return initialLength - this.alertHistory.length;
  }
};
AlertManager = __decorateClass(
  [singleton(), __decorateParam(0, inject(DI_TOKENS.Logger))],
  AlertManager
);
class AlertBuilder {
  constructor(manager) {
    this.manager = manager;
  }
  alert = {};
  type(type) {
    this.alert.type = type;
    return this;
  }
  severity(severity) {
    this.alert.severity = severity;
    return this;
  }
  message(message) {
    this.alert.message = message;
    return this;
  }
  source(source) {
    this.alert.source = source;
    return this;
  }
  metrics(metrics) {
    this.alert.metrics = metrics;
    return this;
  }
  context(context) {
    this.alert.context = context;
    return this;
  }
  emit() {
    if (!this.alert.type || !this.alert.message || this.alert.severity === void 0) {
      throw new Error('Alert must have type, message, and severity');
    }
    this.manager.emitAlert(this.alert);
  }
}
export { AlertBuilder, AlertManager };
