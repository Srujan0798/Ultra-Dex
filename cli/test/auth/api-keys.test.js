/**
 * Tests for API Key Management
 *
 * Security-critical module - ensures API key generation, validation, and revocation
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { APIKeyManager } from '../../lib/auth/api-keys.js';

describe('APIKeyManager', () => {
  let manager;

  beforeEach(() => {
    manager = new APIKeyManager();
  });

  describe('generateKey', () => {
    test('should generate a valid API key', () => {
      const result = manager.generateKey('test-key');

      assert.ok(result.id);
      assert.ok(result.key);
      assert.strictEqual(result.name, 'test-key');
      assert.ok(result.key.startsWith('ud_'));
      assert.ok(result.prefix);
      assert.ok(result.createdAt);
    });

    test('should generate unique keys', () => {
      const key1 = manager.generateKey('key1');
      const key2 = manager.generateKey('key2');

      assert.notEqual(key1.id, key2.id);
      assert.notEqual(key1.key, key2.key);
    });

    test('should apply custom permissions', () => {
      const key = manager.generateKey('admin-key', {
        permissions: ['read', 'write', 'delete'],
      });

      const keyData = manager.getKey(key.id);
      assert.deepStrictEqual(keyData.permissions, ['read', 'write', 'delete']);
    });

    test('should apply custom rate limit', () => {
      const key = manager.generateKey('limited-key', {
        rateLimit: 50,
      });

      const keyData = manager.getKey(key.id);
      assert.strictEqual(keyData.rateLimit, 50);
    });

    test('should apply default permissions when not specified', () => {
      const key = manager.generateKey('default-key');

      const keyData = manager.getKey(key.id);
      assert.deepStrictEqual(keyData.permissions, ['read']);
    });

    test('should set expiration date when provided', () => {
      const expiresAt = '2026-12-31T23:59:59Z';
      const key = manager.generateKey('expiring-key', { expiresAt });

      const keyData = manager.getKey(key.id);
      assert.strictEqual(keyData.expiresAt, expiresAt);
    });

    test('should store createdBy field', () => {
      const key = manager.generateKey('user-key', {
        createdBy: 'admin@example.com',
      });

      const keyData = manager.getKey(key.id);
      assert.strictEqual(keyData.createdBy, 'admin@example.com');
    });
  });

  describe('hashKey', () => {
    test('should hash keys consistently', () => {
      const key = 'ud_test123';
      const hash1 = manager.hashKey(key);
      const hash2 = manager.hashKey(key);

      assert.strictEqual(hash1, hash2);
      assert.strictEqual(typeof hash1, 'string');
      assert.strictEqual(hash1.length, 64); // SHA-256 hex length
    });

    test('should produce different hashes for different keys', () => {
      const hash1 = manager.hashKey('ud_key1');
      const hash2 = manager.hashKey('ud_key2');

      assert.notEqual(hash1, hash2);
    });
  });

  describe('validateKey', () => {
    test('should validate a correct key', () => {
      const { key } = manager.generateKey('valid-key');

      const validation = manager.validateKey(key);
      assert.strictEqual(validation.valid, true);
      assert.ok(validation.keyId);
      assert.strictEqual(validation.name, 'valid-key');
    });

    test('should reject invalid key format', () => {
      const validation = manager.validateKey('invalid-format');

      assert.strictEqual(validation.valid, false);
      assert.strictEqual(validation.error, 'Invalid key format');
    });

    test('should reject key without prefix', () => {
      const validation = manager.validateKey('1234567890abcdef');

      assert.strictEqual(validation.valid, false);
      assert.strictEqual(validation.error, 'Invalid key format');
    });

    test('should reject null/undefined key', () => {
      const validation1 = manager.validateKey(null);
      const validation2 = manager.validateKey(undefined);

      assert.strictEqual(validation1.valid, false);
      assert.strictEqual(validation2.valid, false);
    });

    test('should reject expired key', () => {
      const pastDate = new Date('2020-01-01').toISOString();
      const { key } = manager.generateKey('expired-key', { expiresAt: pastDate });

      const validation = manager.validateKey(key);
      assert.strictEqual(validation.valid, false);
      assert.strictEqual(validation.error, 'Key expired');
    });

    test('should accept key with future expiration', () => {
      const futureDate = new Date('2030-12-31').toISOString();
      const { key } = manager.generateKey('future-key', { expiresAt: futureDate });

      const validation = manager.validateKey(key);
      assert.strictEqual(validation.valid, true);
    });

    test('should reject revoked key', () => {
      const { key, id } = manager.generateKey('revoked-key');

      manager.revokeKey(id);

      const validation = manager.validateKey(key);
      assert.strictEqual(validation.valid, false);
      assert.strictEqual(validation.error, 'Invalid key');
    });

    test('should track usage count on validation', () => {
      const { key, id } = manager.generateKey('tracked-key');

      manager.validateKey(key);
      manager.validateKey(key);
      manager.validateKey(key);

      const keyData = manager.getKey(id);
      assert.strictEqual(keyData.usageCount, 3);
    });

    test('should update lastUsed timestamp', () => {
      const { key, id } = manager.generateKey('timestamp-key');

      const before = Date.now();
      manager.validateKey(key);
      const after = Date.now();

      const keyData = manager.getKey(id);
      assert.ok(keyData.lastUsed);

      const lastUsedTime = new Date(keyData.lastUsed).getTime();
      assert.ok(lastUsedTime >= before && lastUsedTime <= after);
    });

    test('should return permissions on successful validation', () => {
      const { key } = manager.generateKey('perm-key', {
        permissions: ['read', 'write'],
      });

      const validation = manager.validateKey(key);
      assert.strictEqual(validation.valid, true);
      assert.deepStrictEqual(validation.permissions, ['read', 'write']);
    });
  });

  describe('revokeKey', () => {
    test('should successfully revoke a key', () => {
      const { id } = manager.generateKey('revoke-test');

      const result = manager.revokeKey(id);
      assert.strictEqual(result.success, true);

      const keyData = manager.getKey(id);
      assert.strictEqual(keyData.enabled, false);
      assert.ok(keyData.revokedAt);
    });

    test('should return error for non-existent key', () => {
      const result = manager.revokeKey('non-existent-id');

      assert.strictEqual(result.success, false);
      assert.strictEqual(result.error, 'Key not found');
    });

    test('should set revokedAt timestamp', () => {
      const { id } = manager.generateKey('timestamp-revoke');

      const before = Date.now();
      manager.revokeKey(id);
      const after = Date.now();

      const keyData = manager.getKey(id);
      const revokedTime = new Date(keyData.revokedAt).getTime();
      assert.ok(revokedTime >= before && revokedTime <= after);
    });
  });

  describe('listKeys', () => {
    test('should list all keys', () => {
      manager.generateKey('key1');
      manager.generateKey('key2');
      manager.generateKey('key3');

      const keys = manager.listKeys();
      assert.strictEqual(keys.length, 3);
    });

    test('should not expose secret keys', () => {
      manager.generateKey('secret-key');

      const keys = manager.listKeys();
      assert.strictEqual(keys.length, 1);

      // Ensure the key field is NOT in the list
      assert.strictEqual(keys[0].key, undefined);

      // Ensure we have safe fields
      assert.ok(keys[0].id);
      assert.ok(keys[0].name);
      assert.ok(keys[0].prefix);
    });

    test('should include metadata', () => {
      const { id } = manager.generateKey('meta-key', {
        permissions: ['read', 'write'],
        rateLimit: 200,
      });

      const keys = manager.listKeys();
      const key = keys.find((k) => k.id === id);

      assert.ok(key);
      assert.strictEqual(key.name, 'meta-key');
      assert.deepStrictEqual(key.permissions, ['read', 'write']);
      assert.ok(key.createdAt);
      assert.strictEqual(key.enabled, true);
    });

    test('should return empty array when no keys exist', () => {
      const keys = manager.listKeys();
      assert.strictEqual(keys.length, 0);
    });

    test('should include revoked keys', () => {
      const { id } = manager.generateKey('revoked');
      manager.revokeKey(id);

      const keys = manager.listKeys();
      assert.strictEqual(keys.length, 1);
      assert.strictEqual(keys[0].enabled, false);
    });
  });

  describe('getKey', () => {
    test('should retrieve key by ID', () => {
      const { id } = manager.generateKey('get-test');

      const keyData = manager.getKey(id);
      assert.ok(keyData);
      assert.strictEqual(keyData.name, 'get-test');
    });

    test('should return undefined for non-existent key', () => {
      const keyData = manager.getKey('non-existent');
      assert.strictEqual(keyData, undefined);
    });
  });

  describe('checkRateLimit', () => {
    test('should allow requests within rate limit', () => {
      const { id } = manager.generateKey('rate-test', { rateLimit: 100 });

      const check = manager.checkRateLimit(id);
      assert.strictEqual(check.allowed, true);
    });

    test('should return error for non-existent key', () => {
      const check = manager.checkRateLimit('non-existent');
      assert.strictEqual(check.allowed, false);
      assert.strictEqual(check.error, 'Key not found');
    });

    test('should reject when rate limit exceeded', () => {
      const { id, key } = manager.generateKey('limited', { rateLimit: 5 });

      // Exceed rate limit
      for (let i = 0; i < 10; i++) {
        manager.validateKey(key);
      }

      const check = manager.checkRateLimit(id);
      assert.strictEqual(check.allowed, false);
      assert.strictEqual(check.error, 'Rate limit exceeded');
    });
  });

  describe('Security Edge Cases', () => {
    test('should handle key name with special characters', () => {
      const specialNames = [
        'key@example.com',
        'key-with-dashes',
        'key_with_underscores',
        'key with spaces',
      ];

      for (const name of specialNames) {
        const { id } = manager.generateKey(name);
        const keyData = manager.getKey(id);
        assert.strictEqual(keyData.name, name);
      }
    });

    test('should prevent key reuse after revocation', () => {
      const { key, id } = manager.generateKey('no-reuse');

      // Validate initially (should work)
      const validation1 = manager.validateKey(key);
      assert.strictEqual(validation1.valid, true);

      // Revoke the key
      manager.revokeKey(id);

      // Try to validate again (should fail)
      const validation2 = manager.validateKey(key);
      assert.strictEqual(validation2.valid, false);
    });

    test('should handle very long key names', () => {
      const longName = 'x'.repeat(1000);
      const { id } = manager.generateKey(longName);

      const keyData = manager.getKey(id);
      assert.strictEqual(keyData.name, longName);
    });

    test('should generate cryptographically strong keys', () => {
      const keys = new Set();

      // Generate 100 keys and ensure no collisions
      for (let i = 0; i < 100; i++) {
        const { key } = manager.generateKey(`key${i}`);
        keys.add(key);
      }

      assert.strictEqual(keys.size, 100);
    });

    test('should store only key hash, not plaintext', () => {
      const { key, id } = manager.generateKey('hashed');

      const keyData = manager.getKey(id);

      // Ensure stored key is NOT the plaintext
      assert.notEqual(keyData.key, key);

      // Ensure it's a hash (64 hex characters for SHA-256)
      assert.strictEqual(keyData.key.length, 64);
      assert.ok(/^[a-f0-9]+$/.test(keyData.key));
    });
  });
});
