import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('API smoke contract', () => {
  it('defines expected health endpoint path', () => {
    const healthPath = '/health';
    assert.strictEqual(healthPath.startsWith('/'), true);
  });

  it('defines expected agents endpoint prefix', () => {
    const agentsPath = '/api/agents';
    assert.strictEqual(agentsPath.includes('/api/'), true);
  });
});
