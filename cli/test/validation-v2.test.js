import test from 'node:test';
import assert from 'node:assert';
import { validateProjectName, validateSafePath, assertValidPath } from '../lib/utils/validation.js';

test('Validation: validateProjectName', () => {
  assert.strictEqual(validateProjectName('my-app'), true);
  assert.strictEqual(validateProjectName('My-App-123'), true);
  assert.ok(typeof validateProjectName('') === 'string');
  assert.ok(typeof validateProjectName('my app') === 'string');
  assert.ok(typeof validateProjectName('../evil') === 'string');
});

test('Validation: validateSafePath', () => {
  assert.strictEqual(validateSafePath('src/lib'), true);
  assert.ok(typeof validateSafePath('../../../etc/passwd') === 'string');
  assert.ok(typeof validateSafePath('') === 'string');
});

test('Validation: assertValidPath', () => {
  assert.strictEqual(assertValidPath('safe/path', 'Test'), 'safe/path');
  assert.throws(() => assertValidPath('../unsafe', 'Test'), /cannot include "\.\."/);
});
