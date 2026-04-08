import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert';

describe('Monitoring Service', () => {
  let monitoring;
  
  before(async () => {
    const module = await import('../../src/core/system/monitoring.js');
    monitoring = module.monitoring;
  });

  beforeEach(() => {
    // Reset monitoring state before each test
    monitoring.reset();
  });

  describe('Request Tracking', () => {
    it('should track requests', () => {
      monitoring.trackRequest(100);
      monitoring.trackRequest(200);
      monitoring.trackRequest(150);
      
      const metrics = monitoring.getMetrics();
      assert.strictEqual(metrics.requests.total, 3);
    });

    it('should track latency', () => {
      monitoring.trackRequest(100);
      monitoring.trackRequest(200);
      monitoring.trackRequest(300);
      
      const metrics = monitoring.getMetrics();
      assert.strictEqual(metrics.latency.avg, 200);
    });

    it('should calculate latency percentiles', () => {
      // Add 100 requests with known latencies
      for (let i = 1; i <= 100; i++) {
        monitoring.trackRequest(i * 10); // 10, 20, 30, ..., 1000
      }
      
      const metrics = monitoring.getMetrics();
      
      // p50 should be around 500ms
      assert.ok(metrics.latency.p50 >= 400 && metrics.latency.p50 <= 600);
      
      // p95 should be around 950ms
      assert.ok(metrics.latency.p95 >= 900 && metrics.latency.p95 <= 1000);
      
      // p99 should be around 990ms
      assert.ok(metrics.latency.p99 >= 980 && metrics.latency.p99 <= 1000);
    });
  });

  describe('Error Tracking', () => {
    it('should track errors', () => {
      monitoring.trackRequest(100);
      monitoring.trackError();
      monitoring.trackRequest(200);
      monitoring.trackError();
      
      const metrics = monitoring.getMetrics();
      assert.strictEqual(metrics.requests.errors, 2);
    });

    it('should calculate error rate', () => {
      monitoring.trackRequest(100);
      monitoring.trackError();
      monitoring.trackRequest(200);
      monitoring.trackRequest(300);
      
      const metrics = monitoring.getMetrics();
      assert.strictEqual(metrics.requests.total, 3);
      assert.strictEqual(metrics.requests.errors, 1);
      assert.strictEqual(metrics.requests.errorRate, 0.33); // 1/3 ≈ 0.33
    });
  });

  describe('Provider Tracking', () => {
    it('should track provider calls', () => {
      monitoring.trackProviderCall('openai', 1500, 0.045, 850);
      monitoring.trackProviderCall('anthropic', 2000, 0.060, 920);
      
      const metrics = monitoring.getMetrics();
      assert.ok(metrics.providers.openai);
      assert.ok(metrics.providers.anthropic);
    });

    it('should track provider metrics correctly', () => {
      monitoring.trackProviderCall('openai', 1500, 0.045, 850);
      monitoring.trackProviderCall('openai', 2000, 0.060, 950);
      
      const metrics = monitoring.getMetrics();
      const openai = metrics.providers.openai;
      
      assert.strictEqual(openai.calls, 2);
      assert.strictEqual(openai.totalTokens, 3500);
      assert.strictEqual(openai.totalCost, 0.11); // 0.045 + 0.060, rounded
      assert.strictEqual(openai.avgLatency, 900); // (850 + 950) / 2
    });

    it('should track provider errors', () => {
      monitoring.trackProviderCall('openai', 1500, 0.045, 850, false);
      monitoring.trackProviderCall('openai', 0, 0, 100, true); // error
      monitoring.trackProviderCall('openai', 2000, 0.060, 920, false);
      
      const metrics = monitoring.getMetrics();
      const openai = metrics.providers.openai;
      
      assert.strictEqual(openai.calls, 3);
      assert.strictEqual(openai.errors, 1);
      assert.strictEqual(openai.errorRate, 0.33); // 1/3
    });
  });

  describe('User Tracking', () => {
    it('should track user requests', () => {
      monitoring.trackUserRequest('user123', 1500);
      monitoring.trackUserRequest('user123', 2000);
      monitoring.trackUserRequest('user456', 1000);
      
      const user123 = monitoring.getUserMetrics('user123');
      const user456 = monitoring.getUserMetrics('user456');
      
      assert.strictEqual(user123.requests, 2);
      assert.strictEqual(user123.tokens, 3500);
      assert.strictEqual(user456.requests, 1);
      assert.strictEqual(user456.tokens, 1000);
    });

    it('should return empty metrics for unknown users', () => {
      const metrics = monitoring.getUserMetrics('unknown');
      assert.strictEqual(metrics.requests, 0);
      assert.strictEqual(metrics.tokens, 0);
    });
  });

  describe('Metrics Response', () => {
    it('should return complete metrics object', () => {
      monitoring.trackRequest(100);
      monitoring.trackError();
      monitoring.trackProviderCall('openai', 1500, 0.045, 850);
      monitoring.trackUserRequest('user123', 1500);
      
      const metrics = monitoring.getMetrics();
      
      // Check structure
      assert.ok(metrics.uptime >= 0);
      assert.ok(metrics.version);
      assert.ok(metrics.requests);
      assert.ok(metrics.latency);
      assert.ok(metrics.providers);
      assert.ok(metrics.memory);
      
      // Check requests
      assert.strictEqual(typeof metrics.requests.total, 'number');
      assert.strictEqual(typeof metrics.requests.errors, 'number');
      assert.strictEqual(typeof metrics.requests.errorRate, 'number');
      
      // Check latency
      assert.strictEqual(typeof metrics.latency.p50, 'number');
      assert.strictEqual(typeof metrics.latency.p95, 'number');
      assert.strictEqual(typeof metrics.latency.p99, 'number');
      assert.strictEqual(typeof metrics.latency.avg, 'number');
      
      // Check memory
      assert.strictEqual(typeof metrics.memory.heapUsed, 'number');
      assert.strictEqual(typeof metrics.memory.heapTotal, 'number');
      assert.strictEqual(typeof metrics.memory.rss, 'number');
    });

    it('should include uptime in seconds', () => {
      const metrics = monitoring.getMetrics();
      assert.ok(metrics.uptime >= 0);
      assert.strictEqual(typeof metrics.uptime, 'number');
    });

    it('should include version', () => {
      const metrics = monitoring.getMetrics();
      assert.strictEqual(metrics.version, '3.0.0');
    });
  });

  describe('Reset Functionality', () => {
    it('should reset all metrics', () => {
      monitoring.trackRequest(100);
      monitoring.trackError();
      monitoring.trackProviderCall('openai', 1500, 0.045, 850);
      monitoring.trackUserRequest('user123', 1500);
      
      monitoring.reset();
      
      const metrics = monitoring.getMetrics();
      assert.strictEqual(metrics.requests.total, 0);
      assert.strictEqual(metrics.requests.errors, 0);
      assert.strictEqual(Object.keys(metrics.providers).length, 0);
      
      const userMetrics = monitoring.getUserMetrics('user123');
      assert.strictEqual(userMetrics.requests, 0);
      assert.strictEqual(userMetrics.tokens, 0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero requests', () => {
      const metrics = monitoring.getMetrics();
      assert.strictEqual(metrics.requests.total, 0);
      assert.strictEqual(metrics.requests.errorRate, 0);
      assert.strictEqual(metrics.latency.avg, 0);
    });

    it('should handle large numbers of requests', () => {
      // Track 2000 requests (keeps last 1000 for percentiles)
      for (let i = 0; i < 2000; i++) {
        monitoring.trackRequest(Math.random() * 1000);
      }
      
      const metrics = monitoring.getMetrics();
      assert.strictEqual(metrics.requests.total, 2000);
      assert.ok(metrics.latency.p50 >= 0);
      assert.ok(metrics.latency.p95 >= 0);
      assert.ok(metrics.latency.p99 >= 0);
    });
  });
});
