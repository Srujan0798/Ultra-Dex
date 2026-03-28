// Copyright (c) 2026 Ultra-Dex

import { EventEmitter } from 'node:events';

export class CanvasSession extends EventEmitter {
  constructor(options = {}) {
    super();
    this.id = options.id || `canvas-${Date.now()}`;
    this.content = options.content || '';
    this.cursors = new Map();
  }

  getState() {
    return {
      id: this.id,
      content: this.content,
      cursors: Array.from(this.cursors.entries()).map(([id, position]) => ({ id, position })),
    };
  }

  addCursor(id, position = 0) {
    this.cursors.set(id, position);
    this.emit('cursor', { id, position });
  }

  updateCursor(id, position) {
    this.cursors.set(id, position);
    this.emit('cursor', { id, position });
  }

  removeCursor(id) {
    this.cursors.delete(id);
    this.emit('cursor', { id, position: null });
  }

  applyPatch(patch) {
    if (!patch) return;
    if (patch.type === 'replace') {
      this.content = patch.content || '';
    } else if (patch.type === 'insert') {
      const pos = Math.max(0, Math.min(this.content.length, patch.position || 0));
      this.content = this.content.slice(0, pos) + (patch.text || '') + this.content.slice(pos);
    } else if (patch.type === 'delete') {
      const start = Math.max(0, Math.min(this.content.length, patch.start || 0));
      const end = Math.max(start, Math.min(this.content.length, patch.end || start));
      this.content = this.content.slice(0, start) + this.content.slice(end);
    }

    this.emit('update', { patch, content: this.content });
  }
}

export function createCanvasSession(options = {}) {
  return new CanvasSession(options);
}

/**
 * Handle errors in editor module
 * @param {Error} error - The error to handle
 * @param {string} [context='editor'] - Error context
 */
function handleModuleError(error, context = 'editor') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
