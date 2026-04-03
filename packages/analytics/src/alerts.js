/**
 * @class AlertManager
 * Manages automated alerts and notifications
 */

export class AlertManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.alerts = new Map();
    this.subscriptions = new Map();
    this.alertHistory = [];
  }

  async initialize() {
    this.setupDefaultAlerts();
    this.logger.info('Alert Manager initialized');
  }

  setupDefaultAlerts() {
    // Performance alerts
    this.registerAlert('high-response-time', {
      type: 'performance',
      severity: 'warning',
      condition: (metrics) => metrics.responseTime > 2000, // 2 seconds
      message: 'Response time exceeds 2 seconds',
      threshold: 2000,
      cooldown: 300000, // 5 minutes
    });

    this.registerAlert('high-error-rate', {
      type: 'performance',
      severity: 'error',
      condition: (metrics) => metrics.errorRate > 0.1, // 10%
      message: 'Error rate exceeds 10%',
      threshold: 0.1,
      cooldown: 600000, // 10 minutes
    });

    // Cost alerts
    this.registerAlert('cost-spike', {
      type: 'cost',
      severity: 'warning',
      condition: (metrics) => metrics.costIncrease > 0.25, // 25% increase
      message: 'Cost increase exceeds 25%',
      threshold: 0.25,
      cooldown: 3600000, // 1 hour
    });

    this.registerAlert('high-daily-cost', {
      type: 'cost',
      severity: 'info',
      condition: (metrics) => metrics.dailyCost > 1000,
      message: 'Daily costs exceed $1000',
      threshold: 1000,
      cooldown: 86400000, // 24 hours
    });

    // Security alerts
    this.registerAlert('security-alert-spike', {
      type: 'security',
      severity: 'error',
      condition: (metrics) => metrics.alertsPerHour > 20,
      message: 'Security alerts exceed 20 per hour',
      threshold: 20,
      cooldown: 1800000, // 30 minutes
    });

    this.registerAlert('auth-failure-spike', {
      type: 'security',
      severity: 'warning',
      condition: (metrics) => metrics.authFailures > 10,
      message: 'Authentication failures exceed 10',
      threshold: 10,
      cooldown: 900000, // 15 minutes
    });

    // Usage alerts
    this.registerAlert('low-engagement', {
      type: 'usage',
      severity: 'info',
      condition: (metrics) => metrics.activeUsers < 5,
      message: 'Active users below 5',
      threshold: 5,
      cooldown: 3600000, // 1 hour
    });

    this.registerAlert('high-usage', {
      type: 'usage',
      severity: 'info',
      condition: (metrics) => metrics.activeUsers > 1000,
      message: 'Active users exceed 1000',
      threshold: 1000,
      cooldown: 1800000, // 30 minutes
    });
  }

  registerAlert(id, config) {
    this.alerts.set(id, {
      id,
      ...config,
      lastTriggered: null,
      active: false,
    });
  }

  subscribe(alertId, callback, userId = null) {
    if (!this.subscriptions.has(alertId)) {
      this.subscriptions.set(alertId, []);
    }

    this.subscriptions.get(alertId).push({
      callback,
      userId,
      subscribedAt: new Date().toISOString(),
    });
  }

  unsubscribe(alertId, callback) {
    const subs = this.subscriptions.get(alertId);
    if (subs) {
      const index = subs.findIndex((sub) => sub.callback === callback);
      if (index > -1) {
        subs.splice(index, 1);
      }
    }
  }

  async checkAlerts(metrics) {
    const triggeredAlerts = [];

    for (const [alertId, alert] of this.alerts) {
      try {
        if (this.shouldTriggerAlert(alert, metrics)) {
          const alertInstance = await this.triggerAlert(alert, metrics);
          triggeredAlerts.push(alertInstance);

          // Notify subscribers
          await this.notifySubscribers(alertId, alertInstance);
        }
      } catch (error) {
        this.logger.error(`Error checking alert ${alertId}`, error);
      }
    }

    return triggeredAlerts;
  }

  shouldTriggerAlert(alert, metrics) {
    // Check if condition is met
    if (!alert.condition(metrics)) {
      return false;
    }

    // Check cooldown period
    if (alert.lastTriggered) {
      const timeSinceLast = Date.now() - new Date(alert.lastTriggered).getTime();
      if (timeSinceLast < alert.cooldown) {
        return false;
      }
    }

    return true;
  }

  async triggerAlert(alert, metrics) {
    const alertInstance = {
      id: alert.id,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      metrics,
      threshold: alert.threshold,
      timestamp: new Date().toISOString(),
      resolved: false,
    };

    alert.lastTriggered = alertInstance.timestamp;
    alert.active = true;

    this.alertHistory.push(alertInstance);

    this.logger.warn(`Alert triggered: ${alert.id} - ${alert.message}`, {
      metrics,
      threshold: alert.threshold,
    });

    return alertInstance;
  }

  async notifySubscribers(alertId, alertInstance) {
    const subs = this.subscriptions.get(alertId);
    if (!subs) return;

    const notifications = subs.map(async (sub) => {
      try {
        await sub.callback(alertInstance, sub.userId);
      } catch (error) {
        this.logger.error(`Error notifying subscriber for alert ${alertId}`, error);
      }
    });

    await Promise.all(notifications);
  }

  async resolveAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (alert && alert.active) {
      alert.active = false;

      // Update history
      const latestAlert = this.alertHistory
        .filter((a) => a.id === alertId && !a.resolved)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];

      if (latestAlert) {
        latestAlert.resolved = true;
        latestAlert.resolvedAt = new Date().toISOString();
      }

      this.logger.info(`Alert resolved: ${alertId}`);
    }
  }

  getActiveAlerts() {
    return Array.from(this.alerts.values())
      .filter((alert) => alert.active)
      .map((alert) => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        lastTriggered: alert.lastTriggered,
      }));
  }

  getAlertHistory(limit = 100) {
    return this.alertHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  async sendNotification(alertInstance, userId = null) {
    // This would integrate with notification systems
    // For now, just log
    const message = `[${alertInstance.severity.toUpperCase()}] ${alertInstance.message}`;
    this.logger.warn(message, {
      alertId: alertInstance.id,
      userId,
      timestamp: alertInstance.timestamp,
    });

    // Could send email, Slack, etc. here
  }

  async setupEmailNotifications(emailConfig) {
    this.emailConfig = emailConfig;
    // Setup email transport
  }

  async setupSlackNotifications(slackConfig) {
    this.slackConfig = slackConfig;
    // Setup Slack webhook
  }

  async generateAlertReport(timeRange = '24h') {
    const startTime = new Date(Date.now() - this.parseTimeRange(timeRange));

    const relevantAlerts = this.alertHistory.filter(
      (alert) => new Date(alert.timestamp) >= startTime
    );

    const report = {
      period: timeRange,
      totalAlerts: relevantAlerts.length,
      bySeverity: {},
      byType: {},
      topAlerts: [],
      timestamp: new Date().toISOString(),
    };

    // Group by severity
    relevantAlerts.forEach((alert) => {
      report.bySeverity[alert.severity] = (report.bySeverity[alert.severity] || 0) + 1;
    });

    // Group by type
    relevantAlerts.forEach((alert) => {
      report.byType[alert.type] = (report.byType[alert.type] || 0) + 1;
    });

    // Find most frequent alerts
    const alertFrequency = {};
    relevantAlerts.forEach((alert) => {
      alertFrequency[alert.id] = (alertFrequency[alert.id] || 0) + 1;
    });

    report.topAlerts = Object.entries(alertFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ id, count }));

    return report;
  }

  parseTimeRange(timeRange) {
    const match = timeRange.match(/^(\d+)([hdwm])$/);
    if (!match) return 24 * 60 * 60 * 1000; // 24 hours

    const [, num, unit] = match;
    const number = parseInt(num);

    switch (unit) {
      case 'h':
        return number * 60 * 60 * 1000;
      case 'd':
        return number * 24 * 60 * 60 * 1000;
      case 'w':
        return number * 7 * 24 * 60 * 60 * 1000;
      case 'm':
        return number * 30 * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  async shutdown() {
    this.alerts.clear();
    this.subscriptions.clear();
    this.logger.info('Alert Manager shut down');
  }
}
