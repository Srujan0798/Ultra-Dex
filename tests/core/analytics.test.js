import { beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { enterpriseAnalytics } from '../../src/core/analytics/enterprise-analytics.js';

describe('EnterpriseAnalytics', () => {
  beforeEach(async () => {
    await enterpriseAnalytics.ensureInitialized();
  });

  it('tracks metrics', async () => {
    await enterpriseAnalytics.trackMetric('test.metric', 100);

    const metric = enterpriseAnalytics.getMetric('test.metric');
    assert.equal(metric.currentValue, 100);
  });

  it('generates a report without throwing when anomaly detection is still warming up', async () => {
    await enterpriseAnalytics.trackMetric('test.report', 50);

    const report = await enterpriseAnalytics.generateReport({ metrics: ['test.report'] });

    assert.ok(report.metrics['test.report']);
    assert.equal(report.metrics['test.report'].stats.latest, 50);
  });

  it('reports healthy status', () => {
    const health = enterpriseAnalytics.getHealth();
    assert.equal(health.status, 'healthy');
  });
});
