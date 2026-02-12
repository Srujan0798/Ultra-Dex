// Copyright (c) 2026 Ultra-Dex

let state = {
  kind: null,
  client: null,
  config: null,
};

async function createPostgresPool(config) {
  const mod = await import('pg');
  const { Pool } = mod;
  const pool = new Pool(config);
  return {
    kind: 'postgres',
    client: pool,
  };
}

async function createSqlitePool(config) {
  const mod = await import('better-sqlite3');
  const Database = mod.default || mod;
  const file = config.file || config.filename || ':memory:';
  const db = new Database(file, {
    readonly: !!config.readonly,
    fileMustExist: !!config.fileMustExist,
  });
  return {
    kind: 'sqlite',
    client: db,
  };
}

function ensureInitialized() {
  if (!state.client || !state.kind) {
    throw new Error('[database] pool is not initialized. Call createPool(config) first.');
  }
}

export async function createPool(config = {}) {
  const kind = (config.client || config.type || process.env.DB_CLIENT || 'postgres').toLowerCase();

  if (kind === 'postgres' || kind === 'pg') {
    state = {
      ...(await createPostgresPool(config)),
      config,
    };
    return state;
  }

  if (kind === 'sqlite') {
    state = {
      ...(await createSqlitePool(config)),
      config,
    };
    return state;
  }

  throw new Error(`[database] unsupported client "${kind}". Use "postgres" or "sqlite".`);
}

export async function query(sql, params = []) {
  ensureInitialized();

  if (state.kind === 'postgres') {
    const result = await state.client.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.rowCount,
    };
  }

  const statement = state.client.prepare(sql);
  const upper = sql.trim().toUpperCase();

  if (upper.startsWith('SELECT') || upper.startsWith('PRAGMA')) {
    const rows = statement.all(...params);
    return {
      rows,
      rowCount: rows.length,
    };
  }

  const result = statement.run(...params);
  return {
    rows: [],
    rowCount: result.changes,
    lastInsertRowid: result.lastInsertRowid,
  };
}

export async function transaction(fn) {
  ensureInitialized();

  if (typeof fn !== 'function') {
    throw new Error('[database] transaction expects a callback function');
  }

  if (state.kind === 'postgres') {
    const client = await state.client.connect();
    try {
      await client.query('BEGIN');
      const tx = {
        query: (sql, params = []) => client.query(sql, params),
      };
      const result = await fn(tx);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  state.client.prepare('BEGIN').run();
  try {
    const tx = {
      query: async (sql, params = []) => query(sql, params),
    };
    const result = await fn(tx);
    state.client.prepare('COMMIT').run();
    return result;
  } catch (error) {
    state.client.prepare('ROLLBACK').run();
    throw error;
  }
}

export async function healthCheck() {
  const startedAt = Date.now();
  try {
    await query('SELECT 1 as ok');
    return {
      status: 'healthy',
      latencyMs: Date.now() - startedAt,
      client: state.kind,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - startedAt,
      client: state.kind,
      error: error.message,
    };
  }
}
