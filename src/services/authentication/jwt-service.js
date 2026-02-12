// Copyright (c) 2026 Ultra-Dex

import crypto from 'crypto';

async function loadJwtModule() {
  const mod = await import('jsonwebtoken');
  return mod.default || mod;
}

async function loadBcryptModule() {
  const mod = await import('bcryptjs');
  return mod.default || mod;
}

function ensureStringSecret(secret) {
  if (!secret || typeof secret !== 'string') {
    throw new Error('[auth] secret must be a non-empty string');
  }
}

export async function signToken(payload, secret, expiresIn = '1h') {
  ensureStringSecret(secret);

  try {
    const jwt = await loadJwtModule();
    return jwt.sign(payload, secret, { expiresIn });
  } catch {
    const now = Math.floor(Date.now() / 1000);
    const exp = typeof expiresIn === 'number' ? now + expiresIn : now + 3600;
    const body = { ...payload, exp };
    const base64Payload = Buffer.from(JSON.stringify(body)).toString('base64url');
    const signature = crypto.createHmac('sha256', secret).update(base64Payload).digest('base64url');
    return `${base64Payload}.${signature}`;
  }
}

export async function verifyToken(token, secret) {
  ensureStringSecret(secret);

  if (!token || typeof token !== 'string') {
    throw new Error('[auth] token must be a non-empty string');
  }

  try {
    const jwt = await loadJwtModule();
    return jwt.verify(token, secret);
  } catch {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) {
      throw new Error('[auth] invalid token format');
    }

    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      throw new Error('[auth] invalid token signature');
    }

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (parsed.exp && Date.now() / 1000 > parsed.exp) {
      throw new Error('[auth] token expired');
    }

    return parsed;
  }
}

export async function refreshToken(token, secret, expiresIn = '1h') {
  const decoded = await verifyToken(token, secret);
  const { exp, iat, nbf, ...payload } = decoded;
  return signToken(payload, secret, expiresIn);
}

export async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('[auth] password must be a non-empty string');
  }

  try {
    const bcrypt = await loadBcryptModule();
    return bcrypt.hash(password, 12);
  } catch {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
  }
}

export async function comparePassword(password, hash) {
  if (!password || typeof password !== 'string') return false;
  if (!hash || typeof hash !== 'string') return false;

  try {
    const bcrypt = await loadBcryptModule();
    return bcrypt.compare(password, hash);
  } catch {
    if (!hash.startsWith('scrypt$')) return false;
    const [, salt, storedHash] = hash.split('$');
    const candidate = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(storedHash));
  }
}
