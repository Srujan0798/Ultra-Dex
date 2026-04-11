import { describe, it } from 'node:test';
import assert from 'node:assert';
import { performance } from 'node:perf_hooks';

describe('Performance: Core Module Benchmarks', () => {
  it('should initialize MonitoringService in <10ms', async () => {
    const { MonitoringService } = await import('../../src/core/system/monitoring.ts');
    const start = performance.now();
    const monitoring = new MonitoringService();
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 10, `MonitoringService init took ${elapsed.toFixed(2)}ms (target <10ms)`);
  });

  it('should track 1000 provider calls in <100ms', async () => {
    const { MonitoringService } = await import('../../src/core/system/monitoring.ts');
    const monitoring = new MonitoringService();
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      monitoring.trackProviderCall('test-provider', 100, 0.001, 50);
    }
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 100, `1000 trackProviderCall calls took ${elapsed.toFixed(2)}ms (target <100ms)`);
  });

  it('should generate Prometheus metrics in <5ms', async () => {
    const { MonitoringService } = await import('../../src/core/system/monitoring.ts');
    const monitoring = new MonitoringService();
    // Add some data
    for (let i = 0; i < 100; i++) {
      monitoring.trackProviderCall(`provider-${i % 5}`, 100, 0.001, 50);
    }
    const start = performance.now();
    monitoring.getPrometheusFormat();
    const elapsed = performance.now() - start;
    assert.ok(elapsed < 5, `getPrometheusFormat took ${elapsed.toFixed(2)}ms (target <5ms)`);
  });

  it('should execute Thompson Sampling provider selection in <1ms', async () => {
    const { ThompsonSamplingRouter } = await import('../../src/core/routing/bandit-router.ts');
    const router = new ThompsonSamplingRouter();
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      router.selectProvider({ task: 'test' });
    }
    const elapsed = performance.now() - start;
    const avg = elapsed / 100;
    assert.ok(avg < 1, `Thompson Sampling avg took ${avg.toFixed(3)}ms per selection (target <1ms)`);
  });

  it('should estimate cost in <1ms', async () => {
    const { CostEstimator } = await import('../../src/core/routing/cost-estimator.ts');
    const estimator = new CostEstimator();
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
      estimator.estimate({ provider: 'claude', taskComplexity: 'moderate' });
    }
    const elapsed = performance.now() - start;
    const avg = elapsed / 100;
    assert.ok(avg < 1, `Cost estimation avg took ${avg.toFixed(3)}ms (target <1ms)`);
  });

  it('should handle circuit breaker checks in <0.1ms', async () => {
    const { CircuitBreaker } = await import('../../src/core/routing/circuit-breaker.ts');
    const breaker = new CircuitBreaker({ provider: 'test' });
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      breaker.allowRequest();
    }
    const elapsed = performance.now() - start;
    const avg = elapsed / 1000;
    assert.ok(avg < 0.1, `Circuit breaker allowRequest avg took ${avg.toFixed(4)}ms (target <0.1ms)`);
  });
});
