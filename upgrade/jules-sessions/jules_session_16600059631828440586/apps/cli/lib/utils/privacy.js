// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Privacy module
 * @module utils/privacy
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

const DEFAULT_CONFIG = {
  localOnly: true,
  encryption: false,
};

const CONFIG_PATHS = [
  path.join(process.cwd(), '.ultra-dex', 'config.json'),
  path.join(homedir(), '.ultra-dex', 'config.json'),
];

export function getPrivacyConfig() {
  for (const configPath of CONFIG_PATHS) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(raw);
      return { ...DEFAULT_CONFIG, ...(config.privacy || {}) };
    } catch {
      // ignore
    }
  }
  return { ...DEFAULT_CONFIG };
}

export function stripPII(text = '') {
  if (!text) return text;
  let output = String(text);
  // Emails
  output = output.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]');
  // API keys / tokens (simple heuristic)
  output = output.replace(/(sk-|rk-|pk_)[A-Za-z0-9_-]{10,}/g, '[key]');
  // IP addresses
  output = output.replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '[ip]');
  return output;
}

export function sanitizePayload(payload, seen = new WeakSet()) {
  if (payload === null || payload === undefined) return payload;
  
  if (typeof payload === 'string') return stripPII(payload);
  if (typeof payload === 'number' || typeof payload === 'boolean') return payload;
  if (typeof payload === 'symbol') return payload.toString();
  
  if (typeof payload === 'function') return '[Function]';

  if (typeof payload === 'object') {
    if (seen.has(payload)) {
      return '[Circular]';
    }
    seen.add(payload);

    if (Array.isArray(payload)) {
      return payload.map(item => sanitizePayload(item, seen));
    }
    
    if (payload instanceof Date) {
      return payload.toISOString();
    }
    
    if (payload instanceof Error) {
      const errorObj = {
        name: payload.name,
        message: stripPII(payload.message),
        stack: stripPII(payload.stack)
      };
      // Copy other enumerable properties if any
      for (const key in payload) {
        if (key !== 'name' && key !== 'message' && key !== 'stack') {
           errorObj[key] = sanitizePayload(payload[key], seen);
        }
      }
      return errorObj;
    }
    
    if (Buffer.isBuffer(payload)) {
      return '[Buffer]';
    }

    // Handle plain objects
    const sanitized = {};
    for (const [key, value] of Object.entries(payload)) {
      sanitized[key] = sanitizePayload(value, seen);
    }
    return sanitized;
  }
  
  return payload;
}

function getEncryptionKey() {
  const raw = process.env.ULTRA_DEX_PRIVACY_KEY;
  if (!raw) return null;
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptData(data) {
  const key = getEncryptionKey();
  if (!key) return data;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(data), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptData(payload) {
  const key = getEncryptionKey();
  if (!key) return payload;

  const buffer = Buffer.from(payload, 'base64');
  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const data = buffer.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function privacyReport() {
  const config = getPrivacyConfig();
  return {
    localOnly: config.localOnly,
    encryption: config.encryption,
    timestamp: new Date().toISOString(),
  };
}

export default {
  getPrivacyConfig,
  stripPII,
  sanitizePayload,
  encryptData,
  decryptData,
  privacyReport,
};
