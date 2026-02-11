// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import { marketplaceClient } from './client.js';

export async function publishAgent(agentPath) {
  const content = await fs.readFile(agentPath, 'utf8');
  const payload = {
    name: path.basename(agentPath, path.extname(agentPath)),
    version: '1.0.0',
    systemPrompt: content,
  };

  return marketplaceClient.submitAgent(payload);
}

/**
 * Safe execution wrapper with error handling for publish
 * @param {Function} fn - Async function to execute
 * @param {string} [context='publish'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'publish') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
