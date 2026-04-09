var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.join(process.cwd(), '.ultra-dex', 'audit', 'governance.db');
let sqlite3 = null;
let sqliteOpen = null;
let useMemoryFallback = false;
try {
  const sqlite3Module = await import('sqlite3');
  const sqliteModule = await import('sqlite');
  sqlite3 = sqlite3Module.default;
  sqliteOpen = sqliteModule.open;
} catch (_error) {
  useMemoryFallback = true;
  console.warn('[audit-db] sqlite3 native module not available, using memory fallback');
}
class MemoryAuditDB {
  constructor() {
    this.records = [];
    this.initialized = true;
  }
  async exec() {}
  async run(sql, params) {
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
    if (params && params[0]) {
      return this.records.filter((r) => r.agentId === params[0]);
    }
    return [...this.records];
  }
}
let AuditDatabase = class {
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
      this.db = new MemoryAuditDB();
      return this.db;
    }
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      this.db = await sqliteOpen({
        filename: this.dbPath,
        driver: sqlite3.Database,
      });
      await this._createTable();
    } catch (error) {
      if (error.code === 'EPERM' || error.code === 'EACCES' || error.code === 'EROFS') {
        this.memoryMode = true;
        this.db = new MemoryAuditDB();
      } else {
        this.memoryMode = true;
        this.db = new MemoryAuditDB();
      }
    }
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
      let rows2 = [...this.db.records];
      if (filters.agentId) {
        rows2 = rows2.filter((row) => row.agentId === filters.agentId);
      }
      if (filters.action) {
        rows2 = rows2.filter((row) => row.action === filters.action);
      }
      if (filters.resource) {
        rows2 = rows2.filter(
          (row) => row.task === filters.resource || row.resource === filters.resource
        );
      }
      if (filters.since) {
        const since = Number(filters.since);
        rows2 = rows2.filter((row) => Number(row.timestamp) >= since);
      }
      rows2.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
      if (filters.limit) {
        rows2 = rows2.slice(0, filters.limit);
      }
      return rows2.map((row) => ({
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
};
AuditDatabase = __decorateClass([singleton()], AuditDatabase);
let auditDB = null;
function getAuditDB() {
  if (!auditDB) {
    auditDB = new AuditDatabase();
  }
  return auditDB;
}
async function recordAudit(entry) {
  const db = getAuditDB();
  return db.insert(entry);
}
async function queryAudit(filters = {}) {
  const db = getAuditDB();
  return db.query(filters);
}
var audit_db_default = AuditDatabase;
export { AuditDatabase, audit_db_default as default, getAuditDB, queryAudit, recordAudit };
