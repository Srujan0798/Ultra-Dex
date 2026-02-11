// Copyright (c) 2026 Ultra-Dex

/**
 * Enterprise API Key Management
 * Handles API key creation, validation, and revocation
 */

import crypto from 'crypto';
import chalk from 'chalk';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';

/**
 * API Key Manager
 */
export class APIKeyManager {
  constructor(options = {}) {
    this.keys = new Map(); // In-memory storage - should be persistent in production
    this.prefix = 'ud_';
    this.keyLength = 32;
  }

  /**
   * Generate a new API key
   */
  generateKey(name, options = {}) {
    const id = crypto.randomUUID();
    const secret = crypto.randomBytes(this.keyLength).toString('hex');
    const key = `${this.prefix}${secret}`;

    const keyData = {
      id,
      name,
      key: this.hashKey(key), // Store hash only
      prefix: key.substring(0, 12),
      createdAt: new Date().toISOString(),
      expiresAt: options.expiresAt || null,
      permissions: options.permissions || ['read'],
      rateLimit: options.rateLimit || 100, // requests per minute
      lastUsed: null,
      usageCount: 0,
      enabled: true,
      createdBy: options.createdBy || null,
    };

    this.keys.set(id, keyData);

    return {
      id,
      name,
      key, // Return full key only once
      prefix: keyData.prefix,
      createdAt: keyData.createdAt,
      expiresAt: keyData.expiresAt,
    };
  }

  /**
   * Hash an API key for storage
   */
  hashKey(key) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  /**
   * Validate an API key
   */
  validateKey(key) {
    if (!key || !key.startsWith(this.prefix)) {
      return { valid: false, error: 'Invalid key format' };
    }

    const hashedKey = this.hashKey(key);

    for (const [id, keyData] of this.keys) {
      if (keyData.key === hashedKey && keyData.enabled) {
        // Check expiration
        if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
          return { valid: false, error: 'Key expired' };
        }

        // Update usage
        keyData.lastUsed = new Date().toISOString();
        keyData.usageCount++;

        return {
          valid: true,
          keyId: id,
          name: keyData.name,
          permissions: keyData.permissions,
        };
      }
    }

    return { valid: false, error: 'Invalid key' };
  }

  /**
   * Revoke an API key
   */
  revokeKey(keyId) {
    const keyData = this.keys.get(keyId);
    if (!keyData) {
      return { success: false, error: 'Key not found' };
    }

    keyData.enabled = false;
    keyData.revokedAt = new Date().toISOString();

    return { success: true };
  }

  /**
   * List all API keys (without secrets)
   */
  listKeys() {
    return Array.from(this.keys.values()).map((key) => ({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      createdAt: key.createdAt,
      expiresAt: key.expiresAt,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
      enabled: key.enabled,
      permissions: key.permissions,
    }));
  }

  /**
   * Get a specific key by ID
   */
  getKey(keyId) {
    return this.keys.get(keyId);
  }

  /**
   * Check rate limit for a key
   */
  checkRateLimit(keyId) {
    const keyData = this.keys.get(keyId);
    if (!keyData) return { allowed: false, error: 'Key not found' };

    // Simple rate limiting - in production use Redis or similar
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    // This is a simplified version - production would track timestamps
    if (keyData.usageCount > keyData.rateLimit) {
      return { allowed: false, error: 'Rate limit exceeded' };
    }

    return { allowed: true };
  }
}

/**
 * Interactive API key management CLI
 */
export async function manageAPIKeys() {
  const { default: inquirer } = await import('inquirer');
  const manager = new APIKeyManager();

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'API Key Management:',
      choices: [
        { name: 'Create new API key', value: 'create' },
        { name: 'List all keys', value: 'list' },
        { name: 'Revoke a key', value: 'revoke' },
        { name: 'Exit', value: 'exit' },
      ],
    },
  ]);

  switch (action) {
    case 'create': {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Key name:',
          validate: (input) => input.length > 0 || 'Name is required',
        },
        {
          type: 'checkbox',
          name: 'permissions',
          message: 'Select permissions:',
          choices: [
            { name: 'Read', value: 'read', checked: true },
            { name: 'Write', value: 'write' },
            { name: 'Delete', value: 'delete' },
            { name: 'Admin', value: 'admin' },
          ],
        },
        {
          type: 'input',
          name: 'rateLimit',
          message: 'Rate limit (requests per minute):',
          default: '100',
          validate: (input) => !isNaN(input) || 'Must be a number',
        },
      ]);

      const key = manager.generateKey(answers.name, {
        permissions: answers.permissions,
        rateLimit: parseInt(answers.rateLimit),
      });

      printSuccess(chalk.green('\n✅ API Key created successfully!'));
      printInfo(chalk.yellow('\n⚠️  Copy your API key now - it will not be shown again!\n'));
      console.log(chalk.cyan(key.key));
      console.log(chalk.gray(`\nKey ID: ${key.id}`));
      console.log(chalk.gray(`Name: ${key.name}`));
      console.log(chalk.gray(`Permissions: ${key.permissions?.join(', ') || 'read'}`));
      break;
    }

    case 'list': {
      const keys = manager.listKeys();
      if (keys.length === 0) {
        printWarning(chalk.yellow('No API keys found'));
      } else {
        printInfo(chalk.white(`\n📋 API Keys (${keys.length} total):\n`));
        keys.forEach((key) => {
          const status = key.enabled ? chalk.green('✓') : chalk.red('✗');
          console.log(`${status} ${key.name} (${key.prefix}...)`);
          console.log(chalk.gray(`   ID: ${key.id}`));
          console.log(chalk.gray(`   Created: ${key.createdAt}`));
          console.log(chalk.gray(`   Last used: ${key.lastUsed || 'Never'}`));
          console.log(chalk.gray(`   Usage count: ${key.usageCount}`));
          console.log('');
        });
      }
      break;
    }

    case 'revoke': {
      const keys = manager.listKeys().filter((k) => k.enabled);
      if (keys.length === 0) {
        printWarning(chalk.yellow('No active keys to revoke'));
        break;
      }

      const { keyId } = await inquirer.prompt([
        {
          type: 'list',
          name: 'keyId',
          message: 'Select key to revoke:',
          choices: keys.map((k) => ({
            name: `${k.name} (${k.prefix}...)`,
            value: k.id,
          })),
        },
      ]);

      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure? This cannot be undone.',
          default: false,
        },
      ]);

      if (confirm) {
        const result = manager.revokeKey(keyId);
        if (result.success) {
          printSuccess(chalk.green('✅ Key revoked successfully'));
        } else {
          printError(chalk.red('Failed to revoke key:', result.error));
        }
      }
      break;
    }

    case 'exit':
      printInfo(chalk.gray('Exiting...'));
      break;
  }
}

// Export singleton
export const apiKeyManager = new APIKeyManager();

/**
 * Safe execution wrapper with error handling for api-keys
 * @param {Function} fn - Async function to execute
 * @param {string} [context='api-keys'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'api-keys') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
