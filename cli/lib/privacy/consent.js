// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Consent module
 * @module privacy/consent
 */

import fs from 'fs/promises';
import path from 'path';

const CONSENT_PATH = path.resolve(process.cwd(), '.ultra-dex', 'privacy', 'consent.json');

async function ensureDir() {
  await fs.mkdir(path.dirname(CONSENT_PATH), { recursive: true });
}

export async function getConsent() {
  try {
    const raw = await fs.readFile(CONSENT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { consent: false, updatedAt: null };
  }
}

export async function setConsent(consent, meta = {}) {
  await ensureDir();
  const payload = {
    consent: Boolean(consent),
    updatedAt: new Date().toISOString(),
    meta,
  };
  await fs.writeFile(CONSENT_PATH, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}
