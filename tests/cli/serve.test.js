import { test, describe } from 'node:test';
import assert from 'node:assert';
import { startUnifiedKernel } from '../../apps/cli/lib/commands/serve.js';
import http from 'http';

describe('CLI Command: serve', { timeout: 15000 }, () => {
  test('startUnifiedKernel initializes server components in test mode', async () => {
    const port = 40000 + Math.floor(Math.random() * 1000); // Random high port
    const options = { testMode: true, disableWatch: true };

    try {
      const { server, wss, close } = await startUnifiedKernel(port.toString(), options);

      assert.ok(server instanceof http.Server, 'Server should be an instance of http.Server');

      // Wait for server to be ready with timeout
      await Promise.race([
        new Promise((resolve) => {
          if (server.listening) resolve();
          else server.on('listening', resolve);
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Server start timeout')), 2000))
      ]);

      assert.strictEqual(server.listening, true, 'Server should be listening');
      assert.ok(wss, 'WebSocket server should be initialized');

      // Cleanup with timeout
      await Promise.race([
        new Promise((resolve) => {
          close();
          if (!server.listening) resolve();
          else server.on('close', resolve);
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Server close timeout')), 2000))
      ]);

      assert.strictEqual(server.listening, false, 'Server should stop listening after close()');
    } catch (error) {
      assert.fail(`Test failed with error: ${error.message}`);
    }
  });

  test('validates invalid port', async () => {
    try {
      await startUnifiedKernel('invalid', { testMode: true });
      assert.fail('Should have thrown ValidationError');
    } catch (e) {
      assert.match(e.message, /Invalid port/);
    }
  });
});
