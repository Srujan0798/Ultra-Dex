// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview MUNI - Memory Unified Context Interface
 * @module muni
 * @description Unified context management layer combining storage, snapshots, and injection
 */

import { contextDB, ContextDatabase } from './database.js';
import { snapshots, ContextSnapshots } from './snapshots.js';
import { injector, ContextInjector } from './injector.js';

class MUNI {
  constructor(options = {}) {
    this.db = contextDB;
    this.snapshots = snapshots;
    this.injector = injector;
    this.sessionId = options.sessionId || `session-${Date.now()}`;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    await this.db.initialize();
    await this.snapshots.initialize();

    this.initialized = true;
  }

  // Store context entry
  async store(entry) {
    await this.ensureInitialized();
    return this.db.store({ ...entry, sessionId: entry.sessionId || this.sessionId });
  }

  // Retrieve context by ID
  async retrieve(id) {
    await this.ensureInitialized();
    return this.db.retrieve(id);
  }

  // Query context entries
  async query(filters = {}) {
    await this.ensureInitialized();
    return this.db.query({ ...filters, sessionId: filters.sessionId || this.sessionId });
  }

  // Create a snapshot
  async snapshot(label, metadata = {}) {
    await this.ensureInitialized();
    return this.snapshots.create(label, {
      ...metadata,
      sessionId: this.sessionId,
    });
  }

  // List snapshots
  async listSnapshots() {
    await this.ensureInitialized();
    return this.snapshots.list();
  }

  // Rollback to snapshot
  async rollback(snapshotName) {
    await this.ensureInitialized();
    return this.snapshots.rollback(snapshotName);
  }

  // Inject context into prompt
  async inject(prompt, context = {}) {
    await this.ensureInitialized();
    return this.injector.injectContext(prompt, this.sessionId, context);
  }

  // Inject file context
  async injectFile(prompt, filePath) {
    await this.ensureInitialized();
    return this.injector.injectFileContext(prompt, filePath, this.sessionId);
  }

  // Delete context entry
  async delete(id) {
    await this.ensureInitialized();
    return this.db.delete(id);
  }

  // Clear session context
  async clear() {
    await this.ensureInitialized();
    return this.db.clear(this.sessionId);
  }

  // Cleanup expired entries
  async cleanup() {
    await this.ensureInitialized();
    return this.db.cleanup();
  }

  // Close database connection
  close() {
    this.db.close();
  }

  async ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Singleton instance
const muni = new MUNI();

export { MUNI, contextDB, ContextDatabase, snapshots, ContextSnapshots, injector, ContextInjector };
export default muni;
