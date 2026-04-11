import 'reflect-metadata';
import { Pool, PoolClient, QueryResult } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { singleton } from 'tsyringe';
import type { QueryConfig } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let sqlite3: any = null;
let sqliteOpen: any = null;

async function initializeSqlite() {
  try {
    const sqlite3Module = await import('sqlite3');
    const sqliteModule = await import('sqlite');
    sqlite3 = sqlite3Module.default;
    sqliteOpen = sqliteModule.open;
  } catch (error) {
    console.warn('[postgres-client] SQLite not available for fallback');
  }
}

// Initialize SQLite on module load
initializeSqlite().catch((error) => {
  console.warn('[postgres-client] Failed to initialize SQLite:', error);
});

export interface PostgresConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

@singleton()
export class PostgresClient {
  private pool: Pool | null = null;
  private sqliteDb: any = null;
  private isAvailable: boolean = false;
  private fallbackMode: boolean = false;
  private usingSqliteFallback: boolean = false;
  private config: PostgresConfig;
  private sqlitePath: string;

  constructor(config?: PostgresConfig) {
    this.config = config || this.parseConfig();
    this.sqlitePath = path.join(process.cwd(), '.ultra-dex', 'fallback.db');
    this.detectAvailability();
  }

  /**
   * Parse PostgreSQL connection config from environment or defaults
   */
  private parseConfig(): PostgresConfig {
    const databaseUrl = process.env.DATABASE_URL;

    if (databaseUrl) {
      try {
        const url = new URL(databaseUrl);
        return {
          host: url.hostname,
          port: url.port ? parseInt(url.port, 10) : 5432,
          database: url.pathname.slice(1),
          user: url.username,
          password: url.password,
          max: parseInt(process.env.DB_POOL_SIZE || '10', 10),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        };
      } catch {
        console.warn('[postgres-client] Invalid DATABASE_URL format');
      }
    }

    return {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'ultra_dex',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: parseInt(process.env.DB_POOL_SIZE || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
  }

  /**
   * Detect if PostgreSQL is available by attempting a connection
   */
  private detectAvailability(): void {
    if (process.env.SKIP_POSTGRES === 'true') {
      this.fallbackMode = true;
      this.isAvailable = false;
      console.info('[postgres-client] PostgreSQL disabled via SKIP_POSTGRES');
      return;
    }

    if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
      this.fallbackMode = true;
      this.isAvailable = false;
      console.info('[postgres-client] No DATABASE_URL or DB_HOST set, using SQLite fallback');
      return;
    }

    this.isAvailable = true;
  }

  /**
   * Initialize SQLite fallback database
   */
  private async initSqliteFallback(): Promise<void> {
    if (this.usingSqliteFallback || !sqliteOpen) {
      return;
    }

    try {
      const dir = path.dirname(this.sqlitePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.sqliteDb = await sqliteOpen({
        filename: this.sqlitePath,
        driver: sqlite3.Database,
      });

      console.info('[postgres-client] Using SQLite fallback at', this.sqlitePath);
      this.usingSqliteFallback = true;
    } catch (error) {
      console.warn('[postgres-client] Failed to initialize SQLite fallback', error);
      this.fallbackMode = true;
    }
  }

  /**
   * Initialize connection pool (lazy initialization)
   */
  async init(): Promise<void> {
    if (this.pool || this.usingSqliteFallback || this.fallbackMode) {
      if (this.fallbackMode && !this.usingSqliteFallback) {
        await this.initSqliteFallback();
      }
      return;
    }

    try {
      this.pool = new Pool(this.config);

      this.pool.on('error', (err) => {
        console.error('[postgres-client] Unexpected error on idle client', err);
      });

      // Test connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();

      console.info('[postgres-client] Connected to PostgreSQL');
    } catch (error) {
      console.warn('[postgres-client] Failed to connect to PostgreSQL, falling back to SQLite', error);
      this.fallbackMode = true;
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      await this.initSqliteFallback();
    }
  }

  /**
   * Execute a query
   */
  async query<T = any>(
    text: string,
    values?: any[]
  ): Promise<QueryResult<T>> {
    await this.init();

    if (this.usingSqliteFallback) {
      try {
        const rows = await this.sqliteDb.all(text, values);
        return { rows: rows || [] as T[], rowCount: rows?.length || 0, command: '', oid: 0, fields: [] };
      } catch (error) {
        console.warn('[postgres-client] SQLite query failed:', error);
        return { rows: [] as T[], rowCount: 0, command: '', oid: 0, fields: [] };
      }
    }

    if (this.fallbackMode) {
      console.warn('[postgres-client] Query attempted in fallback mode:', text.substring(0, 50));
      return { rows: [] as T[], rowCount: 0, command: '', oid: 0, fields: [] };
    }

    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    try {
      return await this.pool.query<T>(text, values);
    } catch (error) {
      console.error('[postgres-client] Query failed:', error);
      throw error;
    }
  }

  /**
   * Execute a query with config object
   */
  async queryConfig<T = any>(config: QueryConfig): Promise<QueryResult<T>> {
    await this.init();

    if (this.fallbackMode) {
      console.warn('[postgres-client] Query config attempted in fallback mode');
      return { rows: [] as T[], rowCount: 0, command: '', oid: 0, fields: [] };
    }

    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    return this.pool.query<T>(config);
  }

  /**
   * Execute a transaction
   */
  async transaction<T = any>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    await this.init();

    if (this.usingSqliteFallback) {
      try {
        await this.sqliteDb.run('BEGIN');
        const result = await callback(this.sqliteDb as any);
        await this.sqliteDb.run('COMMIT');
        return result;
      } catch (error) {
        await this.sqliteDb.run('ROLLBACK');
        throw error;
      }
    }

    if (this.fallbackMode) {
      console.warn('[postgres-client] Transaction attempted in fallback mode');
      return undefined as any;
    }

    if (!this.pool) {
      throw new Error('PostgreSQL pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run database migrations
   */
  async migrate(): Promise<void> {
    await this.init();

    if (this.fallbackMode && !this.usingSqliteFallback) {
      console.warn('[postgres-client] Migrations skipped in fallback mode');
      return;
    }

    const migrationsDir = path.join(__dirname, 'migrations');

    try {
      const files = fs.readdirSync(migrationsDir)
        .filter(f => (f.endsWith('.sql') || f.endsWith('.ts')) && f !== 'migrate.ts')
        .sort();

      for (const file of files) {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf-8');

        console.info(`[postgres-client] Applying migration: ${file}`);
        
        if (this.usingSqliteFallback) {
          // For SQLite, execute statements one by one
          const statements = sql.split(';').filter((stmt) => stmt.trim());
          for (const stmt of statements) {
            if (stmt.trim()) {
              try {
                await this.sqliteDb.run(stmt);
              } catch (e) {
                console.warn(`[postgres-client] SQLite migration statement warning:`, e);
              }
            }
          }
        } else if (this.pool) {
          // For PostgreSQL, use the pool
          await this.pool.query(sql);
        }
      }

      console.info('[postgres-client] All migrations applied successfully');
    } catch (error) {
      console.error('[postgres-client] Migration failed:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (this.fallbackMode && !this.usingSqliteFallback) {
        return false;
      }

      await this.init();

      if (this.usingSqliteFallback) {
        await this.sqliteDb.get('SELECT 1');
        return true;
      }

      if (!this.pool) {
        return false;
      }

      await this.pool.query('SELECT NOW()');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Close connection pool or SQLite database
   */
  async close(): Promise<void> {
    if (this.sqliteDb) {
      await this.sqliteDb.close();
      this.sqliteDb = null;
      console.info('[postgres-client] SQLite database closed');
    }
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.info('[postgres-client] Connection pool closed');
    }
  }

  /**
   * Get pool stats (for monitoring)
   */
  getPoolStats(): { total: number; idle: number; waiting: number } {
    if (!this.pool) {
      return { total: 0, idle: 0, waiting: 0 };
    }

    return {
      total: this.pool.totalCount,
      idle: this.pool.idleCount,
      waiting: this.pool.waitingCount,
    };
  }

  /**
   * Check whether explicit PostgreSQL configuration is present.
   */
  isPostgresConfigured(): boolean {
    return Boolean(process.env.DATABASE_URL);
  }

  /**
   * Check if running in fallback mode (SQLite or no-op)
   */
  isFallbackMode(): boolean {
    return this.fallbackMode || this.usingSqliteFallback;
  }
}

// Singleton instance
let postgresClient: PostgresClient | null = null;

export function getPostgresClient(config?: PostgresConfig): PostgresClient {
  if (!postgresClient) {
    postgresClient = new PostgresClient(config);
  }
  return postgresClient;
}

export default PostgresClient;
