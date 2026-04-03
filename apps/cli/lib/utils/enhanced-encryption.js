// Copyright (c) 2026 Ultra-Dex

/**
 * Enhanced Data Encryption Module
 * Provides comprehensive encryption for sensitive data including field-level encryption
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

const ENCRYPTION_DIR = path.join(process.cwd(), '.ultra-dex', 'encryption');
const KEYS_FILE = path.join(ENCRYPTION_DIR, 'keys.json');

export class EnhancedEncryption {
  constructor() {
    this.keys = new Map();
    this.masterKey = null;
  }

  /**
   * Initialize encryption system
   */
  async initialize() {
    await fs.mkdir(ENCRYPTION_DIR, { recursive: true });

    // Generate or load master key
    this.masterKey = await this.getMasterKey();

    // Load encryption keys
    await this.loadKeys();

    printSuccess('🔐 Enhanced encryption initialized');
  }

  /**
   * Get or generate master key
   */
  async getMasterKey() {
    const envKey = process.env.ULTRA_DEX_MASTER_KEY;
    if (envKey) {
      return crypto.createHash('sha256').update(envKey).digest();
    }

    // Try to load from file
    try {
      const keyFile = path.join(ENCRYPTION_DIR, 'master.key');
      const stored = await fs.readFile(keyFile, 'utf8');
      return Buffer.from(stored, 'hex');
    } catch {
      // Generate new master key
      const newKey = crypto.randomBytes(32);
      await fs.writeFile(path.join(ENCRYPTION_DIR, 'master.key'), newKey.toString('hex'));
      printWarning('⚠️  New master encryption key generated. Store securely!');
      return newKey;
    }
  }

  /**
   * Load encryption keys
   */
  async loadKeys() {
    try {
      const data = await fs.readFile(KEYS_FILE, 'utf8');
      const keysData = JSON.parse(data);

      for (const [name, keyData] of Object.entries(keysData)) {
        this.keys.set(name, {
          key: Buffer.from(keyData.key, 'hex'),
          createdAt: keyData.createdAt,
          algorithm: keyData.algorithm || 'aes-256-gcm'
        });
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        printWarning(`⚠️ Could not load encryption keys: ${error.message}`);
      }
    }
  }

  /**
   * Save encryption keys
   */
  async saveKeys() {
    try {
      const keysData = {};
      for (const [name, keyData] of this.keys) {
        keysData[name] = {
          key: keyData.key.toString('hex'),
          createdAt: keyData.createdAt,
          algorithm: keyData.algorithm
        };
      }

      await fs.writeFile(KEYS_FILE, JSON.stringify(keysData, null, 2));
    } catch (error) {
      printError(`Failed to save encryption keys: ${error.message}`);
    }
  }

  /**
   * Generate a new encryption key
   */
  async generateKey(name, algorithm = 'aes-256-gcm') {
    const keyLength = algorithm === 'aes-256-gcm' ? 32 : 16;
    const key = crypto.randomBytes(keyLength);

    this.keys.set(name, {
      key,
      createdAt: new Date().toISOString(),
      algorithm
    });

    await this.saveKeys();
    printInfo(`🔑 Encryption key generated: ${name}`);

    return name;
  }

  /**
   * Encrypt data with specific key
   */
  encrypt(data, keyName = 'default') {
    let keyData = this.keys.get(keyName);

    if (!keyData) {
      // Generate default key if not exists
      this.generateKey(keyName);
      keyData = this.keys.get(keyName);
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(keyData.algorithm, keyData.key, iv);
    const encrypted = Buffer.concat([cipher.update(String(data), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: iv + tag + encrypted
    const result = Buffer.concat([iv, tag, encrypted]);

    return result.toString('base64');
  }

  /**
   * Decrypt data with specific key
   */
  decrypt(encryptedData, keyName = 'default') {
    const keyData = this.keys.get(keyName);
    if (!keyData) {
      throw new Error(`Encryption key '${keyName}' not found`);
    }

    const buffer = Buffer.from(encryptedData, 'base64');
    const iv = buffer.subarray(0, 12);
    const tag = buffer.subarray(12, 28);
    const data = buffer.subarray(28);

    const decipher = crypto.createDecipheriv(keyData.algorithm, keyData.key, iv);
    decipher.setAuthTag(tag);

    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  }

  /**
   * Field-level encryption for objects
   */
  encryptFields(obj, fields, keyName = 'default') {
    if (!obj || typeof obj !== 'object') return obj;

    const result = { ...obj };

    for (const field of fields) {
      if (result[field] !== undefined) {
        result[field] = this.encrypt(result[field], keyName);
        result[`${field}_encrypted`] = true;
      }
    }

    return result;
  }

  /**
   * Field-level decryption for objects
   */
  decryptFields(obj, fields, keyName = 'default') {
    if (!obj || typeof obj !== 'object') return obj;

    const result = { ...obj };

    for (const field of fields) {
      if (result[field] && result[`${field}_encrypted`]) {
        try {
          result[field] = this.decrypt(result[field], keyName);
          delete result[`${field}_encrypted`];
        } catch (error) {
          printWarning(`⚠️ Failed to decrypt field ${field}: ${error.message}`);
        }
      }
    }

    return result;
  }

  /**
   * Encrypt sensitive data types
   */
  encryptSensitiveData(data, dataType) {
    const sensitiveFields = {
      user: ['email', 'phone', 'ssn', 'creditCard', 'bankAccount'],
      medical: ['diagnosis', 'medications', 'treatment', 'phi'],
      financial: ['accountNumber', 'routingNumber', 'balance', 'transactions'],
      personal: ['name', 'address', 'dob', 'idNumber']
    };

    const fields = sensitiveFields[dataType] || [];
    return this.encryptFields(data, fields, `${dataType}-key`);
  }

  /**
   * Decrypt sensitive data types
   */
  decryptSensitiveData(data, dataType) {
    const sensitiveFields = {
      user: ['email', 'phone', 'ssn', 'creditCard', 'bankAccount'],
      medical: ['diagnosis', 'medications', 'treatment', 'phi'],
      financial: ['accountNumber', 'routingNumber', 'balance', 'transactions'],
      personal: ['name', 'address', 'dob', 'idNumber']
    };

    const fields = sensitiveFields[dataType] || [];
    return this.decryptFields(data, fields, `${dataType}-key`);
  }

  /**
   * Secure key rotation
   */
  async rotateKey(oldKeyName, newKeyName) {
    const oldKeyData = this.keys.get(oldKeyName);
    if (!oldKeyData) {
      throw new Error(`Key '${oldKeyName}' not found`);
    }

    // Generate new key
    await this.generateKey(newKeyName, oldKeyData.algorithm);

    printInfo(`🔄 Key rotation initiated: ${oldKeyName} → ${newKeyName}`);
    printWarning('⚠️  Remember to re-encrypt data with the new key');

    return newKeyName;
  }

  /**
   * Hash data (one-way)
   */
  hash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(String(data)).digest('hex');
  }

  /**
   * Generate secure token
   */
  generateToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt file
   */
  async encryptFile(inputPath, outputPath, keyName = 'default') {
    const data = await fs.readFile(inputPath);
    const encrypted = this.encrypt(data.toString('base64'), keyName);

    await fs.writeFile(outputPath, encrypted);
    printInfo(`🔐 File encrypted: ${inputPath} → ${outputPath}`);
  }

  /**
   * Decrypt file
   */
  async decryptFile(inputPath, outputPath, keyName = 'default') {
    const encrypted = await fs.readFile(inputPath, 'utf8');
    const decrypted = this.decrypt(encrypted, keyName);

    // If it was a binary file, decode from base64
    const buffer = Buffer.from(decrypted, 'base64');
    await fs.writeFile(outputPath, buffer);
    printInfo(`🔓 File decrypted: ${inputPath} → ${outputPath}`);
  }

  /**
   * Get encryption status
   */
  getStatus() {
    return {
      initialized: true,
      masterKey: !!this.masterKey,
      keysCount: this.keys.size,
      keyNames: Array.from(this.keys.keys()),
      algorithms: Array.from(new Set(Array.from(this.keys.values()).map(k => k.algorithm)))
    };
  }
}

// Singleton instance
export const enhancedEncryption = new EnhancedEncryption();

// Initialize on import
enhancedEncryption.initialize().catch(console.error);</content>
<parameter name="filePath">/Users/srujansai/Desktop/Ultra-Dex/apps/cli/lib/utils/enhanced-encryption.js