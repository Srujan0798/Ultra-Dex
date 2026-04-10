/**
 * Postgres Audit Adapter
 * Provides PostgreSQL-backed storage for audit logs and billing data
 */

import { EventEmitter } from 'events';

export interface PostgresConfig {
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | object;
  schema?: string;
}

export interface AuditEntry {
  id?: string;
  action: string;
  agentId: string;
  task?: string;
  resource?: string;
  result?: string;
  outcome?: 'allowed' | 'denied' | 'error';
  details?: string | object;
  timestamp?: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditQuery {
  agentId?: string;
  action?: string;
  outcome?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
  offset?: number;
}

export interface BillingEvent {
  id?: string;
  userId: string;
  eventType: 'usage' | 'charge' | 'refund' | 'subscription';
  provider?: string;
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  cost?: number;
  currency?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Postgres-backed audit and billing storage
 */
export class PostgresAuditAdapter extends EventEmitter {
  private pool: any = null;
  private config: Required<PostgresConfig>;
  private initialized = false;
  private pg: typeof import('pg') | null = null;

  constructor(config: PostgresConfig = {}) {
    super();
    this.config = {
      url: config.url || process.env.DATABASE_URL || '',
      host: config.host || process.env.POSTGRES_HOST || 'localhost',
      port: config.port || parseInt(process.env.POSTGRES_PORT || '5432'),
      database: config.database || process.env.POSTGRES_DB || 'ultra_dex',
      user: config.user || process.env.POSTGRES_USER || 'postgres',
      password: config.password || process.env.POSTGRES_PASSWORD || '',
      ssl: config.ssl || process.env.POSTGRES_SSL === 'true',
      schema: config.schema || process.env.POSTGRES_SCHEMA || 'public',
    };
  }

  /**
   * Initialize database connection
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Dynamic import to avoid bundling issues
      const pg = await import('pg');
      this.pg = pg;
      
      const { Pool } = pg;
      
      this.pool = new Pool({
        connectionString: this.config.url || undefined,
        host: this.config.url ? undefined : this.config.host,
        port: this.config.url ? undefined : this.config.port,
        database: this.config.url ? undefined : this.config.database,
        user: this.config.url ? undefined : this.config.user,
        password: this.config.url ? undefined : this.config.password,
        ssl: this.config.ssl,
      });

      this.pool.on('error', (err: Error) => {
        this.emit('error', err);
      });

      // Test connection
      const client = await this.pool.connect();
      client.release();

      // Create tables if they don't exist
      await this.createTables();

      this.initialized = true;
      this.emit('ready');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create required tables
   */
  private async createTables(): Promise<void> {
    if (!this.pool) throw new Error('Pool not initialized');

    const auditTable = `
      CREATE TABLE IF NOT EXISTS ${this.config.schema}.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        action VARCHAR(255) NOT NULL,
        agent_id VARCHAR(255) NOT NULL,
        task TEXT,
        resource TEXT,
        result TEXT,
        outcome VARCHAR(50) CHECK (outcome IN ('allowed', 'denied', 'error')),
        details JSONB,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(255),
        session_id VARCHAR(255),
        metadata JSONB
      );
    `;

    const billingTable = `
      CREATE TABLE IF NOT EXISTS ${this.config.schema}.billing_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        event_type VARCHAR(50) CHECK (event_type IN ('usage', 'charge', 'refund', 'subscription')),
        provider VARCHAR(100),
        model VARCHAR(100),
        tokens_input INTEGER DEFAULT 0,
        tokens_output INTEGER DEFAULT 0,
        cost DECIMAL(10, 6),
        currency VARCHAR(3) DEFAULT 'USD',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      );
    `;

    const indexes = `
      CREATE INDEX IF NOT EXISTS idx_audit_agent ON ${this.config.schema}.audit_logs(agent_id);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON ${this.config.schema}.audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON ${this.config.schema}.audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_session ON ${this.config.schema}.audit_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_billing_user ON ${this.config.schema}.billing_events(user_id);
      CREATE INDEX IF NOT EXISTS idx_billing_timestamp ON ${this.config.schema}.billing_events(timestamp);
    `;

    await this.pool.query(auditTable);
    await this.pool.query(billingTable);
    await this.pool.query(indexes);
  }

  /**
   * Check if adapter is ready
   */
  isReady(): boolean {
    return this.initialized && this.pool !== null;
  }

