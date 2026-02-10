// Copyright (c) 2026 Ultra-Dex

/**
 * Memex - Persistent Memory System
 * Manages long-term memory storage and retrieval
 */

import { VectorStore } from './vector-store.js';

export class Memex {
  constructor(options = {}) {
    this.storagePath = options.storagePath;
    this.store = new VectorStore({ storagePath: this.storagePath });
    this.ready = false;
  }

  async init() {
    if (this.ready) return;
    await this.store.init();
    this.ready = true;
  }

  async storeItem(key, data, metadata = {}) {
    await this.init();
    const text = typeof data === 'string' ? data : JSON.stringify(data);
    await this.store.add(key, text, metadata);
  }

  async store(key, data, metadata = {}) {
    return this.storeItem(key, data, metadata);
  }

  async retrieve(key) {
    await this.init();
    const rows = await this.store.query(key, 1);
    return rows.length ? rows[0].text : null;
  }

  async delete(key) {
    await this.init();
    await this.store.remove(key);
  }

  async deleteAfter(timestamp) {
    await this.init();
    await this.store.clear({ olderThan: timestamp });
  }

  async search(query, limit = 5) {
    await this.init();
    return this.store.query(query, limit);
  }

  async list(limit = 50) {
    await this.init();
    return this.store.list(limit);
  }

  async recordInteraction({ agent = 'unknown', input = '', output = '', metadata = {} }) {
    const id = `memex-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const text = `${input}\n\n${output}`.trim();
    return this.storeItem(id, text, { agent, ...metadata });
  }
}

export const memex = new Memex();

/**
 * Safe execution wrapper with error handling for memex
 * @param {Function} fn - Async function to execute
 * @param {string} [context='memex'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'memex') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
