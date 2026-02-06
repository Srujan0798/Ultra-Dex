// Copyright (c) 2026 Ultra-Dex

/**
 * SQLite-backed Vector Store (local)
 */

import path from 'path';
import fs from 'fs/promises';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { embedText } from './embeddings.js';

export class VectorStore {
  constructor(options = {}) {
    this.storagePath =
      options.storagePath || path.resolve(process.cwd(), '.ultra-dex', 'memory.db');
    this.db = null;
  }

  async init() {
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
  }

  async add(id, text, metadata = {}) {
    const embedding = embedText(text);
    const payload = {
      id,
      text,
      embedding: JSON.stringify(embedding),
      metadata: JSON.stringify(metadata),
      created_at: new Date().toISOString(),
    };
    await this.db.run(
      `INSERT OR REPLACE INTO vectors (id, text, embedding, metadata, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      payload.id,
      payload.text,
      payload.embedding,
      payload.metadata,
      payload.created_at
    );
    return payload;
  }

  async list(limit = 50) {
    const rows = await this.db.all(`SELECT * FROM vectors ORDER BY created_at DESC LIMIT ?`, limit);
    return rows.map((row) => ({
      ...row,
      metadata: safeJson(row.metadata),
    }));
  }

  async remove(id) {
    await this.db.run(`DELETE FROM vectors WHERE id = ?`, id);
  }

  async query(queryText, limit = 5) {
    const queryEmbedding = embedText(queryText);
    const rows = await this.db.all(`SELECT * FROM vectors`);
    const scored = rows.map((row) => {
      const embedding = JSON.parse(row.embedding);
      const score = cosineSimilarity(queryEmbedding, embedding);
      return { ...row, score, metadata: safeJson(row.metadata) };
    });

    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  async clear({ olderThan = null } = {}) {
    if (olderThan) {
      await this.db.run(`DELETE FROM vectors WHERE created_at < ?`, olderThan);
      return;
    }
    await this.db.run(`DELETE FROM vectors`);
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
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
