import { describe, it, before } from 'node:test';
import assert from 'node:assert';

describe('Monitoring Service', () => {
  let monitoring;

  before(async () => {
    const module = await import('../../src/core/system/monitoring.js');
    monitoring = module.monitoring;
  });

  it('should track HTTP requests', () => {
    monitoring.reset();
    monitoring.trackRequest(150); // 150ms
    monitoring.trackRequest(250); // 250ms

    const metrics = monitoring.getMetrics();
    assert.strictEqual(metrics.requests.total, 2);
    assert.strictEqual(metrics.latency.avg, 200);
  });

  it('should track AI provider calls', () => {
    monitoring.reset();
    monitoring.trackProviderCall('openai', 1000, 0.02, 800);
    monitoring.trackProviderCall('openai', 500, 0.01, 400, true); // with error

    const metrics = monitoring.getMetrics();
    assert.ok(metrics.providers.openai);
    assert.strictEqual(metrics.providers.openai.calls, 2);
    assert.strictEqual(metrics.providers.openai.errors, 1);
    assert.strictEqual(metrics.providers.openai.totalTokens, 1500);
  });

  it('should return metrics in Prometheus format', () => {
    monitoring.reset();
    monitoring.trackRequest(100);
    monitoring.trackProviderCall('anthropic', 200, 0.005, 500);

    const prometheus = monitoring.getPrometheusFormat();
    assert.ok(prometheus.includes('ultra_dex_http_requests_total'));
    assert.ok(prometheus.includes('ultra_dex_ai_requests_total{provider="anthropic"}'));
  });

  it('should return health status', async () => {
    const status = await monitoring.getHealthStatus();
    assert.ok(status);
    assert.ok(status.overall);
    assert.ok(status.timestamp);
  });
});
