/**
 * @fileoverview Auth module
 * @module services/auth
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';

interface ApiKeyData {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  tier: string;
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface CreateKeyInput {
  name: string;
  tier?: string;
}

// In-memory store for demo (replace with database in production)
const apiKeysStore: Map<string, ApiKeyData> = new Map();
const keyIndex: Map<string, string> = new Map(); // Maps full key to key ID

export class ApiKeyService {
  private generateKey(): { prefix: string; secret: string; hash: string } {
    const prefix = config.security.apiKeyPrefix;
    const secret = `${prefix}${uuidv4().replace(/-/g, '')}`;
    const hash = crypto.createHash('sha256').update(secret).digest('hex');
    return { prefix, secret, hash };
  }

  async validateKey(apiKey: string): Promise<ApiKeyData | null> {
    // In production: hash the key and lookup in database
    const keyId = keyIndex.get(apiKey);
    if (!keyId) return null;

    const keyData = apiKeysStore.get(keyId);
    if (!keyData || keyData.status !== 'active') return null;

    return keyData;
  }

  async createKey(userId: string, input: CreateKeyInput): Promise<ApiKeyData & { secret: string }> {
    const { prefix, secret, hash } = this.generateKey();
    const id = uuidv4();

    const keyData: ApiKeyData = {
      id,
      userId,
      name: input.name,
      prefix: prefix,
      tier: input.tier || 'free',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
    };

    apiKeysStore.set(id, keyData);
    keyIndex.set(secret, id);

    logger.info({ keyId: id, userId }, 'API key created');

    return { ...keyData, secret };
  }

  async listKeys(userId: string): Promise<ApiKeyData[]> {
    return Array.from(apiKeysStore.values()).filter((key) => key.userId === userId);
  }

  async getKey(id: string, userId: string): Promise<ApiKeyData | null> {
    const key = apiKeysStore.get(id);
    if (!key || key.userId !== userId) return null;
    return key;
  }

  async revokeKey(id: string, userId: string): Promise<boolean> {
    const key = apiKeysStore.get(id);
    if (!key || key.userId !== userId) return false;

    key.status = 'revoked';
    apiKeysStore.set(id, key);

    logger.info({ keyId: id, userId }, 'API key revoked');
    return true;
  }

  async rotateKey(id: string, userId: string): Promise<(ApiKeyData & { secret: string }) | null> {
    const key = apiKeysStore.get(id);
    if (!key || key.userId !== userId) return null;

    // Remove old key from index
    // In production, you would need to track the old secret to remove it

    const { prefix, secret, hash } = this.generateKey();
    keyIndex.set(secret, id);

    logger.info({ keyId: id, userId }, 'API key rotated');

    return { ...key, secret };
  }
}

/**
 * Error handler for auth
 * @param {Error} error - Error to handle
 */
function handleAuthError(error) {
  try {
    console.error('[auth]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
