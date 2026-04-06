// src/monitoring/AlertManager.js

export class AlertManager {
  constructor(getLatestMetrics, thresholds, emitter) {
    this.getLatestMetrics = getLatestMetrics;
    this.thresholds = thresholds;
    this.emitter = emitter;
    this.alerts = [];
  }

  async evaluateAlerts() {
    const currentMetrics = this.getLatestMetrics();
    if (!currentMetrics) return;

    const newAlerts = [];
    const ts = new Date().toISOString();

    // Response time thresholds
    const p95 = currentMetrics.performance?.responseTime?.p95;
    if (p95 !== undefined) {
      if (p95 > this.thresholds.responseTime.critical) {
        newAlerts.push({
          id: `alert-${Date.now()}-response-time-critical`,
          type: 'response_time', severity: 'critical',
          message: `Critical response time: ${p95}ms`,
          threshold: this.thresholds.responseTime.critical, actual: p95, timestamp: ts
        });
      } else if (p95 > this.thresholds.responseTime.warning) {
        newAlerts.push({
          id: `alert-${Date.now()}-response-time-warning`,
          type: 'response_time', severity: 'warning',
          message: `High response time: ${p95}ms`,
          threshold: this.thresholds.responseTime.warning, actual: p95, timestamp: ts
        });
      }
    }

    // Error rate thresholds
    const errorRate = currentMetrics.performance?.errorRate;
    if (errorRate !== undefined) {
      if (errorRate > this.thresholds.errorRate.critical) {
        newAlerts.push({
          id: `alert-${Date.now()}-error-rate-critical`,
          type: 'error_rate', severity: 'critical',
          message: `Critical error rate: ${(errorRate * 100).toFixed(2)}%`,
          threshold: this.thresholds.errorRate.critical, actual: errorRate, timestamp: ts
        });
      } else if (errorRate > this.thresholds.errorRate.warning) {
        newAlerts.push({
          id: `alert-${Date.now()}-error-rate-warning`,
          type: 'error_rate', severity: 'warning',
          message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
          threshold: this.thresholds.errorRate.warning, actual: errorRate, timestamp: ts
        });
      }
    }

    // Memory usage thresholds
    const memUsage = currentMetrics.system?.memory?.usage;
    if (memUsage !== undefined) {
      if (memUsage > this.thresholds.memoryUsage.critical) {
        newAlerts.push({
          id: `alert-${Date.now()}-memory-usage-critical`,
          type: 'memory_usage', severity: 'critical',
          message: `Critical memory usage: ${(memUsage * 100).toFixed(2)}%`,
          threshold: this.thresholds.memoryUsage.critical, actual: memUsage, timestamp: ts
        });
      } else if (memUsage > this.thresholds.memoryUsage.warning) {
        newAlerts.push({
          id: `alert-${Date.now()}-memory-usage-warning`,
          type: 'memory_usage', severity: 'warning',
          message: `High memory usage: ${(memUsage * 100).toFixed(2)}%`,
          threshold: this.thresholds.memoryUsage.warning, actual: memUsage, timestamp: ts
        });
      }
    }

    // CPU usage thresholds
    const cpuUsage = currentMetrics.system?.cpu?.usage;
    if (cpuUsage !== undefined) {
      if (cpuUsage > this.thresholds.cpuUsage.critical) {
        newAlerts.push({
          id: `alert-${Date.now()}-cpu-usage-critical`,
          type: 'cpu_usage', severity: 'critical',
          message: `Critical CPU usage: ${cpuUsage.toFixed(2)}%`,
          threshold: this.thresholds.cpuUsage.critical, actual: cpuUsage, timestamp: ts
        });
      } else if (cpuUsage > this.thresholds.cpuUsage.warning) {
        newAlerts.push({
          id: `alert-${Date.now()}-cpu-usage-warning`,
          type: 'cpu_usage', severity: 'warning',
          message: `High CPU usage: ${cpuUsage.toFixed(2)}%`,
          threshold: this.thresholds.cpuUsage.warning, actual: cpuUsage, timestamp: ts
        });
      }
    }

    this.alerts.push(...newAlerts);

    for (const alert of newAlerts) {
      this.emitter.emit('alert', alert);
      if (alert.severity === 'critical') {
        await this.sendCriticalAlert(alert);
      } else if (alert.severity === 'warning') {
        await this.sendWarningAlert(alert);
      }
    }
  }

  async sendCriticalAlert(alert) {
    process.stderr.write(`🚨 CRITICAL ALERT: ${alert.message}\n`);
  }

  async sendWarningAlert(alert) {
    process.stderr.write(`⚠️ WARNING: ${alert.message}\n`);
  }

  async startAlertMonitoring() {
    const alertInterval = setInterval(async () => {
      await this.evaluateAlerts();
    }, 60000);
    return alertInterval;
  }

  getAlerts() {
    return this.alerts;
  }
}
