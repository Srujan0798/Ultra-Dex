import { singleton } from 'tsyringe';
import { IAuditStore, AuditEvent, AuditFilters } from './audit-store.js';
import { SqliteAuditStore } from './sqlite-audit-store.js';
import { PostgresAuditStore } from './postgres-audit-store.js';
import { randomUUID } from 'crypto';

export class AuditDatabase {
  private store: IAuditStore;

  constructor(dbPath?: string) {
    if (process.env.DATABASE_URL) {
      this.store = new PostgresAuditStore();
    } else {
      this.store = new SqliteAuditStore(dbPath);
    }
  }

  get memoryMode(): boolean {
    if (this.store instanceof SqliteAuditStore) {
      return (this.store as any).memoryMode;
    }
    return false;
  }

  // Add underlying db property for tests that access it directly
  get db(): any {
    if (this.store instanceof SqliteAuditStore) {
      return (this.store as any).db;
    }
    return null;
  }

  async init(): Promise<void> {
    if (this.store instanceof SqliteAuditStore || this.store instanceof PostgresAuditStore) {
      await (this.store as any).init();
    }
  }

  async insert(entry: Partial<AuditEvent>): Promise<AuditEvent> {
    const id = entry.id || `audit-${randomUUID()}`;
    const action = entry.action || 'unknown';
    const agentId = entry.agentId || 'system';
    const timestamp = entry.timestamp || Date.now();

    await this.store.logEvent({
      ...entry,
      id,
      action,
      agentId,
      timestamp,
    });

    return {
      id,
      action,
      agentId,
      timestamp,
      ...entry,
    } as AuditEvent;
  }

  async query(filters: AuditFilters): Promise<AuditEvent[]> {
    return this.store.queryEvents(filters);
  }

  async getStats() {
    if (this.store instanceof SqliteAuditStore) {
      return this.store.getStats();
    }
    return {
      total: -1,
      mode: 'postgres',
    };
  }

  async close(): Promise<void> {
    if (this.store instanceof SqliteAuditStore) {
      await this.store.close();
    }
  }

  getStore(): IAuditStore {
    return this.store;
  }
}

let auditDB: AuditDatabase | null = null;

export function getAuditDB(dbPath?: string): AuditDatabase {
  if (!auditDB) {
    auditDB = new AuditDatabase(dbPath);
  }
  return auditDB;
}

export async function recordAudit(entry: Partial<AuditEvent>): Promise<AuditEvent> {
  const db = getAuditDB();
  return db.insert(entry);
}

export async function queryAudit(filters: AuditFilters): Promise<AuditEvent[]> {
  const db = getAuditDB();
  return db.query(filters);
}

export default AuditDatabase;
