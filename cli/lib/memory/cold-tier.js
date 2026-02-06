// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';
import crypto from 'node:crypto';

const DEFAULT_PATH = path.resolve(process.cwd(), '.ultra-dex', 'memory', 'cold.json');

export class ColdTier {
  constructor(options = {}) {
    this.storagePath = options.storagePath || DEFAULT_PATH;
    this.entries = [];
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await fs.mkdir(path.dirname(this.storagePath), { recursive: true });
    try {
      const raw = await fs.readFile(this.storagePath, 'utf8');
      const data = JSON.parse(raw);
      this.entries = data.entries || [];
    } catch {
      this.entries = [];
    }
    this.initialized = true;
  }

  async persist() {
    const payload = { entries: this.entries };
    await fs.writeFile(this.storagePath, JSON.stringify(payload, null, 2), 'utf8');
  }

  async add(entry) {
    await this.init();
    const record = {
      id: entry.id || crypto.randomUUID(),
      content: entry.content,
      type: entry.type || 'decision',
      timestamp: entry.timestamp || new Date().toISOString(),
      source: entry.source || { agent: 'system' },
      relations: entry.relations || [],
    };
    this.entries.push(record);
    await this.persist();
    return record;
  }

  async list(limit = 50) {
    await this.init();
    return this.entries.slice(-limit);
  }

  async search(query) {
    await this.init();
    const lower = query.toLowerCase();
    return this.entries.filter((entry) => entry.content.toLowerCase().includes(lower));
  }

  async why(query) {
    await this.init();
    const matched = await this.search(query);
    if (matched.length === 0) return [];

    const relatedIds = new Set();
    matched.forEach((entry) => entry.relations.forEach((rel) => relatedIds.add(rel)));

    const related = this.entries.filter(
      (entry) => relatedIds.has(entry.id) || relatedIds.has(entry.content)
    );
    return [...matched, ...related];
  }
}

export default ColdTier;
