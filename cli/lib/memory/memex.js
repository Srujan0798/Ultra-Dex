/**
 * Memex Vector Store
 * Local SQLite-backed semantic memory for AI interactions.
 */

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { createHash } from 'crypto';

const DEFAULT_VECTOR_SIZE = 64;

class MemexStore {
  constructor(projectRoot) {
    this.projectRoot = projectRoot || process.cwd();
    this.dbPath = join(this.projectRoot, '.ultra', 'memex', 'memex.db');
    this.db = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    const dbDir = join(this.projectRoot, '.ultra', 'memex');
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }

    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS interactions (
        id TEXT PRIMARY KEY,
        agent TEXT,
        provider TEXT,
        task TEXT,
        input TEXT,
        output TEXT,
        embedding TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS memex_index (
        id TEXT PRIMARY KEY,
        interaction_id TEXT NOT NULL,
        keyword TEXT NOT NULL,
        score REAL DEFAULT 1.0,
        FOREIGN KEY (interaction_id) REFERENCES interactions(id)
      );

      CREATE INDEX IF NOT EXISTS idx_memex_created ON interactions(created_at);
      CREATE INDEX IF NOT EXISTS idx_memex_agent ON interactions(agent);
      CREATE INDEX IF NOT EXISTS idx_memex_keyword ON memex_index(keyword);
    `);

    this.initialized = true;
  }

  async indexInteraction({ agent, provider, task, input, output, metadata = {} }) {
    await this.init();
    const id = this.generateId();
    const payload = `${task || ''}\n${input || ''}\n${output || ''}`;
    const embedding = this.generateSimpleEmbedding(payload);
    const now = new Date().toISOString();

    await this.db.run(
      'INSERT INTO interactions (id, agent, provider, task, input, output, embedding, metadata, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        id,
        agent || null,
        provider || null,
        task || null,
        input || '',
        output || '',
        JSON.stringify(embedding),
        JSON.stringify(metadata || {}),
        now
      ]
    );

    const keywords = this.extractKeywords(payload);
    for (const keyword of keywords) {
      await this.db.run(
        'INSERT INTO memex_index (id, interaction_id, keyword) VALUES (?, ?, ?)',
        [this.generateId(), id, keyword]
      );
    }

    return id;
  }

  async search(query, limit = 5) {
    await this.init();
    if (!query || typeof query !== 'string') return [];

    const queryEmbedding = this.generateSimpleEmbedding(query);
    const keywords = this.extractKeywords(query);

    let candidates = [];
    if (keywords.length > 0) {
      const placeholders = keywords.map(() => '?').join(',');
      candidates = await this.db.all(
        `SELECT DISTINCT i.*
         FROM interactions i
         JOIN memex_index mi ON i.id = mi.interaction_id
         WHERE mi.keyword IN (${placeholders})
         ORDER BY i.created_at DESC
         LIMIT 200`,
        keywords
      );
    } else {
      candidates = await this.db.all(
        `SELECT * FROM interactions ORDER BY created_at DESC LIMIT 200`
      );
    }

    const scored = candidates.map(row => {
      const embedding = JSON.parse(row.embedding || '[]');
      return {
        ...row,
        score: this.cosineSimilarity(queryEmbedding, embedding),
        metadata: this.safeJson(row.metadata)
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async deleteAfter(timestamp) {
    await this.init();
    if (!timestamp) return;
    await this.db.run('DELETE FROM memex_index WHERE interaction_id IN (SELECT id FROM interactions WHERE created_at >= ?)', [timestamp]);
    await this.db.run('DELETE FROM interactions WHERE created_at >= ?', [timestamp]);
  }

  safeJson(value) {
    try {
      return JSON.parse(value || '{}');
    } catch {
      return {};
    }
  }

  extractKeywords(text) {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while']);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word))
      .slice(0, 15);
  }

  generateSimpleEmbedding(text) {
    const words = this.extractKeywords(text);
    const embedding = new Array(DEFAULT_VECTOR_SIZE).fill(0);
    words.forEach(word => {
      const hash = word.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      embedding[hash % DEFAULT_VECTOR_SIZE] += 1;
    });
    return embedding;
  }

  cosineSimilarity(vecA, vecB) {
    if (!vecA.length || !vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    const len = Math.max(vecA.length, vecB.length);
    for (let i = 0; i < len; i++) {
      const a = vecA[i] || 0;
      const b = vecB[i] || 0;
      dot += a * b;
      normA += a * a;
      normB += b * b;
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  generateId() {
    return createHash('sha256')
      .update(Date.now() + Math.random().toString())
      .digest('hex')
      .substring(0, 16);
  }
}

export function createMemexStore(projectRoot) {
  return new MemexStore(projectRoot);
}

export const memex = new MemexStore(process.cwd());

export default MemexStore;

