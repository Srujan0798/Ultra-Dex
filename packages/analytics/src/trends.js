/**
 * @class TrendAnalyzer
 * Analyzes performance trends and patterns
 */

import * as ss from 'simple-statistics';

export class TrendAnalyzer {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.trendCache = new Map();
  }

  async initialize() {
    this.logger.info('Trend Analyzer initialized');
  }

  async analyzeTrends(timeRange = '7d') {
    const insights = [];

    const metricsToAnalyze = [
      { component: 'performance', metric: 'responseTime' },
      { component: 'performance', metric: 'throughput' },
      { component: 'costs', metric: 'totalCosts' },
      { component: 'usage', metric: 'activeUsers' },
      { component: 'security', metric: 'alerts' },
    ];

    for (const { component, metric } of metricsToAnalyze) {
      try {
        const trend = await this.calculateTrend(component, metric, timeRange);
        if (trend.significance > 0.7) {
          // Only report significant trends
          insights.push({
            type: 'trend',
            severity: this.getTrendSeverity(trend),
            title: `${this.formatMetricName(metric)} ${trend.direction} Trend`,
            description: this.generateTrendDescription(trend, metric),
            recommendation: this.generateTrendRecommendation(trend, metric),
            metrics: {
              slope: trend.slope,
              significance: trend.significance,
              direction: trend.direction,
              changePercent: trend.changePercent,
            },
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        this.logger.error(`Failed to analyze trend for ${component}.${metric}`, error);
      }
    }

    return insights;
  }

  async calculateTrend(component, metric, timeRange) {
    const data = await this.getHistoricalData(component, metric, timeRange);
    if (data.length < 5) {
      return { slope: 0, significance: 0, direction: 'stable', changePercent: 0 };
    }

    // Perform linear regression
    const points = data.map((d, i) => [i, d.value]);
    const regression = ss.linearRegression(points);

    // Calculate R-squared for significance
    const rSquared = this.calculateRSquared(points, regression);

    // Determine direction
    const direction =
      regression.m > 0.01 ? 'increasing' : regression.m < -0.01 ? 'decreasing' : 'stable';

    // Calculate percentage change
    const firstValue = data[0].value;
    const lastValue = data[data.length - 1].value;
    const changePercent = firstValue !== 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

    return {
      slope: regression.m,
      significance: rSquared,
      direction,
      changePercent,
      firstValue,
      lastValue,
    };
  }

  calculateRSquared(points, regression) {
    const yMean = ss.mean(points.map((p) => p[1]));
    const totalSumSquares = points.reduce((sum, p) => sum + Math.pow(p[1] - yMean, 2), 0);
    const residualSumSquares = points.reduce((sum, p) => {
      const predicted = regression.m * p[0] + regression.b;
      return sum + Math.pow(p[1] - predicted, 2);
    }, 0);

    return totalSumSquares > 0 ? 1 - residualSumSquares / totalSumSquares : 0;
  }

  getTrendSeverity(trend) {
    if (trend.significance < 0.7) return 'low';

    const absChange = Math.abs(trend.changePercent);
    if (absChange > 50) return 'high';
    if (absChange > 20) return 'medium';
    return 'low';
  }

  generateTrendDescription(trend, metric) {
    const direction = trend.direction;
    const percent = Math.abs(trend.changePercent).toFixed(1);
    const metricName = this.formatMetricName(metric);

    return `${metricName} has been ${direction} by ${percent}% over the analyzed period with ${Math.round(trend.significance * 100)}% confidence.`;
  }

  generateTrendRecommendation(trend, metric) {
    const recommendations = {
      responseTime: {
        increasing: 'Consider optimizing queries, implementing caching, or scaling resources.',
        decreasing: 'Great! Performance is improving. Monitor to maintain this trend.',
        stable: 'Response times are stable. Continue monitoring for any changes.',
      },
      throughput: {
        increasing: 'Excellent throughput growth. Ensure resources can handle continued growth.',
        decreasing: 'Throughput is declining. Investigate bottlenecks and optimize performance.',
        stable: 'Throughput is stable. Monitor for opportunities to improve.',
      },
      totalCosts: {
        increasing: 'Costs are rising. Review usage patterns and implement cost controls.',
        decreasing: 'Costs are decreasing. Analyze what changes led to this improvement.',
        stable: 'Costs are stable. Look for optimization opportunities.',
      },
      activeUsers: {
        increasing: 'User growth is strong. Prepare for scaling and ensure capacity.',
        decreasing: 'User engagement is declining. Investigate causes and improve user experience.',
        stable: 'User base is stable. Focus on retention and growth strategies.',
      },
      alerts: {
        increasing:
          'Security alerts are increasing. Review security measures and investigate threats.',
        decreasing: 'Security alerts are decreasing. Security improvements are effective.',
        stable: 'Security alert levels are stable. Maintain current security posture.',
      },
    };

    return (
      recommendations[metric]?.[trend.direction] ||
      'Monitor this trend and take appropriate action.'
    );
  }

  formatMetricName(metric) {
    const names = {
      responseTime: 'Response Time',
      throughput: 'Throughput',
      totalCosts: 'Total Costs',
      activeUsers: 'Active Users',
      alerts: 'Security Alerts',
    };

    return names[metric] || metric;
  }

  async getHistoricalData(component, metric, timeRange) {
    // This would fetch from the metrics collector
    // For now, return mock data
    const days = this.parseTimeRange(timeRange);
    const data = [];
    const baseValue = this.getBaseValueForMetric(component, metric);

    for (let i = 0; i < days; i++) {
      const trend = this.getTrendForMetric(component, metric);
      const noise = (Math.random() - 0.5) * baseValue * 0.1; // 10% noise

      data.push({
        timestamp: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: Math.max(0, baseValue + trend * i + noise),
      });
    }

    return data;
  }

  getBaseValueForMetric(component, metric) {
    const bases = {
      'performance.responseTime': 500,
      'performance.throughput': 1000,
      'costs.totalCosts': 500,
      'usage.activeUsers': 50,
      'security.alerts': 2,
    };

    return bases[`${component}.${metric}`] || 100;
  }

  getTrendForMetric(component, metric) {
    const trends = {
      'performance.responseTime': 2,
      'performance.throughput': -1,
      'costs.totalCosts': 5,
      'usage.activeUsers': 3,
      'security.alerts': 0.1,
    };

    return trends[`${component}.${metric}`] || 0;
  }

  parseTimeRange(timeRange) {
    const match = timeRange.match(/^(\d+)([hdwm])$/);
    if (!match) return 7;

    const [, num, unit] = match;
    const number = parseInt(num);

    switch (unit) {
      case 'h':
        return Math.ceil(number / 24);
      case 'd':
        return number;
      case 'w':
        return number * 7;
      case 'm':
        return number * 30;
      default:
        return 7;
    }
  }

  async detectAnomalies(component, metric, timeRange) {
    const data = await this.getHistoricalData(component, metric, timeRange);
    if (data.length < 10) return [];

    const values = data.map((d) => d.value);
    const mean = ss.mean(values);
    const stdDev = ss.standardDeviation(values);

    const anomalies = [];
    const threshold = 3; // 3 standard deviations

    for (let i = 0; i < values.length; i++) {
      const zScore = Math.abs((values[i] - mean) / stdDev);
      if (zScore > threshold) {
        anomalies.push({
          index: i,
          timestamp: data[i].timestamp,
          value: values[i],
          zScore,
          expected: mean,
          deviation: values[i] - mean,
        });
      }
    }

    return anomalies;
  }

  async shutdown() {
    this.trendCache.clear();
    this.logger.info('Trend Analyzer shut down');
  }
}
