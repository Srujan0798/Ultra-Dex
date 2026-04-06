// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Audit Database Module
 * Persists governance audit entries to SQLite
 */

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default database path
const DEFAULT_DB_PATH = path.join(process.cwd(), '.ultra-dex', 'audit', 'governance.db');

/**
 * Audit Database class for persisting governance audit entries
 */
export class AuditDatabase {
  constructor(dbPath = DEFAULT_DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initialize the database connection and create tables if needed
   */
  async init() {
    if (this.db) {
      return this.db;
    }

    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Open database
    this.db = await open({
      filename: this.dbPath,
      driver: sqlite3.Database,
    });

    // Create table if not exists
    await this._createTable();

    return this.db;
  }

  /**
   * Create the governance_audit table
   */
  async _createTable() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS governance_audit (
        id TEXT PRIMARY KEY,
        action TEXT,
        agentId TEXT,
        task TEXT,
        result TEXT,
        details TEXT,
        timestamp TEXT
      )
    `;
    await this.db.exec(createTableSQL);

    // Create index for faster queries
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON governance_audit(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_agentId ON governance_audit(agentId);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON governance_audit(action);
    `;
    await this.db.exec(createIndexSQL);
  }

  /**
   * Insert a new audit entry
   * @param {Object} entry - Audit entry to insert
   * @returns {Promise<Object>} The inserted entry with generated id and timestamp
   */
  async insert(entry = {}) {
    await this.init();

    const id = entry.id || `audit-${uuidv4()}`;
    const timestamp = entry.timestamp || Date.now();

    const insertSQL = `
      INSERT INTO governance_audit (id, action, agentId, task, result, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const detailsJson = entry.details ? JSON.stringify(entry.details) : null;
    const resultText = entry.outcome || entry.result || 'unknown';
    const taskText = entry.task || entry.resource || null;

    await this.db.run(insertSQL, [
      id,
      entry.action || null,
      entry.agentId || null,
      taskText,
      resultText,
      detailsJson,
      timestamp.toString(),
    ]);

    return {
      ...entry,
      id,
      timestamp,
    };
  }

  /**
   * Query audit entries
   * @param {Object} options - Query options
   * @param {string} options.action - Filter by action
   * @param {string} options.agentId - Filter by agentId
   * @param {number} options.limit - Maximum number of entries to return (default 50)
   * @returns {Promise<Array>} Array of audit entries
   */
  async query(options = {}) {
    await this.init();

    const { action, agentId, limit = 50 } = options;

    let sql = 'SELECT * FROM governance_audit WHERE 1=1';
    const params = [];

    if (action) {
      sql += ' AND action = ?';
      params.push(action);
    }

    if (agentId) {
      sql += ' AND agentId = ?';
      params.push(agentId);
    }

    sql += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const rows = await this.db.all(sql, params);

    // Parse details JSON back to object
    // Map 'result' column to 'outcome' property for backward compatibility
    return rows.map((row) => ({
      id: row.id,
      action: row.action,
      agentId: row.agentId,
      task: row.task,
      result: row.result,
      outcome: row.result,
      details: row.details ? JSON.parse(row.details) : null,
      timestamp: parseInt(row.timestamp, 10),
    }));
  }

  /**
   * Close the database connection
   */
  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance for reuse
let defaultInstance = null;

/**
 * Get the default audit database instance
 * @returns {AuditDatabase}
 */
export function getAuditDatabase(dbPath) {
  if (!defaultInstance || (dbPath && defaultInstance.dbPath !== dbPath)) {
    defaultInstance = new AuditDatabase(dbPath);
  }
  return defaultInstance;
}

export default AuditDatabase;
