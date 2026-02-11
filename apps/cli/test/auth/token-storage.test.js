/**
 * Tests for Secure Token Storage
 *
 * Security-critical module - ensures token encryption/decryption is safe
 */

import { describe, test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  SecureTokenStorage,
  storeAuthToken,
  getAuthToken,
  deleteAuthToken,
  storeAPIKey,
  getAPIKey,
} from '../../lib/auth/token-storage.js';

describe('SecureTokenStorage', () => {
  let storage;
  let tempDir;

  beforeEach(async () => {
    storage = new SecureTokenStorage();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-test-'));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    test('should initialize without errors', async () => {
      const result = await storage.initialize();
      assert.strictEqual(typeof result, 'boolean');
    });

    test('should set available flag based on keytar', async () => {
      await storage.initialize();
      assert.strictEqual(typeof storage.available, 'boolean');
    });
  });

  describe('setToken', () => {
    test('should store token successfully (fallback)', async () => {
      await storage.initialize();
      const result = await storage.setToken('test-account', 'test-token-123');
      assert.strictEqual(result.success, true);
    });

    test('should create token directory if missing', async () => {
      await storage.initialize();
      await storage.setToken('test', 'token');

      const tokenDir = path.join(tempDir, '.ultra-dex', 'tokens');
      const stats = await fs.stat(tokenDir);
      assert.strictEqual(stats.isDirectory(), true);
    });

    test('should store token with restricted permissions', async () => {
      await storage.initialize();
      await storage.setToken('secure-test', 'secret');

      const tokenFile = path.join(tempDir, '.ultra-dex', 'tokens', 'secure-test.token');
      const stats = await fs.stat(tokenFile);

      // Check file permissions (0o600 = owner read/write only)
      const mode = stats.mode & 0o777;
      assert.ok(mode <= 0o600, `File permissions too permissive: ${mode.toString(8)}`);
    });
  });

  describe('getToken', () => {
    test('should retrieve stored token', async () => {
      await storage.initialize();
      await storage.setToken('test-account', 'my-secret-token');

      const result = await storage.getToken('test-account');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.token, 'my-secret-token');
    });

    test('should return null for non-existent token', async () => {
      await storage.initialize();

      const result = await storage.getToken('non-existent');
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.token, null);
    });

    test('should handle multiple tokens', async () => {
      await storage.initialize();
      await storage.setToken('account1', 'token1');
      await storage.setToken('account2', 'token2');

      const result1 = await storage.getToken('account1');
      const result2 = await storage.getToken('account2');

      assert.strictEqual(result1.token, 'token1');
      assert.strictEqual(result2.token, 'token2');
    });
  });

  describe('deleteToken', () => {
    test('should delete existing token', async () => {
      await storage.initialize();
      await storage.setToken('test', 'token');

      const deleteResult = await storage.deleteToken('test');
      assert.strictEqual(deleteResult.success, true);

      const getResult = await storage.getToken('test');
      assert.strictEqual(getResult.token, null);
    });

    test('should succeed when deleting non-existent token', async () => {
      await storage.initialize();

      const result = await storage.deleteToken('non-existent');
      assert.strictEqual(result.success, true);
    });
  });

  describe('listAccounts', () => {
    test('should list all stored accounts', async () => {
      await storage.initialize();
      await storage.setToken('account1', 'token1');
      await storage.setToken('account2', 'token2');
      await storage.setToken('account3', 'token3');

      const result = await storage.listAccounts();
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.accounts.length, 3);

      const accountNames = result.accounts.map((a) => a.account);
      assert.ok(accountNames.includes('account1'));
      assert.ok(accountNames.includes('account2'));
      assert.ok(accountNames.includes('account3'));
    });

    test('should not expose token values', async () => {
      await storage.initialize();
      await storage.setToken('test', 'secret-token');

      const result = await storage.listAccounts();
      assert.strictEqual(result.success, true);

      // Ensure no account object has a password field
      result.accounts.forEach((account) => {
        assert.strictEqual(account.password, undefined);
        assert.strictEqual(account.token, undefined);
      });
    });

    test('should return empty array when no accounts exist', async () => {
      await storage.initialize();

      const result = await storage.listAccounts();
      assert.strictEqual(result.success, true);
      assert.strictEqual(result.accounts.length, 0);
    });
  });
});

describe('Auth Token Helpers', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-test-'));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('storeAuthToken should store tokens for provider', async () => {
    const result = await storeAuthToken('anthropic', {
      accessToken: 'sk-ant-123',
      refreshToken: 'refresh-456',
    });

    assert.strictEqual(result.success, true);
  });

  test('getAuthToken should retrieve and parse tokens', async () => {
    await storeAuthToken('openai', {
      accessToken: 'sk-openai-xyz',
      expiresAt: '2026-12-31',
    });

    const result = await getAuthToken('openai');
    assert.strictEqual(result.success, true);
    assert.ok(result.tokens);
    assert.strictEqual(result.tokens.accessToken, 'sk-openai-xyz');
    assert.strictEqual(result.tokens.expiresAt, '2026-12-31');
  });

  test('deleteAuthToken should remove provider tokens', async () => {
    await storeAuthToken('gemini', { accessToken: 'token' });

    const deleteResult = await deleteAuthToken('gemini');
    assert.strictEqual(deleteResult.success, true);

    const getResult = await getAuthToken('gemini');
    assert.strictEqual(getResult.token, null);
  });
});

describe('API Key Storage', () => {
  let tempDir;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-test-'));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('storeAPIKey should store API key', async () => {
    const result = await storeAPIKey('prod-key', 'sk-ultra-dex-123abc');
    assert.strictEqual(result.success, true);
  });

  test('getAPIKey should retrieve stored key', async () => {
    await storeAPIKey('dev-key', 'sk-dev-456def');

    const result = await getAPIKey('dev-key');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.token, 'sk-dev-456def');
  });

  test('should handle multiple API keys', async () => {
    await storeAPIKey('key1', 'secret1');
    await storeAPIKey('key2', 'secret2');

    const result1 = await getAPIKey('key1');
    const result2 = await getAPIKey('key2');

    assert.strictEqual(result1.token, 'secret1');
    assert.strictEqual(result2.token, 'secret2');
  });
});

describe('Security Edge Cases', () => {
  let storage;
  let tempDir;

  beforeEach(async () => {
    storage = new SecureTokenStorage();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-test-'));
    process.chdir(tempDir);
    await storage.initialize();
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore
    }
  });

  test('should handle empty token string', async () => {
    const result = await storage.setToken('empty', '');
    assert.strictEqual(result.success, true);

    const getResult = await storage.getToken('empty');
    assert.strictEqual(getResult.token, '');
  });

  test('should handle very long tokens', async () => {
    const longToken = 'x'.repeat(10000);
    const result = await storage.setToken('long', longToken);
    assert.strictEqual(result.success, true);

    const getResult = await storage.getToken('long');
    assert.strictEqual(getResult.token, longToken);
  });

  test('should handle special characters in account name', async () => {
    const accounts = ['test@example.com', 'user-123', 'api_key_v2'];

    for (const account of accounts) {
      await storage.setToken(account, 'token');
      const result = await storage.getToken(account);
      assert.strictEqual(result.token, 'token');
    }
  });

  test('should handle concurrent operations', async () => {
    const operations = [];
    for (let i = 0; i < 10; i++) {
      operations.push(storage.setToken(`account${i}`, `token${i}`));
    }

    await Promise.all(operations);

    const listResult = await storage.listAccounts();
    assert.strictEqual(listResult.accounts.length, 10);
  });
});
