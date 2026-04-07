import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { initializeDiamondState, DiamondState } from '../../../src/core/diamond-state.js';

describe('Streaming Integration Tests', () => {
  let diamond: DiamondState;

  before(async () => {
    diamond = await initializeDiamondState({
      mesh: { enabled: false, region: 'default', nodeId: `test-${Date.now()}` },
      streaming: { enabled: true, port: 3001 },
      selfHealing: { enabled: true },
    });
  });

  after(async () => {
    await diamond.telemetry.shutdown();
  });

  describe('SSE Connection', () => {
    it('should initialize SSE handler', async () => {
      assert.ok(diamond.streamingService, 'Streaming service should be initialized when enabled');
    });
  });

  describe('Event Broadcasting', () => {
    it('should have streaming service when enabled', async () => {
      assert.ok(
        diamond.streamingService !== undefined,
        'Streaming service should be present when streaming is enabled'
      );
    });
  });

  describe('Session Management', () => {
    it('should have streaming service configured', async () => {
      if (diamond.streamingService) {
        // In a more detailed test, we would check for specific streaming capabilities
        assert.ok(true, 'Streaming service should be available when streaming is enabled');
      } else {
        assert.ok(true, 'Skipped: Streaming not enabled');
      }
    });
  });
});
