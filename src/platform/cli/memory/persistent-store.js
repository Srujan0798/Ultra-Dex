// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

const DEFAULT_PATH = path.join(process.cwd(), '.ultra-dex', 'memory.jsonl');

export class PersistentMemoryStore {
  constructor(filePath = DEFAULT_PATH) {
    this.filePath = filePath;
  }

  async add(entry) {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.appendFile(this.filePath, JSON.stringify(entry) + '\n');
  }

  async list() {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      return raw
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));
    } catch {
      return [];
    }
  }

  async query(text) {
    const entries = await this.list();
    const needle = text.toLowerCase();
    return entries.filter((e) => (e.content || '').toLowerCase().includes(needle));
  }
}
