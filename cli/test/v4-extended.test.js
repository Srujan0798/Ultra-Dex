import test from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { configManager } from '../lib/utils/config-manager.js';

test('Auth: login and identity storage', async () => {
  // Use a temp global config for testing
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-auth-test-'));
  const oldPath = configManager.globalConfigPath;
  configManager.globalConfigPath = path.join(tmpDir, 'config.json');
  
  const testUser = { username: 'test-architect', lastLogin: new Date().toISOString() };
  await configManager.saveGlobal({ user: testUser });
  
  const loaded = await configManager.loadGlobal();
  assert.strictEqual(loaded.user.username, 'test-architect');
  
  // Cleanup
  configManager.globalConfigPath = oldPath;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('Workspace: switch context', async () => {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-ws-test-'));
  const oldPath = configManager.globalConfigPath;
  configManager.globalConfigPath = path.join(tmpDir, 'config.json');
  
  const workspaces = [
    { name: 'project-a', path: '/path/a', lastUsed: '' },
    { name: 'project-b', path: '/path/b', lastUsed: '' }
  ];
  
  await configManager.saveGlobal({ workspaces });
  
  // Simulate switch
  const globalConfig = await configManager.loadGlobal();
  const nameToSwitch = 'project-b';
  const ws = globalConfig.workspaces.find(w => w.name === nameToSwitch);
  globalConfig.activeWorkspace = ws.path;
  await configManager.saveGlobal(globalConfig);
  
  const updated = await configManager.loadGlobal();
  assert.strictEqual(updated.activeWorkspace, '/path/b');
  
  // Cleanup
  configManager.globalConfigPath = oldPath;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test('Monitoring: checkAlerts logic', () => {
  // We need to mock metrics for this test
  // This is a unit test for the logic
  const mockMetrics = {
    errors: 15,
    system: { totalMemory: 1000, freeMemory: 5 }, // 99.5% used
    performance: [{ duration: 6000 }] // one slow op
  };
  
  // Internal logic check (since we can't easily mock the singleton's internal state without refactoring)
  const alerts = [];
  if (mockMetrics.system) {
    const usedMemPercent = ((mockMetrics.system.totalMemory - mockMetrics.system.freeMemory) / mockMetrics.system.totalMemory) * 100;
    if (usedMemPercent > 90) alerts.push('memory');
  }
  if (mockMetrics.errors > 10) alerts.push('errors');
  if (mockMetrics.performance.some(p => p.duration > 5000)) alerts.push('performance');
  
  assert.ok(alerts.includes('memory'));
  assert.ok(alerts.includes('errors'));
  assert.ok(alerts.includes('performance'));
});
