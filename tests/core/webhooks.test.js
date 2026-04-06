import assert from 'node:assert';
import { WebhookManager, WebhookEndpoint } from '../../src/core/webhooks/webhook-manager.js';

// 1. Test endpoint registration
function testRegistration() {
  const wm = new WebhookManager();
  const endpoint = wm.register({ url: 'http://test.com', events: ['user.created'] });
  assert.strictEqual(wm.endpoints.size, 1);
  assert.strictEqual(endpoint.url, 'http://test.com');
}

// 2. Test event matching
function testEventMatching() {
  const endpoint = new WebhookEndpoint({ url: 'http://test.com', events: ['user.created'] });
  assert.strictEqual(endpoint.matchesEvent('user.created'), true);
  assert.strictEqual(endpoint.matchesEvent('user.deleted'), false);
}

// 3. Test delivery simulation
async function testDelivery() {
  const wm = new WebhookManager();
  wm.register({ url: 'http://success.com', events: ['test'] });
  const results = await wm.dispatch('test', { data: 'hello' });
  assert.strictEqual(results[0].status, 'delivered');
}

async function run() {
  testRegistration();
  testEventMatching();
  await testDelivery();
}

run().catch(console.error);
