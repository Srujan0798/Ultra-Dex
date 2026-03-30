// Copyright (c) 2026 Ultra-Dex

/**
 * Memory Manager - Agent memory persistence
 */

import fs from 'fs/promises';
import path from 'path';

export class MemoryManager {
  constructor(options = {}) {
    this.options = options;
    this.memories = new Map();
    this.memoryDir = path.join(process.cwd(), '.ultra-dex', 'memory');
  }

  async init() {
    await fs.mkdir(this.memoryDir, { recursive: true });
    return true;
  }

  async add(memory) {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const entry = {
      id,
      ...memory,
      createdAt: new Date().toISOString(),
    };
    this.memories.set(id, entry);
    return entry;
  }

  async get(id) {
    return this.memories.get(id);
  }

  async search(query) {
    return Array.from(this.memories.values()).filter(m =>
      m.content?.toLowerCase().includes(query.toLowerCase())
    );
  }

  async delete(id) {
    return this.memories.delete(id);
  }

  async list() {
    return Array.from(this.memories.values());
  }
}

export const memoryManager = new MemoryManager();
export default memoryManager;
