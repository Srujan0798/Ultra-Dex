import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { WebSocket } from 'ws';

import { UltraDexWebSocketServer } from '../../lib/mcp/websocket.js';

async function getAvailablePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function waitForMessage(ws) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timed out waiting for message')), 3000);
    ws.once('message', (data) => {
      clearTimeout(timeout);
      resolve(JSON.parse(data.toString()));
    });
  });
}

describe('MCP WebSocket integration', () => {
  let server;
  let port;

  beforeEach(async () => {
    port = await getAvailablePort();
    server = new UltraDexWebSocketServer(port);
    await server.start({ port });
  });

  afterEach(async () => {
    if (server) {
      await server.stop();
      server = null;
    }
  });

  test('client receives connected message', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    const message = await waitForMessage(ws);

    assert.equal(message.type, 'connected');
    assert.ok(message.config?.heartbeatInterval);

    ws.close();
  });

  test('ping/pong and reconnection', async () => {
    const ws = new WebSocket(`ws://localhost:${port}/ws`);
    await waitForMessage(ws);

    ws.send(JSON.stringify({ type: 'ping' }));
    const pong = await waitForMessage(ws);
    assert.equal(pong.type, 'pong');

    ws.close();

    const ws2 = new WebSocket(`ws://localhost:${port}/ws`);
    const connected = await waitForMessage(ws2);
    assert.equal(connected.type, 'connected');

    ws2.close();
  });
});

/**
 * Error handler for websocket.integration.test
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[websocket.integration.test]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
