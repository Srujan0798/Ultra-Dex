/**
 * @class InsightsEngine
 * Generates intelligent insights from collected metrics
 */

import { AlertManager } from './alerts.js';
import { TrendAnalyzer } from './trends.js';
import * as ss from 'simple-statistics';

export class InsightsEngine {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.alerts = new AlertManager(config, logger);
    this.trends = new TrendAnalyzer(config, logger);
    this.insights = [];
    this.thresholds = {
      errorRate: 0.05, // 5%
      performanceDrop: 0.2, // 20% drop
      costIncrease: 0.15, // 15% increase
      securityAlerts: 5, // per hour
    };
  }

  async initialize() {
    await this.alerts.initialize();
    await this.trends.initialize();
    this.logger.info('Insights Engine initialized');
  }

  async generateInsights(timeRange = '24h') {
    const insights = [];

    // Performance insights
    const perfInsights = await this.analyzePerformance(timeRange);
    insights.push(...perfInsights);

    // Cost insights
    const costInsights = await this.analyzeCosts(timeRange);
    insights.push(...costInsights);

    // Usage insights
    const usageInsights = await this.analyzeUsage(timeRange);
    insights.push(...usageInsights);

    // Security insights
    const securityInsights = await this.analyzeSecurity(timeRange);
    insights.push(...securityInsights);

    // Trend insights
    const trendInsights = await this.analyzeTrends(timeRange);
    insights.push(...trendInsights);

    this.insights = insights;
    return insights;
  }

  async analyzePerformance(timeRange) {
    const insights = [];
    const metrics = await this.getMetrics('performance', timeRange);

    if (metrics.length < 2) return insights;

    const responseTimes = metrics.map((m) => m.metrics.responseTime).filter((t) => t > 0);
    const errorRates = metrics.map((m) => m.metrics.errorRate).filter((r) => r >= 0);

    if (responseTimes.length > 0) {
      const avgResponseTime = ss.mean(responseTimes);
      const stdDev = ss.standardDeviation(responseTimes);

      if (avgResponseTime > 1000) {
        // > 1 second
        insights.push({
          type: 'performance',
          severity: 'warning',
          title: 'High Response Time',
          description: `Average response time is ${avgResponseTime.toFixed(2)}ms, which is above optimal levels.`,
          recommendation: 'Consider optimizing database queries or scaling resources.',
          metrics: { avgResponseTime, stdDev },
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (errorRates.length > 0) {
      const avgErrorRate = ss.mean(errorRates);
      if (avgErrorRate > this.thresholds.errorRate) {
        insights.push({
          type: 'performance',
          severity: 'error',
          title: 'High Error Rate',
          description: `Error rate of ${(avgErrorRate * 100).toFixed(2)}% exceeds threshold.`,
          recommendation: 'Investigate error logs and fix underlying issues.',
          metrics: { avgErrorRate },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  async analyzeCosts(timeRange) {
    const insights = [];
    const metrics = await this.getMetrics('costs', timeRange);

    if (metrics.length < 2) return insights;

    const aiCosts = metrics.map((m) => m.metrics.aiCosts).filter((c) => c > 0);
    const totalCosts = metrics.map((m) => m.metrics.totalCosts).filter((c) => c > 0);

    if (aiCosts.length > 1) {
      const recentAvg = ss.mean(aiCosts.slice(-7)); // Last 7 data points
      const earlierAvg = ss.mean(aiCosts.slice(0, -7));

      if (earlierAvg > 0 && (recentAvg - earlierAvg) / earlierAvg > this.thresholds.costIncrease) {
        insights.push({
          type: 'cost',
          severity: 'warning',
          title: 'Increasing AI Costs',
          description: `AI costs have increased by ${(((recentAvg - earlierAvg) / earlierAvg) * 100).toFixed(1)}% recently.`,
          recommendation: 'Review AI usage patterns and consider optimization strategies.',
          metrics: { recentAvg, earlierAvg, increase: recentAvg - earlierAvg },
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (totalCosts.length > 0) {
      const totalCost = totalCosts[totalCosts.length - 1];
      if (totalCost > 1000) {
        // Arbitrary threshold
        insights.push({
          type: 'cost',
          severity: 'info',
          title: 'High Operational Costs',
          description: `Total operational costs have reached $${totalCost.toFixed(2)}.`,
          recommendation: 'Consider cost optimization measures or budget adjustments.',
          metrics: { totalCost },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  async analyzeUsage(timeRange) {
    const insights = [];
    const cliMetrics = await this.getMetrics('cli', timeRange);
    const dashboardMetrics = await this.getMetrics('dashboard', timeRange);

    // CLI usage patterns
    if (cliMetrics.length > 0) {
      const avgCommands = ss.mean(cliMetrics.map((m) => m.metrics.commandsExecuted));
      if (avgCommands < 10) {
        // Low usage
        insights.push({
          type: 'usage',
          severity: 'info',
          title: 'Low CLI Usage',
          description: `Average of ${avgCommands.toFixed(1)} commands executed per period.`,
          recommendation: 'Consider user training or feature promotion.',
          metrics: { avgCommands },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Dashboard engagement
    if (dashboardMetrics.length > 0) {
      const avgUsers = ss.mean(dashboardMetrics.map((m) => m.metrics.activeUsers));
      if (avgUsers > 100) {
        // High engagement
        insights.push({
          type: 'usage',
          severity: 'info',
          title: 'High Dashboard Engagement',
          description: `Average of ${avgUsers.toFixed(0)} active users.`,
          recommendation: 'Excellent user engagement. Consider expanding features.',
          metrics: { avgUsers },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  async analyzeSecurity(timeRange) {
    const insights = [];
    const metrics = await this.getMetrics('security', timeRange);

    if (metrics.length > 0) {
      const avgAlerts = ss.mean(metrics.map((m) => m.metrics.securityAlerts));
      const authFailures = metrics.map((m) => m.metrics.authFailures);

      if (avgAlerts > this.thresholds.securityAlerts) {
        insights.push({
          type: 'security',
          severity: 'error',
          title: 'High Security Alert Volume',
          description: `Average of ${avgAlerts.toFixed(1)} security alerts per hour.`,
          recommendation: 'Review security logs and implement additional protections.',
          metrics: { avgAlerts },
          timestamp: new Date().toISOString(),
        });
      }

      if (authFailures.some((f) => f > 10)) {
        // Spike in failures
        insights.push({
          type: 'security',
          severity: 'warning',
          title: 'Authentication Failures Spike',
          description: 'Recent spike in authentication failures detected.',
          recommendation: 'Check for brute force attempts or credential issues.',
          metrics: { maxFailures: Math.max(...authFailures) },
          timestamp: new Date().toISOString(),
        });
      }
    }

    return insights;
  }

  async analyzeTrends(timeRange) {
    return this.trends.analyzeTrends(timeRange);
  }

  async getMetrics(component, timeRange) {
    // This would integrate with the collector
    // For now, return mock data
    return [];
  }

  getCurrentInsights() {
    return this.insights;
  }

  async shutdown() {
    await this.alerts.shutdown();
    await this.trends.shutdown();
    this.logger.info('Insights Engine shut down');
  }
}
