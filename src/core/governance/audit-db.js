// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Audit Database Module
 * Persists governance audit entries to SQLite with graceful fallback
 * 
 * NOTE: Uses graceful fallback - if sqlite3 native module fails,
 * falls back to in-memory storage for compatibility.
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Default database path
const DEFAULT_DB_PATH = path.join(process.cwd(), '.ultra-dex', 'audit', 'governance.db');

// Graceful fallback for sqlite3 import
let sqlite3 = null;
let sqliteOpen = null;
let useMemoryFallback = false;

try {
  const sqlite3Module = await import('sqlite3');
  const sqliteModule = await import('sqlite');
  sqlite3 = sqlite3Module.default;
  sqliteOpen = sqliteModule.open;
} catch (error) {
  useMemoryFallback = true;
  console.warn('[audit-db] sqlite3 native module not available, using memory fallback');
}

/**
 * In-memory database fallback for when sqlite3 is not available
 */
class MemoryAuditDB {
  constructor() {
    this.records = [];
    this.initialized = true;
  }

  async exec() {
    // No-op for memory DB
  }

  async run(sql, params) {
    // Simulate insert
    this.records.push({
      id: params[0],
      action: params[1],
      agentId: params[2],
      task: params[3],
      resource: params[3],
      result: params[4],
      outcome: params[4],
      details: params[5],
      timestamp: params[6],
    });
  }

  async all(sql, params) {
    // Simulate query - return all or filter by agentId
    if (params && params[0]) {
      return this.records.filter(r => r.agentId === params[0]);
    }
    return [...this.records];
  }
}

/**
 * Audit Database class for persisting governance audit entries
 */
export class AuditDatabase {
  constructor(dbPath = DEFAULT_DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
    this.memoryMode = useMemoryFallback;
  }

  /**
   * Initialize the database connection and create tables if needed
   */
  async init() {
    if (this.db) {
      return this.db;
    }

    if (this.memoryMode) {
      // Use in-memory fallback
      this.db = new MemoryAuditDB();
      return this.db;
    }

    // Ensure directory exists
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Open database
    this.db = await sqliteOpen({
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
      task: taskText,
      resource: entry.resource || taskText,
      result: resultText,
      outcome: entry.outcome || resultText,
    };
  }

  /**
   * Query audit entries with optional filters
   * @param {Object} filters - Query filters
   * @returns {Promise<Array>} Array of audit entries
   */
  async query(filters = {}) {
    await this.init();

    if (this.memoryMode) {
      let rows = [...this.db.records];

      if (filters.agentId) {
        rows = rows.filter((row) => row.agentId === filters.agentId);
      }

      if (filters.action) {
        rows = rows.filter((row) => row.action === filters.action);
      }

      if (filters.resource) {
        rows = rows.filter((row) => row.task === filters.resource || row.resource === filters.resource);
      }

      if (filters.since) {
        const since = Number(filters.since);
        rows = rows.filter((row) => Number(row.timestamp) >= since);
      }

      rows.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

      if (filters.limit) {
        rows = rows.slice(0, filters.limit);
      }

      return rows.map((row) => ({
        ...row,
        task: row.task ?? row.resource ?? null,
        resource: row.resource ?? row.task ?? null,
        result: row.result ?? row.outcome ?? null,
        outcome: row.outcome ?? row.result ?? null,
        details:
          typeof row.details === 'string' && row.details
            ? JSON.parse(row.details)
            : (row.details ?? null),
        timestamp: Number(row.timestamp),
      }));
    }

    let sql = 'SELECT * FROM governance_audit WHERE 1=1';
    const params = [];

    if (filters.agentId) {
      sql += ' AND agentId = ?';
      params.push(filters.agentId);
    }

    if (filters.action) {
      sql += ' AND action = ?';
      params.push(filters.action);
    }

    if (filters.resource) {
      sql += ' AND task = ?';
      params.push(filters.resource);
    }

    if (filters.since) {
      sql += ' AND timestamp >= ?';
      params.push(filters.since.toString());
    }

    sql += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = await this.db.all(sql, params);

    // Parse details JSON
    return rows.map(row => ({
      ...row,
      task: row.task ?? row.resource ?? null,
      resource: row.resource ?? row.task ?? null,
      result: row.result ?? row.outcome ?? null,
      outcome: row.outcome ?? row.result ?? null,
      details:
        typeof row.details === 'string' && row.details
          ? JSON.parse(row.details)
          : (row.details ?? null),
      timestamp: parseInt(row.timestamp, 10),
    }));
  }

  /**
   * Get audit statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStats() {
    await this.init();

    const total = this.memoryMode 
      ? this.db.records.length 
      : (await this.db.all('SELECT COUNT(*) as count FROM governance_audit'))[0].count;

    return {
      total,
      mode: this.memoryMode ? 'memory' : 'sqlite',
    };
  }

  /**
   * Close the database connection
   */
  async close() {
    if (this.db && !this.memoryMode) {
      await this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
let auditDB = null;

/**
 * Get the singleton audit database instance
 * @returns {AuditDatabase} The audit database instance
 */
export function getAuditDB() {
  if (!auditDB) {
    auditDB = new AuditDatabase();
  }
  return auditDB;
}

/**
 * Record a governance audit entry
 * @param {Object} entry - The audit entry to record
 * @returns {Promise<Object>} The recorded entry
 */
export async function recordAudit(entry) {
  const db = getAuditDB();
  return db.insert(entry);
}

/**
 * Query governance audit entries
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} Array of audit entries
 */
export async function queryAudit(filters = {}) {
  const db = getAuditDB();
  return db.query(filters);
}

export default AuditDatabase;
