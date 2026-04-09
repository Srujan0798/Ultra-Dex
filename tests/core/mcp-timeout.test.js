// Copyright (c) 2026 Ultra-Dex
// MCP Server Manager Timeout Test

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import MCPServerManager from '../../src/core/mcp/server-manager.js';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

describe('MCP Server Manager Timeout', () => {
  let manager;
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mcp-test-'));
    manager = new MCPServerManager({
      serversPath: tempDir,
    });
    await manager.initialize();
  });

  afterEach(async () => {
    // Stop all servers and clean up
    for (const [serverId, server] of manager.servers) {
      if (server.process && !server.process.killed) {
        try {
          server.process.kill('SIGKILL');
        } catch (e) {
          // Ignore
        }
      }
    }
    await new Promise((r) => setTimeout(r, 50));
  });

  it('should log warning and skip server when auto-start times out', async () => {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));

    // Use a long-running node process that never signals ready
    const result = await manager.registerServer('slow-server', {
      name: 'Slow Server',
      command: 'node',
      args: ['-e', 'setTimeout(() => {}, 60000)'], // 60s timeout
      autoStart: true,
    });

    console.warn = originalWarn;

    assert.ok(result.registered, 'Server should be registered');
    assert.ok(
      warnings.some((w) => w.includes('MCP server slow-server unreachable at startup')),
      'Should log warning about unreachable server'
    );

    const server = manager.servers.get('slow-server');
    assert.strictEqual(server.status, 'unreachable', 'Server status should be unreachable');
    assert.ok(
      server.lastError.includes('Timeout') || server.lastError.includes('timeout'),
      'Last error should mention timeout'
    );
  });

  it('should emit server:startup-timeout event on timeout', async () => {
    const events = [];
    manager.on('server:startup-timeout', (event) => {
      events.push(event);
    });

    await manager.registerServer('timeout-server', {
      name: 'Timeout Server',
      command: 'node',
      args: ['-e', 'setTimeout(() => {}, 60000)'],
      autoStart: true,
    });

    assert.strictEqual(events.length, 1, 'Should emit startup-timeout event');
    assert.strictEqual(events[0].serverId, 'timeout-server');
    assert.ok(events[0].error, 'Event should contain error');
  });

  it('should NOT throw when auto-start times out', async () => {
    let threw = false;
    let error = null;

    try {
      await manager.registerServer('non-throwing-server', {
        name: 'Non-Throwing Server',
        command: 'node',
        args: ['-e', 'setTimeout(() => {}, 60000)'],
        autoStart: true,
      });
    } catch (e) {
      threw = true;
      error = e;
    }

    assert.strictEqual(threw, false, `Should not throw on timeout, but threw: ${error?.message}`);
  });

  it('should complete registration even with timeout', async () => {
    const startTime = Date.now();

    const result = await manager.registerServer('timing-server', {
      name: 'Timing Server',
      command: 'node',
      args: ['-e', 'setTimeout(() => {}, 60000)'],
      autoStart: true,
    });

    const elapsed = Date.now() - startTime;

    assert.ok(result.registered, 'Should return registration result');
    assert.ok(elapsed < 6000, `Should timeout after ~5 seconds, but took ${elapsed}ms`);
    assert.ok(elapsed >= 4500, `Should wait at least 4.5 seconds, but took ${elapsed}ms`);
  });

  it('should handle autoStart: false without timeout', async () => {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.join(' '));

    const startTime = Date.now();
    const result = await manager.registerServer('no-autostart-server', {
      name: 'No AutoStart Server',
      command: 'node',
      args: ['-e', 'setTimeout(() => {}, 60000)'],
      autoStart: false,
    });
    const elapsed = Date.now() - startTime;

    console.warn = originalWarn;

    assert.ok(result.registered, 'Server should be registered');
    assert.strictEqual(warnings.length, 0, 'Should not log warning when autoStart is false');
    assert.ok(elapsed < 100, `Should complete immediately (<100ms), but took ${elapsed}ms`);

    const server = manager.servers.get('no-autostart-server');
    assert.strictEqual(server.status, 'stopped', 'Server should remain stopped');
  });

  it('should have 5-second timeout for auto-start', async () => {
    const startTime = Date.now();

    await manager.registerServer('five-sec-test', {
      name: 'Five Second Test',
      command: 'node',
      args: ['-e', 'setTimeout(() => {}, 60000)'],
      autoStart: true,
    });

    const elapsed = Date.now() - startTime;

    assert.ok(
      elapsed >= 4500 && elapsed <= 6000,
      `Timeout should be ~5s (4500-6000ms), but was ${elapsed}ms`
    );
  });
});
