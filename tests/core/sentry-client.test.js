import { describe, it, before } from 'node:test';
import assert from 'node:assert';

describe('Sentry Client', () => {
  let sentry;

  before(async () => {
    const module = await import('../../src/core/analytics/sentry-client.js');
    sentry = module.sentry;
  });

  it('should handle captureException in dev mode', () => {
    const error = new Error('Test error');
    assert.doesNotThrow(() => {
      sentry.captureException(error, { context: 'test' });
    });
  });

  it('should handle captureMessage in dev mode', () => {
    assert.doesNotThrow(() => {
      sentry.captureMessage('Test message', 'info');
    });
  });

  it('should handle setUser in dev mode', () => {
    assert.doesNotThrow(() => {
      sentry.setUser('user123', 'test@example.com');
    });
  });

  it('should handle shutdown in dev mode', async () => {
    const result = await sentry.shutdown(100);
    assert.strictEqual(typeof result, 'boolean');
  });
});
