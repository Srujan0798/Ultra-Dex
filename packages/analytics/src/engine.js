/**
 * @class AnalyticsEngine
 * Core analytics engine for Ultra-Dex
 */

import { MetricsCollector } from './collector.js';
import { InsightsEngine } from './insights.js';
import { PredictiveAnalytics } from './predictive.js';
import winston from 'winston';

export class AnalyticsEngine {
  constructor(config = {}) {
    this.config = {
      enableMetrics: true,
      enableInsights: true,
      enablePredictive: true,
      retentionPeriod: 30, // days
      ...config,
    };

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'analytics.log' }),
      ],
    });

    this.collector = new MetricsCollector(this.config, this.logger);
    this.insights = new InsightsEngine(this.config, this.logger);
    this.predictive = new PredictiveAnalytics(this.config, this.logger);

    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      this.logger.info('Initializing Analytics Engine');

      await this.collector.initialize();
      await this.insights.initialize();
      await this.predictive.initialize();

      this.initialized = true;
      this.logger.info('Analytics Engine initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Analytics Engine', error);
      throw error;
    }
  }

  async collectMetrics(component, metrics) {
    if (!this.initialized) await this.initialize();
    return this.collector.collect(component, metrics);
  }

  async getInsights(timeRange = '24h') {
    if (!this.initialized) await this.initialize();
    return this.insights.generateInsights(timeRange);
  }

  async getPredictions(metricType, timeHorizon = '7d') {
    if (!this.initialized) await this.initialize();
    return this.predictive.predict(metricType, timeHorizon);
  }

  async getDashboardData() {
    if (!this.initialized) await this.initialize();

    const [metrics, insights, predictions] = await Promise.all([
      this.collector.getAggregatedMetrics(),
      this.insights.getCurrentInsights(),
      this.predictive.getAllPredictions(),
    ]);

    return {
      metrics,
      insights,
      predictions,
      timestamp: new Date().toISOString(),
    };
  }

  async shutdown() {
    if (!this.initialized) return;

    this.logger.info('Shutting down Analytics Engine');
    await this.collector.shutdown();
    await this.insights.shutdown();
    await this.predictive.shutdown();
    this.initialized = false;
  }
}
