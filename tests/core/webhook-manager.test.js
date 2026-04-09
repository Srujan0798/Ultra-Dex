import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { WebhookEndpoint, WebhookManager } from '../../src/core/infrastructure/webhook-manager.js';

function createResponse(status, body = 'ok') {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
  };
}

describe('WebhookManager', () => {
  it('registers shorthand event/url pairs and delivers normalized events', async () => {
    const requests = [];
    const manager = new WebhookManager({
      fetch: async (url, options) => {
        requests.push({
          url,
          headers: options.headers,
          body: JSON.parse(options.body),
        });
        return createResponse(202, 'accepted');
      },
      retryBaseDelayMs: 1,
    });

    const endpoint = manager.register('task.complete', 'https://example.com/webhook');
    const [result] = await manager.deliver('task:complete', { taskId: 'task-1' });

    assert.deepEqual(endpoint.events, ['task.complete']);
    assert.equal(result.status, 'delivered');
    assert.equal(result.attempts, 1);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url, 'https://example.com/webhook');
    assert.equal(requests[0].body.event, 'task.complete');
    assert.equal(requests[0].body.payload.taskId, 'task-1');
    assert.match(requests[0].headers['X-Webhook-Signature'], /^sha256=/);
  });

  it('retries failed deliveries with backoff before succeeding', async () => {
    let attempts = 0;
    const manager = new WebhookManager({
      fetch: async () => {
        attempts++;
        return attempts < 3 ? createResponse(503, 'retry') : createResponse(200, 'ok');
      },
      retryBaseDelayMs: 1,
    });

    manager.register('agent.error', 'https://example.com/retry');
    const [result] = await manager.deliver('agent-error', { agentId: 'agent-1' });
    const stats = manager.getStats();

    assert.equal(attempts, 3);
    assert.equal(result.status, 'delivered');
    assert.equal(result.attempts, 3);
    assert.equal(stats.stats.totalRetried, 2);
    assert.equal(stats.stats.totalDelivered, 1);
  });

  it('preserves prebuilt webhook endpoints and normalizes their event names', () => {
    const manager = new WebhookManager();
    const endpoint = new WebhookEndpoint({
      url: 'https://example.com/prebuilt',
      events: ['task:complete', 'agent-recovery'],
    });

    manager.register(endpoint);

    const storedEndpoint = manager.getEndpoint(endpoint.id);
    assert.equal(storedEndpoint, endpoint);
    assert.deepEqual(storedEndpoint.events, ['task.complete', 'agent.recovery']);
  });
});
