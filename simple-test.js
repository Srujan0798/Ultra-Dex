import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mock provider module before importing execution-controller
const mockModule = {
  createProvider: () => ({
    name: 'mock',
    generate: () => ({ content: 'mocked' })
  })
};

// Use import() to load after mocking
describe('simple', () => {
  it('should work', async () => {
    const { ExecutionController } = await import('./apps/cli/lib/autonomous/execution-controller.js');
    const controller = new ExecutionController({ provider: 'mock' });
    assert.ok(controller);
  });
});
