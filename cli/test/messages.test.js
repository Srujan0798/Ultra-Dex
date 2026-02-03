import test from 'node:test';
import assert from 'node:assert';
import { getRandomMessage, professionalMessages } from '../lib/utils/messages.js';

test('Messages: getRandomMessage', () => {
  const startMsg = getRandomMessage('start');
  assert.ok(professionalMessages.start.includes(startMsg));

  const errorMsg = getRandomMessage('error');
  assert.ok(professionalMessages.error.includes(errorMsg));

  const successMsg = getRandomMessage('success');
  assert.ok(professionalMessages.success.includes(successMsg));

  const loadingMsg = getRandomMessage('loading');
  assert.ok(professionalMessages.loading.includes(loadingMsg));
});
