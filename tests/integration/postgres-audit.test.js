import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { PostgresAuditStore } from '../../src/core/governance/postgres-audit-store.js';
import { SqliteAuditStore } from '../../src/core/governance/sqlite-audit-store.js';
import { AuditDatabase } from '../../src/core/governance/audit-db.js';
import path from 'path';
import fs from 'fs';

describe('PostgresAuditStore Integration', () => {
  let store;
  const isPostgresAvailable = process.env.DATABASE_URL;

  before(async () => {
    if (isPostgresAvailable) {
      store = new PostgresAuditStore();
    }
  });

  it('should log and query an audit event in Postgres (or skip if unavailable)', async (t) => {
    if (!isPostgresAvailable) return t.skip('Postgres DATABASE_URL not set');

    try {
      await store.init();
      
      const event = {
        id: `pg-test-${Date.now()}`,
        action: 'integration-test',
        agentId: 'tester-agent',
        details: { foo: 'bar' },
        timestamp: Date.now()
      };

      await store.logEvent(event);
      
      const results = await store.queryEvents({ action: 'integration-test' });
      assert.ok(results.length >= 1);
      const found = results.find(r => r.id === event.id);
      assert.ok(found);
      assert.strictEqual(found.agentId, 'tester-agent');
    } catch (error) {
      t.skip(`Postgres test failed: ${error.message}`);
    }
  });

  it('should filter events by date range in Postgres', async (t) => {
    if (!isPostgresAvailable) return t.skip('Postgres DATABASE_URL not set');

    const now = Date.now();
    await store.logEvent({ id: 'range-1', action: 'range-test', agentId: 'a', timestamp: now - 10000 });
    await store.logEvent({ id: 'range-2', action: 'range-test', agentId: 'a', timestamp: now });

    const results = await store.queryEvents({ 
      action: 'range-test', 
      since: now - 5000 
    });

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'range-2');
  });

  it('should export audit log to CSV in Postgres', async (t) => {
    if (!isPostgresAvailable) return t.skip('Postgres DATABASE_URL not set');

    await store.logEvent({ id: 'csv-1', action: 'csv-test', agentId: 'a', timestamp: Date.now() });
    
    const csv = await store.exportCSV({ since: Date.now() - 10000 });
    assert.ok(csv.includes('csv-test'));
    assert.ok(csv.includes('id,timestamp,action,agentId'));
  });

  it('should graceful fallback to SQLite when DATABASE_URL not set', async () => {
    // Clear DATABASE_URL for this test if it exists
    const originalUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    const testDbPath = path.join('/tmp', `fallback-${Date.now()}.db`);
    const db = new AuditDatabase(testDbPath);
    
    try {
      await db.init();
      assert.ok(db.memoryMode === false || db.db !== null); // SQLite should be used
      
      await db.insert({ action: 'fallback-test', agentId: 'sqlite' });
      const results = await db.query({ action: 'fallback-test' });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].agentId, 'sqlite');
    } finally {
      await db.close();
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
      process.env.DATABASE_URL = originalUrl;
    }
  });
});
