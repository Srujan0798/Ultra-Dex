/**
 * Storage Factory
 * Selects and manages storage adapters based on environment configuration
 */

import { RedisMemoryAdapter, RedisMemoryConfig } from './redis-memory-adapter.js';
import { PostgresAuditAdapter, PostgresConfig } from './postgres-audit-adapter.js';

export interface StorageConfig {
  memory?: {
    type: 'file' | 'redis';
    redis?: RedisMemoryConfig;
  };
  audit?: {
    type: 'sqlite' | 'postgres';
    postgres?: PostgresConfig;
    sqlitePath?: string;
  };
}

/**
 * Get memory adapter based on environment configuration
 */
export function getMemoryAdapter(config?: RedisMemoryConfig): RedisMemoryAdapter | null {
  const memoryType = process.env.ULTRA_DEX_MEMORY_TYPE || 'file';
  
  if (memoryType === 'redis') {
    try {
      const adapter = new RedisMemoryAdapter(config);
      return adapter;
    } catch (error) {
      console.warn('[storage-factory] Redis adapter failed to initialize, falling back to file:', error);
      return null;
    }
  }
  
  // Return null for file-based memory (handled by UnifiedMemory)
  return null;
}

/**
 * Get audit adapter based on environment configuration
 */
export async function getAuditAdapter(config?: PostgresConfig): Promise<PostgresAuditAdapter | null> {
  const auditType = process.env.ULTRA_DEX_AUDIT_TYPE || 'sqlite';
  
  if (auditType === 'postgres') {
    try {
      const adapter = new PostgresAuditAdapter(config);
      await adapter.initialize();
      return adapter;
    } catch (error) {
      console.warn('[storage-factory] Postgres adapter failed to initialize, falling back to SQLite:', error);
      return null;
    }
  }
  
  // Return null for SQLite (handled by existing AuditDatabase)
  return null;
}

/**
 * Check if Redis is configured and available
 */
export function isRedisConfigured(): boolean {
  return !!(
    process.env.REDIS_URL ||
    process.env.REDIS_HOST ||
    process.env.ULTRA_DEX_MEMORY_TYPE === 'redis'
  );
}

/**
 * Check if Postgres is configured and available
 */
export function isPostgresConfigured(): boolean {
  return !!(
    process.env.DATABASE_URL ||
    (process.env.POSTGRES_HOST && process.env.POSTGRES_DB) ||
    process.env.ULTRA_DEX_AUDIT_TYPE === 'postgres'
  );
}

/**
 * Storage health check
 */
export async function checkStorageHealth(): Promise<{
  memory: 'ok' | 'degraded' | 'error';
  audit: 'ok' | 'degraded' | 'error';
  details: Record<string, unknown>;
}> {
  const result: {
    memory: 'ok' | 'degraded' | 'error';
    audit: 'ok' | 'degraded' | 'error';
    details: Record<string, unknown>;
  } = {
    memory: 'ok',
    audit: 'ok',
    details: {},
  };

  // Check Redis if configured
  if (isRedisConfigured()) {
    try {
      const adapter = new RedisMemoryAdapter();
      await adapter.initialize();
      const stats = await adapter.getStats();
      result.details.redis = { status: 'connected', stats };
      await adapter.close();
    } catch (error) {
      result.memory = 'error';
      result.details.redis = { status: 'error', error: (error as Error).message };
    }
  } else {
    result.details.memory = { type: 'file', status: 'active' };
  }

  // Check Postgres if configured
  if (isPostgresConfigured()) {
    try {
      const adapter = new PostgresAuditAdapter();
      await adapter.initialize();
      result.details.postgres = { status: 'connected' };
      await adapter.close();
    } catch (error) {
      result.audit = 'error';
      result.details.postgres = { status: 'error', error: (error as Error).message };
    }
  } else {
    result.details.audit = { type: 'sqlite', status: 'active' };
  }

  return result;
}

export { RedisMemoryAdapter, PostgresAuditAdapter };
export type { RedisMemoryConfig, PostgresConfig };
