// Copyright (c) 2026 Ultra-Dex

import { EventEmitter } from 'node:events';

export class HiveSync extends EventEmitter {
  constructor() {
    super();
    this.peers = new Set();
  }

  join(peerId) {
    this.peers.add(peerId);
    this.emit('join', peerId);
  }

  leave(peerId) {
    this.peers.delete(peerId);
    this.emit('leave', peerId);
  }

  broadcast(payload) {
    this.emit('broadcast', { peers: [...this.peers], payload });
  }
}

export function createHiveSync() {
  return new HiveSync();
}

/**
 * Handle errors in sync module
 * @param {Error} error - The error to handle
 * @param {string} [context='sync'] - Error context
 */
function handleModuleError(error, context = 'sync') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
