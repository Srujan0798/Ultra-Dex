// Copyright (c) 2026 Ultra-Dex
/**
 * Data Encryption Service
 * AES-256-GCM encryption with key rotation
 *
 * @module services/security/encryption-service
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';

/**
 * Encryption algorithm
 */
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
  salt: string;
  version: number;
  keyId: string;
}

/**
 * Encryption key
 */
export interface EncryptionKey {
  id: string;
  key: Buffer;
  createdAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  purpose: 'data' | 'file' | 'backup' | 'api';
}

/**
 * Field encryption config
 */
export interface FieldEncryptionConfig {
  algorithm: string;
  keyRotationDays: number;
  fields: string[];
}

/**
 * Encryption Service
 */
export class EncryptionService {
  private initialized: boolean = false;
  private keys: Map<string, EncryptionKey> = new Map();
  private masterKey?: Buffer;

  async initialize(masterKeyHex?: string): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    // Initialize master key
    if (masterKeyHex) {
      const normalizedKey = masterKeyHex.trim();
      const isHexKey = /^[0-9a-fA-F]+$/.test(normalizedKey);

      this.masterKey =
        isHexKey && normalizedKey.length === KEY_LENGTH * 2
          ? Buffer.from(normalizedKey, 'hex')
          : crypto.createHash('sha256').update(normalizedKey).digest();
    } else {
      // Generate master key if not provided (in production, this should come from KMS)
      this.masterKey = crypto.randomBytes(KEY_LENGTH);
      console.warn('⚠️ Generated new master key - in production, use external KMS');
    }

    this.initialized = true;

    // Generate initial data encryption key
    await this.generateKey('data');

