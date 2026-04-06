// Copyright (c) 2026 Ultra-Dex
/**
 * Governance Audit Persistence Test
 * Verifies that audit entries are persisted to SQLite and survive restarts
 */

import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { GovernanceManager } from '../../src/core/governance/governance-manager.js';
import { AuditDatabase } from '../../src/core/governance/audit-db.js';

const TEST_DB_PATH = path.join(process.cwd(), '.ultra-dex', 'audit', 'governance-test.db');

describe('Governance Audit Persistence', () => {
  beforeEach(async () => {
    // Clean up test database before each test
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  afterEach(async () => {
    // Clean up test database after each test
    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  it('should create audit database file', async () => {
    // Arrange: Create governance manager with test database
    const governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });

    // Act: Record an audit entry
    await governance.audit.record({
      agentId: 'test-agent',
      action: 'test-action',
      task: 'test-resource',
      outcome: 'allowed',
      details: { test: true },
    });

    // Assert: Database file should exist
    assert.strictEqual(fs.existsSync(TEST_DB_PATH), true, 'Audit database file should exist');

    await governance.close();
  });

  it('should persist audit entries to SQLite', async () => {
    // Arrange: Create governance manager
    const governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });

    // Act: Record multiple audit entries
    const entries = [
      { agentId: 'agent-1', action: 'read', task: 'file1.txt', outcome: 'allowed', details: {} },
      { agentId: 'agent-2', action: 'write', task: 'file2.txt', outcome: 'blocked', details: { reason: 'policy' } },
      { agentId: 'agent-1', action: 'execute', task: 'script.js', outcome: 'allowed', details: {} },
    ];

    for (const entry of entries) {
      await governance.audit.record(entry);
    }

    // Query entries back
    const results = await governance.audit.query({ limit: 10 });

    // Assert: All entries should be persisted
    assert.strictEqual(results.length, 3, 'Should have 3 audit entries');

    // Verify entry structure
    const firstEntry = results[2]; // Oldest entry (DESC order)
    assert.ok(firstEntry.id, 'Entry should have an id');
    assert.ok(firstEntry.id.startsWith('audit-'), 'ID should start with audit- prefix');
    assert.strictEqual(firstEntry.agentId, 'agent-1');
    assert.strictEqual(firstEntry.action, 'read');
    assert.strictEqual(firstEntry.task, 'file1.txt');
    assert.strictEqual(firstEntry.result, 'allowed');
    assert.ok(firstEntry.timestamp, 'Entry should have timestamp');

    await governance.close();
  });

  it('should survive governance manager restart', async () => {
    // Arrange: Create first governance manager and record entries
    const governance1 = new GovernanceManager({ auditDbPath: TEST_DB_PATH });

    await governance1.audit.record({
      agentId: 'persistent-agent',
      action: 'critical-action',
      task: 'important-resource',
      outcome: 'allowed',
      details: { severity: 'high' },
    });

    await governance1.close();

    // Act: Create new governance manager instance (simulating restart)
    const governance2 = new GovernanceManager({ auditDbPath: TEST_DB_PATH });
    const results = await governance2.audit.query({ limit: 10 });

    // Assert: Entry should survive restart
    assert.strictEqual(results.length, 1, 'Should have 1 persisted entry after restart');

    const entry = results[0];
    assert.strictEqual(entry.agentId, 'persistent-agent');
    assert.strictEqual(entry.action, 'critical-action');
    assert.strictEqual(entry.task, 'important-resource');
    assert.strictEqual(entry.result, 'allowed');
    assert.deepStrictEqual(entry.details, { severity: 'high' });

    await governance2.close();
  });

  it('should query audit entries with filters', async () => {
    // Arrange: Create governance manager and add entries
    const governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });

    await governance.audit.record({ agentId: 'agent-a', action: 'read', task: 'file1', outcome: 'allowed' });
    await governance.audit.record({ agentId: 'agent-b', action: 'write', task: 'file2', outcome: 'blocked' });
    await governance.audit.record({ agentId: 'agent-a', action: 'write', task: 'file3', outcome: 'allowed' });
    await governance.audit.record({ agentId: 'agent-a', action: 'read', task: 'file4', outcome: 'allowed' });

    // Act & Assert: Query by agentId
    const agentAEntries = await governance.audit.query({ agentId: 'agent-a', limit: 10 });
    assert.strictEqual(agentAEntries.length, 3, 'Should have 3 entries for agent-a');

    // Act & Assert: Query by action
    const readEntries = await governance.audit.query({ action: 'read', limit: 10 });
    assert.strictEqual(readEntries.length, 2, 'Should have 2 read entries');

    // Act & Assert: Query with limit
    const limitedEntries = await governance.audit.query({ limit: 2 });
    assert.strictEqual(limitedEntries.length, 2, 'Should respect limit');

    await governance.close();
  });

  it('should use UUID-based IDs instead of random', async () => {
    // Arrange: Create governance manager
    const governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });

    // Act: Record an entry
    const entry = await governance.audit.record({
      agentId: 'uuid-test-agent',
      action: 'test',
      outcome: 'allowed',
    });

    // Assert: ID should be UUID-based (36 characters with hyphens)
    assert.ok(entry.id, 'Entry should have an id');
    assert.ok(entry.id.startsWith('audit-'), 'ID should start with audit-');
    const uuidPart = entry.id.replace('audit-', '');
    assert.strictEqual(uuidPart.length, 36, 'UUID part should be 36 characters');
    assert.ok(uuidPart.includes('-'), 'UUID should contain hyphens');

    await governance.close();
  });

  it('should record audits through gate() method', async () => {
    // Arrange: Create governance manager with a policy
    const governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });

    governance.policies.addPolicy({
      id: 'test-policy',
      name: 'Test Policy',
      condition: (ctx) => ctx.action !== 'blocked-action',
    });

    // Act: Use gate() which should record audits
    await governance.gate({
      agentId: 'gate-test-agent',
      action: 'allowed-action',
      resource: 'resource-1',
      details: { via: 'gate' },
    });

    await governance.gate({
      agentId: 'gate-test-agent',
      action: 'blocked-action',
      resource: 'resource-2',
      details: { via: 'gate' },
    });

    // Query audits
    const audits = await governance.audit.query({ limit: 10 });

    // Assert: Both actions should be recorded
    assert.strictEqual(audits.length, 2, 'Should have 2 audit entries from gate()');

    const blockedEntry = audits.find((a) => a.action === 'blocked-action');
    const allowedEntry = audits.find((a) => a.action === 'allowed-action');

    assert.ok(allowedEntry, 'Should have allowed entry');
    assert.strictEqual(allowedEntry.result, 'allowed');

    assert.ok(blockedEntry, 'Should have blocked entry');
    assert.strictEqual(blockedEntry.result, 'blocked');

    await governance.close();
  });

  it('should provide getAuditLog() for backward compatibility', async () => {
    // Arrange: Create governance manager and add entries
    const governance = new GovernanceManager({ auditDbPath: TEST_DB_PATH });

    for (let i = 0; i < 5; i++) {
      await governance.audit.record({
        agentId: `agent-${i}`,
        action: 'test',
        outcome: 'allowed',
      });
    }

    // Act: Use getAuditLog() method
    const logs = await governance.getAuditLog();

    // Assert: Should return entries
    assert.ok(Array.isArray(logs), 'getAuditLog should return an array');
    assert.strictEqual(logs.length, 5, 'Should return all 5 entries');

    await governance.close();
  });
});

describe('AuditDatabase direct tests', () => {
  const directTestDbPath = path.join(process.cwd(), '.ultra-dex', 'audit', 'direct-test.db');

  beforeEach(async () => {
    if (fs.existsSync(directTestDbPath)) {
      fs.unlinkSync(directTestDbPath);
    }
  });

  afterEach(async () => {
    if (fs.existsSync(directTestDbPath)) {
      fs.unlinkSync(directTestDbPath);
    }
  });

  it('should create table and indexes on init', async () => {
    // Arrange & Act
    const db = new AuditDatabase(directTestDbPath);
    await db.init();

    // Assert: Check that table exists
    const tableInfo = await db.db.all(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='governance_audit'"
    );
    assert.strictEqual(tableInfo.length, 1, 'governance_audit table should exist');

    // Check indexes
    const indexes = await db.db.all(
      "SELECT name FROM sqlite_master WHERE type='index' AND tbl_name='governance_audit'"
    );
    assert.ok(indexes.length >= 3, 'Should have at least 3 indexes');

    await db.close();
  });
});
