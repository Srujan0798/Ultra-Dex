import { test } from 'node:test';
import assert from 'node:assert';
import { ACPHost } from '../lib/acp/host.js';

test('ACP Host: initialize', async () => {
  const host = new ACPHost({ stdio: false });

  const initMessage = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      capabilities: { text: true },
    },
  });

  const responseStr = await host.handleMessage(initMessage);
  const response = JSON.parse(responseStr);

  assert.strictEqual(response.id, 1);
  assert.strictEqual(response.result.agentInfo.name, 'ultra-dex');
  assert.ok(response.result.capabilities);
});

test('ACP Host: session management', async () => {
  const host = new ACPHost({ stdio: false });

  // 0. Initialize
  await host.handleMessage(
    JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {},
    })
  );

  // 1. New Session
  const newSessionMsg = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'new_session',
    params: { initialMode: 'code' },
  });

  const responseStr = await host.handleMessage(newSessionMsg);
  const response = JSON.parse(responseStr);

  assert.strictEqual(response.id, 2);
  const sessionId = response.result.sessionId;
  assert.ok(sessionId);
  assert.strictEqual(response.result.currentModeId, 'code');

  // 2. Session Prompt
  const promptMsg = JSON.stringify({
    jsonrpc: '2.0',
    id: 3,
    method: 'session/prompt',
    params: {
      sessionId: sessionId,
      prompt: 'Hello',
    },
  });

  const promptResponseStr = await host.handleMessage(promptMsg);
  const promptResponse = JSON.parse(promptResponseStr);

  assert.strictEqual(promptResponse.id, 3);
  assert.ok(promptResponse.result.content[0].text.includes('Ultra-Dex'));
});
