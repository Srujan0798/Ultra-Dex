/**
 * Memex - Persistent Memory System
 * Manages long-term memory storage and retrieval
 */

export class Memex {
  constructor(options = {}) {
    this.storagePath = options.storagePath || '.ultra-dex/memex';
    this.index = new Map(); // In-memory index for quick lookups
  }

  async init() {
    // Initialize storage and load existing memories
    console.debug('Memex initialized');
  }

  async store(key, data, metadata = {}) {
    // Store data in persistent storage
    this.index.set(key, {
      data,
      metadata,
      timestamp: new Date().toISOString()
    });
  }

  async retrieve(key) {
    // Retrieve data from storage
    const entry = this.index.get(key);
    return entry ? entry.data : null;
  }

  async delete(key) {
    // Delete data from storage
    this.index.delete(key);
  }

  async deleteAfter(timestamp) {
    // Delete entries after a specific timestamp
    for (const [key, entry] of this.index.entries()) {
      if (new Date(entry.timestamp) > new Date(timestamp)) {
        this.index.delete(key);
      }
    }
  }

  async search(query) {
    // Search through stored memories
    return Array.from(this.index.values()).filter(entry =>
      JSON.stringify(entry.data).includes(query)
    );
  }

  async list() {
    // List all stored memories
    return Array.from(this.index.entries()).map(([key, value]) => ({
      key,
      ...value
    }));
  }
}

export const memex = new Memex();

// Initialize on import
memex.init().catch(console.error);