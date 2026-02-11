// Copyright (c) 2026 Ultra-Dex

/**
 * SQLite Memory Provider
 * Robust, persistent storage for the Meta-Layer memory tiers.
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs/promises';

export class SQLiteProvider {
  constructor(dbPath) {
    this.dbPath = dbPath || path.join(process.cwd(), '.ultra-dex', 'memory.db');
    this.db = null;
  }

  async init() {
    if (this.db) return;

    // Ensure directory exists
    await fs.mkdir(path.dirname(this.dbPath), { recursive: true });

    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database
    });

    // Create tables for memory tiers
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
  }

  async add(tier, record) {
    await this.init();
    const table = `\${tier}_memory`;
    const metadata = JSON.stringify(record.metadata || {});
    
    await this.db.run(
      `INSERT OR REPLACE INTO \${table} (id, content, type, source, metadata) VALUES (?, ?, ?, ?, ?)`,
      [record.id, record.content, record.type, record.source, metadata]
    );
    
    return record;
  }

  async get(tier, id) {
    await this.init();
    const table = `\${tier}_memory`;
    const row = await this.db.get(`SELECT * FROM \${table} WHERE id = ?`, [id]);
    if (row) {
      row.metadata = JSON.parse(row.metadata);
    }
    return row;
  }

  async list(tier, limit = 100) {
    await this.init();
    const table = `\${tier}_memory`;
    const rows = await this.db.all(`SELECT * FROM \${table} ORDER BY timestamp DESC LIMIT ?`, [limit]);
    return rows.map(row => ({
      ...row,
      metadata: JSON.parse(row.metadata)
    }));
  }

  async delete(tier, id) {
    await this.init();
    const table = `\${tier}_memory`;
    await this.db.run(`DELETE FROM \${table} WHERE id = ?`, [id]);
  }

  async query(tier, sql, params = []) {
    await this.init();
    const table = `\${tier}_memory`;
    // Ensure the query only targets the specified table for security
    if (!sql.toLowerCase().includes(table)) {
      throw new Error("Query must target the correct tier table");
    }
    return await this.db.all(sql, params);
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

export const sqliteProvider = new SQLiteProvider();
