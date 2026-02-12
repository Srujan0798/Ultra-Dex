// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Hot Tier module
 * @module memory/hot-tier
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'node:crypto';

const DEFAULT_TTL_MS = 1000 * 60 * 60; // 1 hour

export class HotTier {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || DEFAULT_TTL_MS;
    this.storagePath =
      options.storagePath || path.resolve(process.cwd(), '.ultra-dex', 'memory', 'hot.json');
    this.entries = new Map();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await fs.mkdir(path.dirname(this.storagePath), { recursive: true });
    try {
      const raw = await fs.readFile(this.storagePath, 'utf8');
      const data = JSON.parse(raw);
      (data.entries || []).forEach((entry) => {
        if (!entry.expiresAt || new Date(entry.expiresAt).getTime() > Date.now()) {
          this.entries.set(entry.id, entry);
        }
      });
    } catch {
      // ignore
    }
    this.initialized = true;
    await this.persist();
  }

  async persist() {
    const payload = {
      entries: Array.from(this.entries.values()),
    };
    await fs.writeFile(this.storagePath, JSON.stringify(payload, null, 2), 'utf8');
  }

  async add(entry) {
    await this.init();
    const record = {
      id: entry.id || crypto.randomUUID(),
      content: entry.content,
      type: entry.type || 'note',
      timestamp: entry.timestamp || new Date().toISOString(),
      source: entry.source || { agent: 'system' },
      relations: entry.relations || [],
      expiresAt: new Date(Date.now() + this.ttlMs).toISOString(),
    };
    this.entries.set(record.id, record);
    await this.persist();
    return record;
  }

  async list() {
    await this.init();
    return Array.from(this.entries.values());
  }

  async search(query) {
    await this.init();
    const lower = query.toLowerCase();
    return Array.from(this.entries.values()).filter((entry) =>
      entry.content.toLowerCase().includes(lower)
    );
  }

  async clear() {
    this.entries.clear();
    await this.persist();
  }
}

export const hotTier = new HotTier();
export default HotTier;
