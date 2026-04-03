/**
 * @class PredictiveAnalytics
 * Provides predictive analytics for task optimization
 */

import * as ss from 'simple-statistics';
import { linearRegression } from 'simple-statistics';

export class PredictiveAnalytics {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.models = new Map();
  }

  async initialize() {
    this.logger.info('Predictive Analytics initialized');
  }

  async predict(metricType, timeHorizon = '7d') {
    const data = await this.getHistoricalData(metricType);
    if (data.length < 10) {
      return {
        prediction: null,
        confidence: 0,
        message: 'Insufficient historical data for prediction',
      };
    }

    const prediction = this.performPrediction(data, timeHorizon);

    return {
      metricType,
      timeHorizon,
      prediction: prediction.value,
      confidence: prediction.confidence,
      trend: prediction.trend,
      recommendations: this.generateRecommendations(metricType, prediction),
      timestamp: new Date().toISOString(),
    };
  }

  async getAllPredictions() {
    const predictions = {};

    const metricTypes = [
      'performance.responseTime',
      'performance.throughput',
      'costs.aiCosts',
      'costs.totalCosts',
      'usage.activeUsers',
      'security.alerts',
    ];

    for (const metricType of metricTypes) {
      try {
        predictions[metricType] = await this.predict(metricType);
      } catch (error) {
        this.logger.error(`Failed to predict ${metricType}`, error);
        predictions[metricType] = null;
      }
    }

    return predictions;
  }

  performPrediction(data, timeHorizon) {
    // Simple linear regression for trend prediction
    const points = data.map((d, i) => [i, d.value]);
    const regression = linearRegression(points);

    const horizonSteps = this.parseTimeHorizon(timeHorizon);
    const predictedValue = regression.m * (data.length + horizonSteps) + regression.b;

    // Calculate confidence based on R-squared and data variance
    const rSquared = this.calculateRSquared(points, regression);
    const variance = ss.variance(data.map((d) => d.value));
    const confidence = Math.min(rSquared * (variance > 0 ? 1 : 0.5), 1);

    // Determine trend
    const trend = regression.m > 0 ? 'increasing' : regression.m < 0 ? 'decreasing' : 'stable';

    return {
      value: Math.max(0, predictedValue), // Ensure non-negative
      confidence: confidence,
      trend: trend,
      rSquared: rSquared,
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

  generateRecommendations(metricType, prediction) {
    const recommendations = [];

    if (metricType.includes('responseTime') && prediction.trend === 'increasing') {
      recommendations.push({
        action: 'optimize_performance',
        description: 'Implement caching, query optimization, or scale resources',
        priority: prediction.confidence > 0.7 ? 'high' : 'medium',
      });
    }

    if (metricType.includes('costs') && prediction.trend === 'increasing') {
      recommendations.push({
        action: 'optimize_costs',
        description: 'Review usage patterns, implement cost controls, or switch providers',
        priority: prediction.confidence > 0.8 ? 'high' : 'medium',
      });
    }

    if (metricType.includes('throughput') && prediction.trend === 'decreasing') {
      recommendations.push({
        action: 'scale_resources',
        description: 'Increase server capacity or optimize resource allocation',
        priority: prediction.confidence > 0.6 ? 'medium' : 'low',
      });
    }

    if (metricType.includes('activeUsers') && prediction.trend === 'increasing') {
      recommendations.push({
        action: 'prepare_scaling',
        description: 'Plan for increased load and user growth',
        priority: 'low',
      });
    }

    return recommendations;
  }

  async getHistoricalData(metricType) {
    // This would fetch from the collector or database
    // For now, return mock data
    const days = 30;
    const data = [];

    for (let i = 0; i < days; i++) {
      const baseValue = this.getBaseValueForMetric(metricType);
      const trend = this.getTrendForMetric(metricType);
      const noise = (Math.random() - 0.5) * baseValue * 0.2; // 20% noise

      data.push({
        timestamp: new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000).toISOString(),
        value: Math.max(0, baseValue + trend * i + noise),
      });
    }

    return data;
  }

  getBaseValueForMetric(metricType) {
    const bases = {
      'performance.responseTime': 500,
      'performance.throughput': 1000,
      'costs.aiCosts': 100,
      'costs.totalCosts': 500,
      'usage.activeUsers': 50,
      'security.alerts': 2,
    };

    return bases[metricType] || 100;
  }

  getTrendForMetric(metricType) {
    const trends = {
      'performance.responseTime': 2, // Slowly increasing
      'performance.throughput': -1, // Slowly decreasing
      'costs.aiCosts': 5, // Increasing costs
      'costs.totalCosts': 10,
      'usage.activeUsers': 3, // Growing user base
      'security.alerts': 0.1, // Stable
    };

    return trends[metricType] || 0;
  }

  parseTimeHorizon(timeHorizon) {
    const match = timeHorizon.match(/^(\d+)([hdwm])$/);
    if (!match) return 7; // Default 7 days

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

  async shutdown() {
    this.models.clear();
    this.logger.info('Predictive Analytics shut down');
  }
}
