/**
 * Ultra-Dex Encryption & Security Utilities
 *
 * Production-grade encryption for sensitive data at rest and in transit.
 * Uses Node.js crypto module with AES-256-GCM.
 */

import { randomBytes, createCipheriv, createDecipheriv, scryptSync, timingSafeEqual } from 'crypto';

// ──────────────────────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────────────────────

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

// ──────────────────────────────────────────────────────────────────────────────
// Encrypted Data Format
// ──────────────────────────────────────────────────────────────────────────────

export interface EncryptedData {
  ciphertext: string; // base64
  iv: string; // base64
  authTag: string; // base64
  salt: string; // base64
}

// ──────────────────────────────────────────────────────────────────────────────
// Encryption Service
// ──────────────────────────────────────────────────────────────────────────────

export interface EncryptionConfig {
  /** Master key for encryption (should be from env var) */
  masterKey: string;
  /** Key rotation period in days */
  keyRotationDays?: number;
}

export class EncryptionService {
  private masterKey: string;

  constructor(config: EncryptionConfig) {
    if (!config.masterKey || config.masterKey.length < 32) {
      throw new Error('Master key must be at least 32 characters');
    }
    this.masterKey = config.masterKey;
  }

  /**
   * Encrypt plaintext using AES-256-GCM
   */
  encrypt(plaintext: string): EncryptedData {
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);
    const key = this.deriveKey(this.masterKey, salt);

    const cipher = createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      salt: salt.toString('base64'),
    };
  }

  /**
   * Decrypt ciphertext using AES-256-GCM
   */
  decrypt(data: EncryptedData): string {
    const salt = Buffer.from(data.salt, 'base64');
    const iv = Buffer.from(data.iv, 'base64');
    const authTag = Buffer.from(data.authTag, 'base64');
    const ciphertext = Buffer.from(data.ciphertext, 'base64');

    const key = this.deriveKey(this.masterKey, salt);

    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Encrypt an object (JSON serialization)
   */
  encryptObject<T>(obj: T): EncryptedData {
    return this.encrypt(JSON.stringify(obj));
  }

  /**
   * Decrypt to an object (JSON parsing)
   */
  decryptObject<T>(data: EncryptedData): T {
    return JSON.parse(this.decrypt(data)) as T;
  }

  /**
   * Hash sensitive data (one-way, for comparison)
   */
  hash(data: string): string {
    const salt = randomBytes(16);
    const key = scryptSync(data, salt, 64);
    return salt.toString('base64') + ':' + key.toString('base64');
  }

  /**
   * Verify data against a hash
   */
  verify(data: string, hash: string): boolean {
    const [saltB64, keyB64] = hash.split(':');
    if (!saltB64 || !keyB64) return false;

    const salt = Buffer.from(saltB64, 'base64');
    const expectedKey = Buffer.from(keyB64, 'base64');
    const actualKey = scryptSync(data, salt, 64);

    return timingSafeEqual(expectedKey, actualKey);
  }

  private deriveKey(password: string, salt: Buffer): Buffer {
    return scryptSync(password, salt, KEY_LENGTH);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Token Service (for API keys, session tokens)
// ──────────────────────────────────────────────────────────────────────────────

export interface TokenPayload {
  sub: string; // user ID
  iat: number; // issued at
  exp: number; // expiration
  scopes: string[];
  [key: string]: unknown;
}

export class TokenService {
  private secret: string;
  private jwt: typeof import('jsonwebtoken');

  constructor(secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error('Token secret must be at least 32 characters');
    }
    this.secret = secret;
    // SECURITY: Use proper JWT library instead of custom implementation (H-003)
    this.jwt = require('jsonwebtoken');
  }

  /**
   * Generate a secure random token
   */
  generateToken(length = 32): string {
    return randomBytes(length).toString('base64url');
  }

  /**
   * Create a signed JWT token using jsonwebtoken library
   */
  createToken(payload: Omit<TokenPayload, 'iat'>): string {
    const now = Math.floor(Date.now() / 1000);
    const fullPayload = {
      ...payload,
      iat: now,
    };

    return this.jwt.sign(fullPayload, this.secret, {
      algorithm: 'HS256',
    });
  }

  /**
   * Verify and decode a token using jsonwebtoken library
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      const payload = this.jwt.verify(token, this.secret, {
        algorithms: ['HS256'],
      }) as TokenPayload;

      // Check expiration (redundant but explicit)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Secret Manager
// ──────────────────────────────────────────────────────────────────────────────

export class SecretManager {
  private secrets = new Map<string, string>();

  /**
   * Load secrets from environment variables
   */
  loadFromEnv(prefix = 'ULTRADEX_SECRET_'): void {
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix) && value) {
        const secretName = key.slice(prefix.length).toLowerCase();
        this.secrets.set(secretName, value);
      }
    }
  }

  /**
   * Get a secret by name
   */
  get(name: string): string | undefined {
    return this.secrets.get(name);
  }

  /**
   * Set a secret
   */
  set(name: string, value: string): void {
    this.secrets.set(name, value);
  }

  /**
   * Check if a secret exists
   */
  has(name: string): boolean {
    return this.secrets.has(name);
  }

  /**
   * Mask a secret for logging (show first 4 and last 4 chars only)
   */
  mask(secret: string): string {
    if (secret.length <= 8) return '****';
    return secret.slice(0, 4) + '...' + secret.slice(-4);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Security Utilities
// ──────────────────────────────────────────────────────────────────────────────

export function sanitizeInput(input: string): string {
  // Basic XSS prevention
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function generateId(prefix?: string): string {
  const id = randomBytes(16).toString('hex');
  return prefix ? `${prefix}_${id}` : id;
}

export function constantTimeCompare(a: string, b: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}
