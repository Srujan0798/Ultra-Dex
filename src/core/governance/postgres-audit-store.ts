import { IAuditStore, AuditEvent, AuditFilters } from './audit-store.js';
import { getPostgresClient, PostgresClient } from '../database/postgres-client.js';
import { v4 as uuidv4 } from 'uuid';

export class PostgresAuditStore implements IAuditStore {
  private client: PostgresClient;
  private initialized: boolean = false;

  constructor() {
    this.client = getPostgresClient();
  }

  async init() {
    if (this.initialized) return;
    
    await this.client.init();
    if (!this.client.isFallbackMode()) {
      await this._createTable();
    }
    this.initialized = true;
  }

  private async _createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS governance_audit (
        id UUID PRIMARY KEY,
        action TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        task TEXT,
        result TEXT,
        details JSONB,
        timestamp BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON governance_audit(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_agent_id ON governance_audit(agent_id);
    `;
    await this.client.query(sql);
  }

  async logEvent(event: Partial<AuditEvent>): Promise<void> {
    await this.init();
    
    if (this.client.isFallbackMode()) {
      console.warn('[postgres-audit-store] Falling back to console log (Postgres unavailable)');
      console.info('[AUDIT]', JSON.stringify(event));
      return;
    }

    const id = event.id || uuidv4();
    const timestamp = event.timestamp || Date.now();
    
    const sql = `
      INSERT INTO governance_audit (id, action, agent_id, task, result, details, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const detailsJson = event.details ? JSON.stringify(event.details) : null;
    const resultText = event.outcome || event.result || 'unknown';
    const taskText = event.task || event.resource || null;

    try {
      await this.client.query(sql, [
        id,
        event.action || 'unknown',
        event.agentId || 'system',
        taskText,
        resultText,
        detailsJson,
        timestamp,
      ]);
    } catch (error) {
      console.error('[postgres-audit-store] Failed to log event:', error);
      throw error;
    }
  }

  async queryEvents(filters: AuditFilters): Promise<AuditEvent[]> {
    await this.init();

    if (this.client.isFallbackMode()) {
      return [];
    }

    let sql = 'SELECT * FROM governance_audit WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.agentId) {
      sql += ` AND agent_id = $${paramIndex++}`;
      params.push(filters.agentId);
    }
    if (filters.action) {
      sql += ` AND action = $${paramIndex++}`;
      params.push(filters.action);
    }
    if (filters.resource) {
      sql += ` AND task = $${paramIndex++}`;
      params.push(filters.resource);
    }
    if (filters.since) {
      sql += ` AND timestamp >= $${paramIndex++}`;
      params.push(filters.since);
    }
    if (filters.until) {
      sql += ` AND timestamp <= $${paramIndex++}`;
      params.push(filters.until);
    }

    sql += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    try {
      const result = await this.client.query(sql, params);
      return result.rows.map((row: any) => ({
        id: row.id,
        action: row.action,
        agentId: row.agent_id,
        task: row.task,
        resource: row.task,
        result: row.result,
        outcome: row.result,
        details: row.details,
        timestamp: Number(row.timestamp),
      }));
    } catch (error) {
      console.error('[postgres-audit-store] Failed to query events:', error);
      return [];
    }
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

  async close() {
    // Client is a singleton, we might not want to close it here
    // but the interface could have it if needed.
  }
}
