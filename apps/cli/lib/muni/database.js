// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview MUNI context database - SQLite storage for agent context
 * @module muni/database
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.resolve(process.cwd(), '.ultra', 'muni.db');

class ContextDatabase {
  constructor(dbPath = DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
  }

  async initialize() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS context_entries (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        agent TEXT NOT NULL,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT DEFAULT '{}',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ttl INTEGER DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS context_vectors (
        id TEXT PRIMARY KEY,
        context_id TEXT NOT NULL,
        embedding BLOB NOT NULL,
        FOREIGN KEY (context_id) REFERENCES context_entries(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS context_tags (
        context_id TEXT NOT NULL,
        tag TEXT NOT NULL,
        PRIMARY KEY (context_id, tag),
        FOREIGN KEY (context_id) REFERENCES context_entries(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_context_session ON context_entries(session_id);
      CREATE INDEX IF NOT EXISTS idx_context_agent ON context_entries(agent);
      CREATE INDEX IF NOT EXISTS idx_context_type ON context_entries(type);
      CREATE INDEX IF NOT EXISTS idx_context_created ON context_entries(created_at);
    `);
  }

  async store(entry) {
    const id = entry.id || `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO context_entries (id, session_id, agent, type, content, metadata, ttl)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      entry.sessionId || 'default',
      entry.agent || 'unknown',
      entry.type || 'context',
      typeof entry.content === 'string' ? entry.content : JSON.stringify(entry.content),
      JSON.stringify(entry.metadata || {}),
      entry.ttl || null
    );

    if (entry.tags && entry.tags.length > 0) {
      const tagStmt = this.db.prepare('INSERT OR IGNORE INTO context_tags (context_id, tag) VALUES (?, ?)');
      const insertTags = this.db.transaction((tags) => {
        for (const tag of tags) {
          tagStmt.run(id, tag);
        }
      });
      insertTags(entry.tags);
    }

    return { id, ...entry };
  }

  async retrieve(id) {
    const stmt = this.db.prepare('SELECT * FROM context_entries WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;

    return {
      ...row,
      metadata: JSON.parse(row.metadata),
      tags: this.getTags(row.id),
    };
  }

  async query(filters = {}) {
    let query = 'SELECT * FROM context_entries WHERE 1=1';
    const params = [];

    if (filters.sessionId) {
      query += ' AND session_id = ?';
      params.push(filters.sessionId);
    }
    if (filters.agent) {
      query += ' AND agent = ?';
      params.push(filters.agent);
    }
    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.tags) {
      query += ' AND id IN (SELECT context_id FROM context_tags WHERE tag IN (?))';
      params.push(filters.tags.join(','));
    }

    query += ' ORDER BY created_at DESC';
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = this.db.prepare(query).all(...params);
    return rows.map((row) => ({
      ...row,
      metadata: JSON.parse(row.metadata),
    }));
  }

  async delete(id) {
    const stmt = this.db.prepare('DELETE FROM context_entries WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  async clear(sessionId) {
    const stmt = this.db.prepare('DELETE FROM context_entries WHERE session_id = ?');
    const result = stmt.run(sessionId || 'default');
    return result.changes;
  }

  getTags(contextId) {
    const stmt = this.db.prepare('SELECT tag FROM context_tags WHERE context_id = ?');
    return stmt.all(contextId).map((row) => row.tag);
  }

  async cleanup() {
    // Remove expired entries
    const stmt = this.db.prepare(`
      DELETE FROM context_entries 
      WHERE ttl IS NOT NULL 
        AND datetime(created_at, '+' || ttl || ' seconds') < datetime('now')
    `);
    const result = stmt.run();
    return result.changes;
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

export const contextDB = new ContextDatabase();

export { ContextDatabase };
export default ContextDatabase;
