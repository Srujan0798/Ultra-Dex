import { test, describe, it } from 'node:test';
import assert from 'node:assert';
import { redact } from '../../lib/utils/redactor.js';

describe('Redactor Utility', () => {
  it('should redact OpenAI keys in strings', () => {
    const key = 'sk-proj-1234567890abcdef1234567890abcdef';
    const input = `My key is ${key} and it is secret.`;
    const redacted = redact(input);
    assert.ok(!redacted.includes(key), 'Key should be removed');
    assert.ok(redacted.includes('[REDACTED]'), 'Redacted marker should be present');
  });

  it('should redact Anthropic keys', () => {
    const key = 'sk-ant-1234567890abcdef1234567890abcdef';
    const input = `My key is ${key}`;
    const redacted = redact(input);
    assert.ok(!redacted.includes(key), 'Key should be removed');
    assert.ok(redacted.includes('[REDACTED]'), 'Redacted marker should be present');
  });

  it('should redact sensitive object keys (apiKey)', () => {
    const obj = {
      apiKey: 'very-secret-value-12345',
      user: 'john_doe',
      details: {
        auth_token: 'token-1234567890',
      },
    };
    const redacted = redact(obj);

    assert.notStrictEqual(redacted.apiKey, 'very-secret-value-12345');
    assert.ok(redacted.apiKey.includes('[REDACTED]'));

    assert.notStrictEqual(redacted.details.auth_token, 'token-1234567890');
    assert.ok(redacted.details.auth_token.includes('[REDACTED]'));

    assert.strictEqual(redacted.user, 'john_doe');
  });

  it('should redact keys in Error objects', () => {
    const error = new Error('Failed with key sk-proj-1234567890abcdef1234567890');
    const redacted = redact(error);

    assert.ok(!redacted.message.includes('sk-proj-1234567890abcdef1234567890'), 'Key in error message should be redacted');
    assert.ok(redacted.message.includes('[REDACTED]'));
  });

  it('should handle arrays', () => {
    const arr = ['safe', 'sk-proj-1234567890abcdef1234567890'];
    const redacted = redact(arr);

    assert.strictEqual(redacted[0], 'safe');
    assert.ok(!redacted[1].includes('sk-proj-1234567890abcdef1234567890'));
  });

  it('should not break on null or undefined', () => {
    assert.strictEqual(redact(null), null);
    assert.strictEqual(redact(undefined), undefined);
  });

  it('should handle circular references in objects', () => {
    const obj = { name: 'circular' };
    obj.self = obj;
    const redacted = redact(obj);
    assert.strictEqual(redacted.name, 'circular');
    assert.strictEqual(redacted.self, '[Circular]');
  });

  it('should handle circular references in arrays', () => {
    const arr = [];
    arr.push(arr);
    const redacted = redact(arr);
    assert.strictEqual(redacted[0], '[Circular]');
  });

  it('should handle circular references in errors', () => {
      const error = new Error('circular error');
      error.cause = error;
      const redacted = redact(error);
      assert.strictEqual(redacted.message, 'circular error');
      // Error properties are copied, so cause should be [Circular Error] or similar?
      // Our implementation copies keys.
      // If error.cause is the error itself, redact(error.cause) will be called.
      // It should return [Circular Error] or [Circular] depending on implementation.
      // Our implementation: if (input instanceof Error) ... if visited.has(input) return '[Circular Error]';
      assert.strictEqual(redacted.cause, '[Circular Error]');
  });
});
