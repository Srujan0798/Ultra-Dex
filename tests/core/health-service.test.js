import { describe, it } from 'node:test';
import assert from 'node:assert';
import { HealthService } from '../../src/core/system/health-service.js';

function createMockResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('HealthService', () => {
  it('returns liveness payload for /health', () => {
    const service = new HealthService({ version: '3.0.0' });
    const live = service.liveness();
    assert.equal(live.status, 'ok');
    assert.equal(live.version, '3.0.0');
    assert.ok(live.uptime >= 0);
  });

  it('marks /health/ready as ready when DI and memory checks pass', async () => {
    const service = new HealthService();
    service.addReadinessCheck({ name: 'di-resolved', check: async () => true });
    service.addReadinessCheck({ name: 'memory-initialized', check: async () => true });

    const readiness = await service.readiness();
    assert.equal(readiness.status, 'ready');
  });

  it('marks /health/ready as not_ready when memory check fails', async () => {
    const service = new HealthService();
    service.addReadinessCheck({ name: 'di-resolved', check: async () => true });
    service.addReadinessCheck({
      name: 'memory-initialized',
      check: async () => {
        throw new Error('not initialized');
      },
    });

    const readiness = await service.readiness();
    assert.equal(readiness.status, 'not_ready');
  });

  it('marks /health/deep as not_ready when Redis check fails', async () => {
    const service = new HealthService();
    service.addReadinessCheck({ name: 'di-resolved', check: async () => true });
    service.addReadinessCheck({ name: 'memory-initialized', check: async () => true });
    service.addDeepCheck({
      name: 'redis-connected',
      check: async () => {
        throw new Error('redis unavailable');
      },
    });
    service.addDeepCheck({ name: 'audit-db-writable', check: async () => true });
    service.addDeepCheck({ name: 'provider-reachable', check: async () => true });

    const deep = await service.deep();
    assert.equal(deep.status, 'not_ready');
  });

  it('returns 200 for deep middleware when all deep checks pass', async () => {
    const service = new HealthService();
    service.addReadinessCheck({ name: 'di-resolved', check: async () => true });
    service.addReadinessCheck({ name: 'memory-initialized', check: async () => true });
    service.addDeepCheck({ name: 'redis-connected', check: async () => true });
    service.addDeepCheck({ name: 'audit-db-writable', check: async () => true });
    service.addDeepCheck({ name: 'provider-reachable', check: async () => true });

    const res = createMockResponse();
    await service.middleware().deep({}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.status, 'ready');
  });
});
