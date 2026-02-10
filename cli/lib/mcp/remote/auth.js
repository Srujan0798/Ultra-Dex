// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Auth module
 * @module remote/auth
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

const AUTH_PATH = path.resolve(process.cwd(), '.ultra-dex', 'remote-auth.json');

export async function loadAuthConfig() {
  try {
    const content = await fs.readFile(AUTH_PATH, 'utf8');
    return JSON.parse(content);
  } catch {
    return { keys: [] };
  }
}

export async function saveAuthConfig(config) {
  await fs.mkdir(path.dirname(AUTH_PATH), { recursive: true });
  await fs.writeFile(AUTH_PATH, JSON.stringify(config, null, 2));
}

export async function generateApiKey(label = 'default') {
  const key = `udx_${crypto.randomBytes(24).toString('hex')}`;
  const config = await loadAuthConfig();
  config.keys = config.keys || [];
  config.keys.push({ key, label, createdAt: new Date().toISOString() });
  await saveAuthConfig(config);
  return key;
}

export async function validateApiKey(key) {
  const config = await loadAuthConfig();
  return (config.keys || []).some((entry) => entry.key === key);
}

export function signToken(payload, secret) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  if (expected !== signature) return null;
  return JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
}

export const authPaths = { AUTH_PATH };