    console.log('✓ Encryption service initialized');
  }

  /**
   * Generate new encryption key
   */
  async generateKey(purpose: EncryptionKey['purpose'] = 'data'): Promise<EncryptionKey> {
    await this.initialize();

    const key: EncryptionKey = {
      id: uuidv4(),
      key: crypto.randomBytes(KEY_LENGTH),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 3600000), // 90 days
      isActive: true,
      purpose,
    };

    // Encrypt key with master key
    const encryptedKey = this.encryptWithMasterKey(key.key);

    this.keys.set(key.id, key);

    await ppmManager.add({
      content: `Encryption key generated: ${key.id}`,
      type: 'encryption-key-generated',
      importance: 7,
      metadata: {
        keyId: key.id,
        purpose,
        expiresAt: key.expiresAt,
      },
    });

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      action: 'ENCRYPTION_KEY_GENERATED',
      resource: 'encryption',
      resourceId: key.id,
      details: { purpose, expiresAt: key.expiresAt },
    });

    console.log(`✓ Encryption key generated: ${key.id} (${purpose})`);
    return key;
  }

  /**
   * Encrypt data
   */
  async encrypt(plaintext: string, keyId?: string): Promise<EncryptedData> {
    await this.initialize();

    // Get or create encryption key
    let key: EncryptionKey;
    if (keyId) {
      key = this.keys.get(keyId)!;
      if (!key) {
        throw new Error(`Encryption key ${keyId} not found`);
      }
    } else {
      // Use most recent active key
      key = Array.from(this.keys.values())
        .filter((k) => k.isActive && k.purpose === 'data')
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];

      if (!key) {
        key = await this.generateKey('data');
      }
    }

    // Generate salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key using PBKDF2
    const derivedKey = crypto.pbkdf2Sync(key.key, salt, 100000, KEY_LENGTH, 'sha256');

    // Encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, derivedKey, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const encryptedData: EncryptedData = {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64'),
      version: 1,
      keyId: key.id,
    };

    return encryptedData;
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData: EncryptedData): Promise<string> {
    await this.initialize();

    const key = this.keys.get(encryptedData.keyId);
    if (!key) {
      throw new Error(`Encryption key ${encryptedData.keyId} not found`);
    }

    // Decode components
    const ciphertext = Buffer.from(encryptedData.ciphertext, 'base64');
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const salt = Buffer.from(encryptedData.salt, 'base64');

    // Derive key
    const derivedKey = crypto.pbkdf2Sync(key.key, salt, 100000, KEY_LENGTH, 'sha256');

    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, derivedKey, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Encrypt object fields
   */
  async encryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: string[],
    keyId?: string
  ): Promise<T> {
    const encrypted = { ...obj };

    for (const field of fieldsToEncrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        const encryptedValue = await this.encrypt(String(obj[field]), keyId);
        encrypted[field] = JSON.stringify(encryptedValue);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt object fields
   */
  async decryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: string[]
  ): Promise<T> {
    const decrypted = { ...obj };

    for (const field of fieldsToDecrypt) {
      if (obj[field] !== undefined && obj[field] !== null) {
        try {
          const encryptedData: EncryptedData = JSON.parse(obj[field]);
          decrypted[field] = await this.decrypt(encryptedData);
        } catch {
          // Field might not be encrypted
          decrypted[field] = obj[field];
        }
      }
    }

    return decrypted;
  }

  /**
   * Encrypt with master key (for key storage)
   */
  private encryptWithMasterKey(data: Buffer): Buffer {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.masterKey, iv);

    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt with master key
   */
  private decryptWithMasterKey(encryptedData: Buffer): Buffer {
    if (!this.masterKey) {
      throw new Error('Master key not initialized');
    }

    const iv = encryptedData.subarray(0, IV_LENGTH);
    const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, this.masterKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  /**
   * Rotate encryption key
   */
  async rotateKey(oldKeyId: string): Promise<EncryptionKey> {
    await this.initialize();

    const oldKey = this.keys.get(oldKeyId);
    if (!oldKey) {
      throw new Error(`Key ${oldKeyId} not found`);
    }

    // Generate new key
    const newKey = await this.generateKey(oldKey.purpose);

    // Mark old key as inactive
    oldKey.isActive = false;

    await auditLogger.log({
      type: 'security.alert',
      severity: 'info',
      action: 'ENCRYPTION_KEY_ROTATED',
      resource: 'encryption',
      resourceId: oldKeyId,
      details: {
        oldKeyId,
        newKeyId: newKey.id,
      },
    });

    console.log(`✓ Encryption key rotated: ${oldKeyId} → ${newKey.id}`);
    return newKey;
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string, salt?: string): string {
    const useSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, useSalt, 100000, 64, 'sha512');
    return `${useSalt}:${hash.toString('hex')}`;
  }

  /**
   * Verify hash
   */
  verifyHash(data: string, hashedValue: string): boolean {
    const [salt, hash] = hashedValue.split(':');
    const computedHash = crypto.pbkdf2Sync(data, salt, 100000, 64, 'sha512');
    return computedHash.toString('hex') === hash;
  }

  /**
   * Get key statistics
   */
  async getKeyStatistics(): Promise<{
    totalKeys: number;
    activeKeys: number;
    expiredKeys: number;
    keysByPurpose: Record<string, number>;
  }> {
    await this.initialize();

    const now = new Date();
    let activeCount = 0;
    let expiredCount = 0;
    const byPurpose: Record<string, number> = {};

    for (const key of this.keys.values()) {
      if (key.isActive) {
        if (key.expiresAt && key.expiresAt < now) {
          expiredCount++;
        } else {
          activeCount++;
        }
      }

      byPurpose[key.purpose] = (byPurpose[key.purpose] || 0) + 1;
    }

    return {
      totalKeys: this.keys.size,
      activeKeys: activeCount,
      expiredKeys: expiredCount,
      keysByPurpose: byPurpose,
    };
  }

  /**
   * Securely wipe key from memory
   */
  async deleteKey(keyId: string): Promise<boolean> {
    await this.initialize();

    const key = this.keys.get(keyId);
    if (!key) return false;

    // Overwrite key data
    key.key.fill(0);
    this.keys.delete(keyId);

    await auditLogger.log({
      type: 'security.alert',
      severity: 'warning',
      action: 'ENCRYPTION_KEY_DELETED',
      resource: 'encryption',
      resourceId: keyId,
    });

    console.log(`✓ Encryption key deleted: ${keyId}`);
    return true;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
export default encryptionService;
