// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

const STORAGE_DIR = path.join(process.cwd(), '.ultra-dex', 'persistent');
const DEFAULT_PATH = path.join(STORAGE_DIR, 'memory.json');

export async function savePersistent(data) {
  await fs.mkdir(STORAGE_DIR, { recursive: true });
  await fs.writeFile(DEFAULT_PATH, JSON.stringify(data, null, 2));
  return DEFAULT_PATH;
}

export async function loadPersistent() {
  const content = await fs.readFile(DEFAULT_PATH, 'utf8');
  return JSON.parse(content);
}

/**
 * Safe execution wrapper with error handling for persistent
 * @param {Function} fn - Async function to execute
 * @param {string} [context='persistent'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function _safeExecute(fn, context = 'persistent') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
