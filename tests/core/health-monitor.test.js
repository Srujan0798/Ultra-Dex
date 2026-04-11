import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { ProviderHealthMonitor } from '../../src/core/routing/health-monitor.js';

describe('ProviderHealthMonitor', () => {
  let monitor;

  beforeEach(() => {
    monitor = new ProviderHealthMonitor();
  });

  it('should mark healthy provider as isHealthy=true', () => {
    monitor.recordLatency('claude', 100);
    assert.strictEqual(monitor.isHealthy('claude'), true);
  });

  it('should mark DEGRADED at 20% error rate', () => {
    for (let i = 0; i < 7; i++) monitor.recordLatency('claude', 100);
    for (let i = 0; i < 3; i++) monitor.recordError('claude');

    const status = monitor.getStatus().get('claude');
    assert.strictEqual(status?.status, 'DEGRADED');
  });

  it('should mark UNHEALTHY at 50% error rate', () => {
    for (let i = 0; i < 4; i++) monitor.recordLatency('claude', 100);
    for (let i = 0; i < 6; i++) monitor.recordError('claude');

    const status = monitor.getStatus().get('claude');
    assert.strictEqual(status?.status, 'UNHEALTHY');
  });

  it('should exclude UNHEALTHY providers from routing', () => {
    monitor.recordError('claude');
    monitor.recordError('claude');
    monitor.recordLatency('claude', 100);
    monitor.recordError('claude');

    assert.strictEqual(monitor.checkHealth('claude'), false);
  });
});
