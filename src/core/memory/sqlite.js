// Copyright (c) 2026 Ultra-Dex

/**
 * SQLite Memory Provider
 * Falls back to in-memory mode when sqlite dependencies are unavailable.
 */

import path from 'path';
import fs from 'fs/promises';

export class SQLiteProvider {
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(process.cwd(), '.ultra-dex', 'memory.db');
    this.db = null;
    this.mode = 'sqlite';
    this.memory = {
      hot: new Map(),
      warm: new Map(),
      cold: new Map(),
    };
  }

  async init() {
    if (this.db || this.mode === 'memory') return;

    try {
      const sqlite3Mod = await import('sqlite3');
      const sqliteMod = await import('sqlite');
      const sqlite3 = sqlite3Mod.default || sqlite3Mod;
      const { open } = sqliteMod;

      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });

      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database,
      });

      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS hot_memory (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          type TEXT NOT NULL,
          source TEXT,
          metadata TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS warm_memory (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          type TEXT NOT NULL,
          source TEXT,
          metadata TEXT,
          vector_id TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS cold_memory (
          id TEXT PRIMARY KEY,
          content TEXT NOT NULL,
          type TEXT NOT NULL,
          source TEXT,
          metadata TEXT,
          decision_reason TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_hot_type ON hot_memory(type);
        CREATE INDEX IF NOT EXISTS idx_warm_type ON warm_memory(type);
        CREATE INDEX IF NOT EXISTS idx_cold_type ON cold_memory(type);
      `);
    } catch {
      this.mode = 'memory';
    }
  }

  toMemoryRecord(record) {
    return {
      ...record,
      metadata: record.metadata || {},
      timestamp: record.timestamp || new Date().toISOString(),
    };
  }

  getTierStore(tier) {
    return this.memory[tier] || this.memory.hot;
  }

  async add(tier, record) {
    await this.init();

    if (this.mode === 'memory') {
      const store = this.getTierStore(tier);
      const normalized = this.toMemoryRecord(record);
      store.set(record.id, normalized);
      return normalized;
    }

    const table = `${tier}_memory`;
    const metadata = JSON.stringify(record.metadata || {});

    await this.db.run(
      `INSERT OR REPLACE INTO ${table} (id, content, type, source, metadata) VALUES (?, ?, ?, ?, ?)`,
      [record.id, record.content, record.type, record.source, metadata]
    );

    return record;
  }

  async get(tier, id) {
    await this.init();

    if (this.mode === 'memory') {
      const store = this.getTierStore(tier);
      return store.get(id) || null;
    }

    const table = `${tier}_memory`;
    const row = await this.db.get(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    if (row) {
      row.metadata = JSON.parse(row.metadata || '{}');
    }
    return row;
  }

  async list(tier, limit = 100) {
    await this.init();

    if (this.mode === 'memory') {
      const store = this.getTierStore(tier);
      return Array.from(store.values())
        .sort((left, right) => String(right.timestamp).localeCompare(String(left.timestamp)))
        .slice(0, limit);
    }

    const table = `${tier}_memory`;
    const rows = await this.db.all(`SELECT * FROM ${table} ORDER BY timestamp DESC LIMIT ?`, [limit]);
    return rows.map((row) => ({
      ...row,
      metadata: JSON.parse(row.metadata || '{}'),
    }));
  }

  async delete(tier, id) {
    await this.init();

    if (this.mode === 'memory') {
      this.getTierStore(tier).delete(id);
      return;
    }

    const table = `${tier}_memory`;
    await this.db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
  }

  async query(tier, sql, params = []) {
    await this.init();
    const table = `${tier}_memory`;

    if (!sql.toLowerCase().includes(table)) {
      throw new Error(`Query must target the correct tier table: ${table}`);
    }

    if (this.mode === 'memory') {
      const store = this.getTierStore(tier);
      const all = Array.from(store.values());

      // Support the subset used by MemoryManager (LIKE + LIMIT)
      if (sql.toLowerCase().includes('content like')) {
        const like = String(params[0] || '').replace(/%/g, '').toLowerCase();
        const limit = Number(params[1] || all.length);
        return all.filter((row) => String(row.content).toLowerCase().includes(like)).slice(0, limit);
      }

      return all;
    }

    return this.db.all(sql, params);
  }

  async close() {
    if (this.mode === 'memory') {
      this.memory.hot.clear();
      this.memory.warm.clear();
      this.memory.cold.clear();
      return;
    }

    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const sqliteProvider = new SQLiteProvider();
