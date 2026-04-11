import { IAuditStore, AuditEvent, AuditFilters } from './audit-store.js';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const DEFAULT_DB_PATH = path.join(process.cwd(), '.ultra-dex', 'audit', 'governance.db');

let sqlite3: any = null;
let sqliteOpen: any = null;
let useMemoryFallback = false;

try {
  // Try to load sqlite3
  // In a real environment, these would be top-level imports if we're sure they exist
  // but keeping the dynamic check for now to match existing behavior
} catch (_error) {
  useMemoryFallback = true;
}

class MemoryAuditDB {
  records: any[] = [];
  initialized = true;

  async exec(_sql: string) {}
  async run(_sql: string, params: any[]) {
    this.records.push({
      id: params[0],
      action: params[1],
      agentId: params[2],
      task: params[3],
      result: params[4],
      details: params[5],
      timestamp: params[6],
    });
  }
  async all(sql: string, params: any[]) {
    if (sql.includes('COUNT(*)')) {
      return [{ count: this.records.length }];
    }
    if (params && params[0]) {
      return this.records.filter((r) => r.agentId === params[0]);
    }
    return [...this.records];
  }
  async close() {}
}

export class SqliteAuditStore implements IAuditStore {
  public dbPath: string;
  public db: any = null;
  public memoryMode: boolean = false;

  constructor(dbPath = DEFAULT_DB_PATH) {
    this.dbPath = dbPath;
  }

  async init() {
    if (this.db) return;

    try {
      const sqlite3Module = await import('sqlite3');
      const sqliteModule = await import('sqlite');
      sqlite3 = sqlite3Module.default;
      sqliteOpen = sqliteModule.open;

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
      console.warn('[sqlite-audit-store] sqlite3 not available or error opening, using memory fallback:', error);
      this.memoryMode = true;
      this.db = new MemoryAuditDB();
    }
  }

  private async _createTable() {
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

  async logEvent(event: Partial<AuditEvent>): Promise<void> {
    await this.init();
    const id = event.id || `audit-${uuidv4()}`;
    const timestamp = event.timestamp || Date.now();
    
    const insertSQL = `
      INSERT INTO governance_audit (id, action, agentId, task, result, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const detailsJson = event.details ? JSON.stringify(event.details) : null;
    const resultText = event.outcome || event.result || 'unknown';
    const taskText = event.task || event.resource || null;

    await this.db.run(insertSQL, [
      id,
      event.action || null,
      event.agentId || null,
      taskText,
      resultText,
      detailsJson,
      timestamp.toString(),
    ]);
  }

  async queryEvents(filters: AuditFilters): Promise<AuditEvent[]> {
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
        rows = rows.filter((row) => Number(row.timestamp) >= (filters.since || 0));
      }
      if (filters.until) {
        rows = rows.filter((row) => Number(row.timestamp) <= (filters.until || Infinity));
      }

      rows.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));

      if (filters.limit) {
        rows = rows.slice(0, filters.limit);
      }

      return rows.map((row) => this.mapRowToEvent(row));
    }

    let sql = 'SELECT * FROM governance_audit WHERE 1=1';
    const params: any[] = [];

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
    if (filters.until) {
      sql += ' AND timestamp <= ?';
      params.push(filters.until.toString());
    }

    sql += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows = await this.db.all(sql, params);
    return rows.map((row: any) => this.mapRowToEvent(row));
  }

  private mapRowToEvent(row: any): AuditEvent {
    return {
      id: row.id,
      action: row.action,
      agentId: row.agentId,
      task: row.task,
      resource: row.task,
      result: row.result,
      outcome: row.result,
      details: typeof row.details === 'string' && row.details ? JSON.parse(row.details) : (row.details ?? null),
      timestamp: parseInt(row.timestamp, 10),
    };
  }

  async exportCSV(dateRange?: { since?: number; until?: number }): Promise<string> {
    const events = await this.queryEvents({
      since: dateRange?.since,
      until: dateRange?.until,
    });

    if (events.length === 0) return '';

    const headers = ['id', 'timestamp', 'action', 'agentId', 'task', 'result', 'outcome', 'details'];
    const escape = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
      if (str.includes('"') || str.includes(',') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const lines = [headers.join(',')];
    for (const event of events) {
      const row = [
        event.id,
        new Date(event.timestamp).toISOString(),
        event.action,
        event.agentId,
        event.task || '',
        event.result || '',
        event.outcome || '',
        event.details ? JSON.stringify(event.details) : '',
      ];
      lines.push(row.map(escape).join(','));
    }

    return lines.join('\n');
  }

  async getStats() {
    await this.init();
    const rows = await this.db.all('SELECT COUNT(*) as count FROM governance_audit', []);
    return {
      total: rows[0].count,
      mode: this.memoryMode ? 'memory' : 'sqlite',
    };
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }
}
