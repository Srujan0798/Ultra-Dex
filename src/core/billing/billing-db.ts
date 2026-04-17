import { Client as PgClient } from 'pg';
import { open, Database } from 'sqlite';

const usePostgres = !!process.env.DATABASE_URL;

let pgClient: PgClient | null = null;
let sqliteDb: Database | null = null;

async function loadSqlite3() {
  try {
    const sqlite3Module = await import('sqlite3');
    return sqlite3Module.default || sqlite3Module;
  } catch {
    return null;
  }
}

export async function initBillingDb(): Promise<void> {
  if (usePostgres) {
    pgClient = new PgClient({ connectionString: process.env.DATABASE_URL });
    await pgClient.connect();
    await pgClient.query(`
      CREATE TABLE IF NOT EXISTS billing_customers (
        user_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        email TEXT,
        name TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS billing_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        tier_id TEXT NOT NULL,
        status TEXT NOT NULL,
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS billing_usage (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        requests INTEGER DEFAULT 0,
        tokens INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);
  } else {
    const sqlite3 = await loadSqlite3();
    if (!sqlite3?.Database) {
      throw new Error('sqlite3 is not available. Install optional dependency sqlite3 to use billing SQLite mode.');
    }
    sqliteDb = await open({
      filename: process.env.BILLING_DB_PATH || './billing.db',
      driver: sqlite3.Database,
    });
    await sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS billing_customers (
        user_id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        email TEXT,
        name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS billing_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT UNIQUE NOT NULL,
        customer_id TEXT,
        tier_id TEXT NOT NULL,
        status TEXT NOT NULL,
        current_period_start DATETIME,
        current_period_end DATETIME,
        cancel_at_period_end INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS billing_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        requests INTEGER DEFAULT 0,
        tokens INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}

export async function query(sql: string, params: any[] = []): Promise<any[]> {
  if (usePostgres && pgClient) {
    const result = await pgClient.query(sql, params);
    return result.rows;
  }
  if (sqliteDb) {
    if (sql.trim().toLowerCase().startsWith('select')) {
      return sqliteDb.all(sql, params);
    }
    await sqliteDb.run(sql, params);
    return [];
  }
  throw new Error('Billing database not initialized. Call initBillingDb() first.');
}

export async function getRow(sql: string, params: any[] = []): Promise<any | null> {
  const rows = await query(sql, params);
  return rows[0] || null;
}

export async function run(sql: string, params: any[] = []): Promise<void> {
  await query(sql, params);
}
