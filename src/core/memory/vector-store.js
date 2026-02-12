// Copyright (c) 2026 Ultra-Dex

/**
 * Vector Store with SQLite-backed persistence and in-memory fallback.
 */

import path from 'path';
import fs from 'fs/promises';
import { embedText } from './embeddings.js';

export class VectorStore {
  constructor(options = {}) {
    this.storagePath = options.storagePath || path.resolve(process.cwd(), '.ultra-dex', 'memory.db');
    this.embeddings = options.embeddings || null;
    this.dimensions = options.dimensions || 128;
    this.db = null;
    this.mode = 'sqlite';
    this.memory = new Map();
  }

  async init() {
    if (this.db || this.mode === 'memory') return;

    try {
      const sqlite3Mod = await import('sqlite3');
      const sqliteMod = await import('sqlite');
      const sqlite3 = sqlite3Mod.default || sqlite3Mod;
      const { open } = sqliteMod;

      await fs.mkdir(path.dirname(this.storagePath), { recursive: true });
      this.db = await open({ filename: this.storagePath, driver: sqlite3.Database });
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS vectors (
          id TEXT PRIMARY KEY,
          text TEXT NOT NULL,
          embedding TEXT NOT NULL,
          metadata TEXT,
          created_at TEXT
        );
      `);
    } catch {
      this.mode = 'memory';
    }
  }

  async add(id, text, metadata = {}) {
    await this.init();
    const embedding = await this.embed(text);
    const payload = {
      id,
      text,
      embedding,
      metadata,
      created_at: new Date().toISOString(),
    };

    if (this.mode === 'memory') {
      this.memory.set(id, payload);
      return payload;
    }

    await this.db.run(
      `INSERT OR REPLACE INTO vectors (id, text, embedding, metadata, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      id,
      text,
      JSON.stringify(embedding),
      JSON.stringify(metadata),
      payload.created_at
    );

    return payload;
  }

  async list(limit = 50) {
    await this.init();

    if (this.mode === 'memory') {
      return Array.from(this.memory.values())
        .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
        .slice(0, limit)
        .map((row) => ({ ...row }));
    }

    const rows = await this.db.all(`SELECT * FROM vectors ORDER BY created_at DESC LIMIT ?`, limit);
    return rows.map((row) => ({
      ...row,
      embedding: safeJson(row.embedding) || [],
      metadata: safeJson(row.metadata),
    }));
  }

  async remove(id) {
    await this.init();

    if (this.mode === 'memory') {
      this.memory.delete(id);
      return;
    }

    await this.db.run(`DELETE FROM vectors WHERE id = ?`, id);
  }

  async query(queryText, limit = 5) {
    await this.init();

    const queryEmbedding = await this.embed(queryText);
    const rows =
      this.mode === 'memory'
        ? Array.from(this.memory.values())
        : await this.db.all(`SELECT * FROM vectors`);

    const scored = rows.map((row) => {
      const embedding = this.mode === 'memory' ? row.embedding : JSON.parse(row.embedding);
      const score = cosineSimilarity(queryEmbedding, embedding);
      return {
        ...row,
        score,
        metadata: this.mode === 'memory' ? row.metadata : safeJson(row.metadata),
      };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async search(queryText, limit = 10) {
    return this.query(queryText, limit);
  }

  async clear({ olderThan = null } = {}) {
    await this.init();

    if (this.mode === 'memory') {
      if (!olderThan) {
        this.memory.clear();
        return;
      }
      for (const [id, value] of this.memory.entries()) {
        if (String(value.created_at) < String(olderThan)) {
          this.memory.delete(id);
        }
      }
      return;
    }

    if (olderThan) {
      await this.db.run(`DELETE FROM vectors WHERE created_at < ?`, olderThan);
      return;
    }

    await this.db.run(`DELETE FROM vectors`);
  }

  async close() {
    if (this.mode === 'memory') {
      this.memory.clear();
      return;
    }

    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  async embed(text) {
    if (this.embeddings?.embed) {
      const result = this.embeddings.embed(text);
      return result instanceof Promise ? await result : result;
    }
    return embedText(text, this.dimensions);
  }
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * (b[i] || 0);
    normA += a[i] * a[i];
    normB += (b[i] || 0) * (b[i] || 0);
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB) || 1;
  return dot / denom;
}

function safeJson(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export default VectorStore;
