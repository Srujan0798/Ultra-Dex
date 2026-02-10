/**
 * @fileoverview Index module
 * @module types/index
 */

import { Request } from 'express';

export interface ApiKeyData {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  tier: string;
  status: string;
  createdAt: string;
  lastUsedAt: string | null;
}

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      apiKey: ApiKeyData;
    }
  }
}

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
