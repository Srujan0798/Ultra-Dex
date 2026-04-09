import { describe, it, before } from 'node:test';
import assert from 'node:assert';

describe('PostHog Client', () => {
  let posthog;

  before(async () => {
    const module = await import('../../src/core/analytics/posthog-client.js');
    posthog = module.posthog;
  });

  it('should handle track in dev mode (no API key)', () => {
    // Should not throw in dev mode
    assert.doesNotThrow(() => {
      posthog.track('test_event', { property: 'value' }, 'user123');
    });
  });

  it('should handle identify in dev mode', () => {
    assert.doesNotThrow(() => {
      posthog.identify('user123', { email: 'test@example.com' });
    });
  });

  it('should handle flush in dev mode', async () => {
    await assert.doesNotReject(async () => {
      await posthog.flush();
    });
  });
});
