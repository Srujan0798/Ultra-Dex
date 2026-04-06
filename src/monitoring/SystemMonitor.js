// src/monitoring/SystemMonitor.js — thin facade over HealthChecker, AlertManager, MetricsReporter, EngagementTracker
import { EventEmitter } from 'events';
import { UltraDex } from '../UltraDex.js';
import { HealthChecker } from './HealthChecker.js';
import { AlertManager } from './AlertManager.js';
import { MetricsReporter } from './MetricsReporter.js';
import { EngagementTracker } from './EngagementTracker.js';
import {
  registerAlias,
  registerSingleton,
  resolveFromContainer,
} from '../core/di/container.js';
import { DI_TOKENS } from '../core/di/tokens.js';

export class SystemMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    this.config = {
      checkInterval: config.checkInterval || 30000,
      alertThresholds: config.alertThresholds || this.getDefaultThresholds(),
      metricsRetention: config.metricsRetention || 30,
      performanceSampling: config.performanceSampling || 0.1,
      ...config
    };
    this.telemetry = config.telemetry || null;
    this.ultraDex = new UltraDex(config.ultraDex);
    this.monitoringInterval = null;

    this.healthChecker = new HealthChecker(this.ultraDex);
    this.metricsReporter = new MetricsReporter(this.config);
    this.alertManager = new AlertManager(() => this.metricsReporter.getLatestMetrics(), this.config.alertThresholds, this);
    this.engagementTracker = new EngagementTracker();

    // Backward-compat property aliases
    Object.defineProperty(this, 'metrics', { get: () => this.metricsReporter.metrics });
    Object.defineProperty(this, 'alerts', { get: () => this.alertManager.getAlerts() });
    Object.defineProperty(this, 'healthChecks', { get: () => this.healthChecker.healthChecks });
  }

  getDefaultThresholds() {
    return {
      responseTime: { warning: 500, critical: 1000 },
      errorRate: { warning: 0.01, critical: 0.05 },
      memoryUsage: { warning: 0.80, critical: 0.90 },
      cpuUsage: { warning: 0.80, critical: 0.90 },
      diskUsage: { warning: 0.85, critical: 0.95 },
      databaseConnections: { warning: 0.80, critical: 0.95 },
      cacheHitRate: { warning: 0.80, critical: 0.70 },
      agentResponseTime: { warning: 2000, critical: 5000 },
      memoryOperationTime: { warning: 500, critical: 1000 }
    };
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  async startMonitoring() {
    process.stdout.write('🚀 Starting system monitoring...\n');
    await this.healthChecker.initializeHealthChecks();
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.metricsReporter.collectMetrics(this);
        await this.healthChecker.checkHealth(this);
        await this.alertManager.evaluateAlerts();
      } catch (error) {
        process.stderr.write('Monitoring error: ' + error.message + '\n');
        void this.telemetry?.trackMetric?.(
          'monitoring.errors',
          1,
          { source: 'SystemMonitor' },
          { error: error.message }
        );
        this.emit('monitoring_error', error);
      }
    }, this.config.checkInterval);
    process.stdout.write('✅ System monitoring started\n');
    return this.monitoringInterval;
  }

  async stopMonitoring() {
    if (this.monitoringInterval) { clearInterval(this.monitoringInterval); this.monitoringInterval = null; }
  }

  async resetMetrics() { this.metricsReporter.resetMetrics(); this.alertManager.alerts.length = 0; }

  // ── Delegations ───────────────────────────────────────────────────────────────

  // MetricsReporter
  async initializeHealthChecks() { return this.healthChecker.initializeHealthChecks(); }
  async collectMetrics() { return this.metricsReporter.collectMetrics(this); }
  async getHistoricalMetrics(d) { return this.metricsReporter.getHistoricalMetrics(d); }
  async getTrendAnalysis() { return this.metricsReporter.getTrendAnalysis(); }
  analyzeTrend(v) { return this.metricsReporter.analyzeTrend(v); }
  async getComplianceStatus() { return this.metricsReporter.getComplianceStatus(); }
  async getSecurityStatus() { return this.metricsReporter.getSecurityStatus(); }
  async getPerformanceAnalysis() { return this.metricsReporter.getPerformanceAnalysis(); }
  async getCapacityAnalysis() { return this.metricsReporter.getCapacityAnalysis(); }
  async getProjectedCapacity() { return this.metricsReporter.getProjectedCapacity(); }
  getMetricValue(m, p) { return this.metricsReporter.getMetricValue(m, p); }
  calculateDaysToSaturation(v, s, m) { return this.metricsReporter.calculateDaysToSaturation(v, s, m); }
  async getScalingRecommendations() { return this.metricsReporter.getScalingRecommendations(); }
  async getBottleneckAnalysis() { return this.metricsReporter.getBottleneckAnalysis(); }
  async exportMetrics(fmt) { return this.metricsReporter.exportMetrics(fmt); }
  convertToCSV(r) { return this.metricsReporter.convertToCSV(r); }
  async generatePDFReport(r) { return this.metricsReporter.generatePDFReport(r); }
  convertToPrometheusFormat(r) { return this.metricsReporter.convertToPrometheusFormat(r); }
  async getDashboardMetrics() { return this.metricsReporter.getDashboardMetrics(); }
  async generateRecommendations() { return this.metricsReporter.generateRecommendations(); }
  async getSystemMetrics() { return this.metricsReporter.getSystemMetrics(); }
  getCPUUsage() { return this.metricsReporter.getCPUUsage(); }

  // HealthChecker
  async checkHealth() { return this.healthChecker.checkHealth(this); }
  async executeHealthCheck(c) { return this.healthChecker.executeHealthCheck(c); }
  async checkAPIHealth() { return this.healthChecker.checkAPIHealth(); }
  async checkDatabaseHealth() { return this.healthChecker.checkDatabaseHealth(); }
  async checkMemorySystemHealth() { return this.healthChecker.checkMemorySystemHealth(); }
  async checkAgentRegistryHealth() { return this.healthChecker.checkAgentRegistryHealth(); }
  async checkMCPServersHealth() { return this.healthChecker.checkMCPServersHealth(); }
  async getAPIHealth() { return this.healthChecker.getAPIHealth(); }
  async getAPIResponseTime() { return this.healthChecker.getAPIResponseTime(); }
  async getAPIUptime() { return this.healthChecker.getAPIUptime(); }
  async getRateLimitingStatus() { return this.healthChecker.getRateLimitingStatus(); }
  async getAuthStatus() { return this.healthChecker.getAuthStatus(); }
  async getEndpointHealth() { return this.healthChecker.getEndpointHealth(); }
  async getDatabaseHealth() { return this.healthChecker.getDatabaseHealth(); }
  async getSecurityHealth() { return this.healthChecker.getSecurityHealth(); }
  calculateSystemStatus(m, h) { return this.healthChecker.calculateSystemStatus(m, h); }

  // AlertManager
  async evaluateAlerts() { return this.alertManager.evaluateAlerts(); }
  async sendCriticalAlert(a) { return this.alertManager.sendCriticalAlert(a); }
  async sendWarningAlert(a) { return this.alertManager.sendWarningAlert(a); }
  async startAlertMonitoring() { return this.alertManager.startAlertMonitoring(); }

  // EngagementTracker
  async getUserEngagementMetrics() { return this.engagementTracker.getUserEngagementMetrics(); }
  async getAgentPerformanceMetrics() { return this.engagementTracker.getAgentPerformanceMetrics(); }
  async getMemorySystemMetrics() { return this.engagementTracker.getMemorySystemMetrics(); }

  // ── Composed (cross-class) methods ────────────────────────────────────────────

  async getOverallHealth() {
    return this.healthChecker.getOverallHealth(
      (days) => this.metricsReporter.getHistoricalMetrics(days),
      (values) => this.metricsReporter.analyzeTrend(values)
    );
  }

  async getHealthTrend() {
    return this.healthChecker.getHealthTrend(
      (days) => this.metricsReporter.getHistoricalMetrics(days),
      (values) => this.metricsReporter.analyzeTrend(values)
    );
  }

  async getRealTimeMetrics() {
    const currentMetrics = this.metricsReporter.getLatestMetrics();
    const healthStatus = await this.getOverallHealth();
    return { ...currentMetrics, health: healthStatus, timestamp: new Date().toISOString(), systemStatus: this.healthChecker.calculateSystemStatus(currentMetrics, healthStatus) };
  }

  async generatePerformanceReport() {
    const report = await this.metricsReporter.generatePerformanceReport(() => this.getOverallHealth());
    const allAlerts = this.alertManager.getAlerts();
    report.summary.alertsGenerated = allAlerts.length;
    report.summary.criticalAlerts = allAlerts.filter(a => a.severity === 'critical').length;
    report.summary.warningAlerts = allAlerts.filter(a => a.severity === 'warning').length;
    return report;
  }

  // getSystemHealthSummary and getSystemStatus no longer call each other (recursion guard).
  // getSystemStatus fetches component data directly without calling getSystemHealthSummary.

  async getSystemHealthSummary() {
    return {
      overallStatus: await this.getSystemStatus(),
      apiHealth: await this.healthChecker.getAPIHealth(),
      databaseHealth: await this.healthChecker.getDatabaseHealth(),
      securityHealth: await this.healthChecker.getSecurityHealth(),
      userEngagement: await this.engagementTracker.getUserEngagementMetrics(),
      agentPerformance: await this.engagementTracker.getAgentPerformanceMetrics(),
      memorySystem: await this.engagementTracker.getMemorySystemMetrics(),
      generatedAt: new Date().toISOString()
    };
  }

  async getSystemStatus() {
    const [apiHealth, databaseHealth, securityHealth, userEngagement, agentPerformance, memorySystem] =
      await Promise.all([
        this.healthChecker.getAPIHealth(), this.healthChecker.getDatabaseHealth(),
        this.healthChecker.getSecurityHealth(), this.engagementTracker.getUserEngagementMetrics(),
        this.engagementTracker.getAgentPerformanceMetrics(), this.engagementTracker.getMemorySystemMetrics()
      ]);
    let score = 0;
    score += (apiHealth.status === 'healthy' ? 1 : 0) * 0.20;
    score += (databaseHealth.status === 'healthy' ? 1 : 0) * 0.20;
    score += (securityHealth.status === 'secure' ? 1 : 0) * 0.20;
    score += (userEngagement.satisfaction.csat / 5.0) * 0.15;
    score += agentPerformance.successRate * 0.15;
    score += memorySystem.searchPerformance.successRate * 0.10;
    if (score >= 0.95) return 'excellent';
    if (score >= 0.85) return 'good';
    if (score >= 0.70) return 'fair';
    if (score >= 0.50) return 'poor';
    return 'critical';
  }
}

registerSingleton(
  SystemMonitor,
  (scopedContainer) =>
    new SystemMonitor({
      telemetry: scopedContainer.resolve(DI_TOKENS.telemetryService),
    })
);
registerAlias(DI_TOKENS.systemMonitor, SystemMonitor);

export const systemMonitor = resolveFromContainer(SystemMonitor);
export default SystemMonitor;