  /**
   * Log an audit entry
   */
  async logAudit(entry: AuditEntry): Promise<string> {
    if (!this.pool || !this.initialized) {
      throw new Error('Postgres adapter not initialized');
    }

    const query = `
      INSERT INTO ${this.config.schema}.audit_logs 
      (id, action, agent_id, task, resource, result, outcome, details, timestamp, user_id, session_id, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const values = [
      entry.id || crypto.randomUUID(),
      entry.action,
      entry.agentId,
      entry.task || null,
      entry.resource || null,
      entry.result || null,
      entry.outcome || null,
      entry.details ? JSON.stringify(entry.details) : null,
      entry.timestamp || new Date().toISOString(),
      entry.userId || null,
      entry.sessionId || null,
      entry.metadata ? JSON.stringify(entry.metadata) : null,
    ];

    const result = await this.pool.query(query, values);
    const id = result.rows[0].id;
    
    this.emit('audit', entry);
    return id;
  }

  /**
   * Query audit logs
   */
  async queryAudit(query: AuditQuery): Promise<AuditEntry[]> {
    if (!this.pool || !this.initialized) {
      throw new Error('Postgres adapter not initialized');
    }

    const conditions: string[] = [];
    const values: (string | Date | number)[] = [];
    let paramIndex = 1;

    if (query.agentId) {
      conditions.push(`agent_id = $${paramIndex++}`);
      values.push(query.agentId);
    }

    if (query.action) {
      conditions.push(`action = $${paramIndex++}`);
      values.push(query.action);
    }

    if (query.outcome) {
      conditions.push(`outcome = $${paramIndex++}`);
      values.push(query.outcome);
    }

    if (query.startTime) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      values.push(query.startTime);
    }

    if (query.endTime) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      values.push(query.endTime);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limitClause = `LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    values.push(query.limit || 100);
    values.push(query.offset || 0);

    const sql = `
      SELECT * FROM ${this.config.schema}.audit_logs
      ${whereClause}
      ORDER BY timestamp DESC
      ${limitClause}
    `;

    const result = await this.pool.query(sql, values);
    
    return result.rows.map(row => ({
      id: row.id,
      action: row.action,
      agentId: row.agent_id,
      task: row.task,
      resource: row.resource,
      result: row.result,
      outcome: row.outcome,
      details: row.details,
      timestamp: row.timestamp,
      userId: row.user_id,
      sessionId: row.session_id,
      metadata: row.metadata,
    }));
  }

  /**
   * Log a billing event
   */
  async logBilling(event: BillingEvent): Promise<string> {
    if (!this.pool || !this.initialized) {
      throw new Error('Postgres adapter not initialized');
    }

    const query = `
      INSERT INTO ${this.config.schema}.billing_events
      (id, user_id, event_type, provider, model, tokens_input, tokens_output, cost, currency, timestamp, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    const values = [
      event.id || crypto.randomUUID(),
      event.userId,
      event.eventType,
      event.provider || null,
      event.model || null,
      event.tokensInput || 0,
      event.tokensOutput || 0,
      event.cost || 0,
      event.currency || 'USD',
      event.timestamp || new Date().toISOString(),
      event.metadata ? JSON.stringify(event.metadata) : null,
    ];

    const result = await this.pool.query(query, values);
    const id = result.rows[0].id;
    
    this.emit('billing', event);
    return id;
  }

  /**
   * Get billing summary for a user
   */
  async getBillingSummary(userId: string, startTime?: Date, endTime?: Date): Promise<{
    totalCost: number;
    totalTokens: number;
    byProvider: Record<string, { cost: number; tokens: number }>;
  }> {
    if (!this.pool || !this.initialized) {
      throw new Error('Postgres adapter not initialized');
    }

    const conditions: string[] = ['user_id = $1'];
    const values: (string | Date)[] = [userId];
    let paramIndex = 2;

    if (startTime) {
      conditions.push(`timestamp >= $${paramIndex++}`);
      values.push(startTime);
    }

    if (endTime) {
      conditions.push(`timestamp <= $${paramIndex++}`);
      values.push(endTime);
    }

    const sql = `
      SELECT 
        COALESCE(SUM(cost), 0) as total_cost,
        COALESCE(SUM(tokens_input + tokens_output), 0) as total_tokens,
        provider,
        SUM(cost) as provider_cost,
        SUM(tokens_input + tokens_output) as provider_tokens
      FROM ${this.config.schema}.billing_events
      WHERE ${conditions.join(' AND ')}
      GROUP BY provider
    `;

    const result = await this.pool.query(sql, values);
    
    let totalCost = 0;
    let totalTokens = 0;
    const byProvider: Record<string, { cost: number; tokens: number }> = {};

    for (const row of result.rows) {
      const cost = parseFloat(row.total_cost);
      const tokens = parseInt(row.total_tokens);
      totalCost += cost;
      totalTokens += tokens;
      
      if (row.provider) {
        byProvider[row.provider] = {
          cost: parseFloat(row.provider_cost),
          tokens: parseInt(row.provider_tokens),
        };
      }
    }

    return { totalCost, totalTokens, byProvider };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.initialized = false;
      this.emit('closed');
    }
  }
}

// Singleton instance
let postgresAdapterInstance: PostgresAuditAdapter | null = null;

export function getPostgresAdapter(config?: PostgresConfig): PostgresAuditAdapter {
  if (!postgresAdapterInstance) {
    postgresAdapterInstance = new PostgresAuditAdapter(config);
  }
  return postgresAdapterInstance;
}

export function resetPostgresAdapter(): void {
  postgresAdapterInstance = null;
}

export default PostgresAuditAdapter;
