import { AnalyticsEngine } from '../src/engine.js';
import assert from 'assert';

describe('AnalyticsEngine', () => {
  let analytics;

  before(async () => {
    analytics = new AnalyticsEngine({
      enableMetrics: true,
      enableInsights: true,
      enablePredictive: true,
    });
    await analytics.initialize();
  });

  after(async () => {
    await analytics.shutdown();
  });

  it('should initialize successfully', () => {
    assert(analytics.initialized);
  });

  it('should collect metrics', async () => {
    await analytics.collectMetrics('test', {
      responseTime: 500,
      errorRate: 0.02,
    });

    // Should not throw
    assert(true);
  });

  it('should generate insights', async () => {
    const insights = await analytics.getInsights('1h');
    assert(Array.isArray(insights));
  });

  it('should provide predictions', async () => {
    const prediction = await analytics.getPredictions('performance.responseTime');
    assert(prediction);
    assert(typeof prediction.prediction === 'number');
  });

  it('should provide dashboard data', async () => {
    const data = await analytics.getDashboardData();
    assert(data);
    assert(data.metrics);
    assert(data.insights);
    assert(data.predictions);
  });
});
