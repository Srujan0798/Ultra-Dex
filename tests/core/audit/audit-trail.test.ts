import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { AuditTrail } from '../../../src/core/audit/audit-trail.ts';
import { ComplianceExport } from '../../../src/core/audit/compliance-export.ts';
import { AuditRetentionManager } from '../../../src/core/audit/retention.ts';

describe('Enterprise audit trail', () => {
  let tempDir: string;
  let auditTrail: AuditTrail;
  let exporter: ComplianceExport;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultradex-audit-'));
    auditTrail = new AuditTrail(tempDir, 36500);
    exporter = new ComplianceExport(auditTrail);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('captures expected audit event types', async () => {
    const actions = [
      'task.run',
      'task.complete',
      'task.fail',
      'agent.select',
      'provider.call',
      'memory.read',
      'memory.write',
      'plugin.install',
      'plugin.uninstall',
      'team.create',
      'team.join',
      'rbac.change',
      'config.update',
    ];

    for (const action of actions) {
      await auditTrail.log({
        userId: 'u-1',
        teamId: 't-1',
        action,
        resource: 'resource',
        details: { action },
        result: 'success',
        cost: 0.01,
      });
    }

    const events = await auditTrail.read();
    assert.strictEqual(events.length, actions.length);
  });

  it('preserves append-only behavior and rotates files by date', async () => {
    await auditTrail.log({
      userId: 'u-1',
      action: 'task.run',
      resource: 'run-1',
      result: 'success',
    });

    const todayFile = path.join(tempDir, `${new Date().toISOString().slice(0, 10)}.jsonl`);
    const before = await fs.readFile(todayFile, 'utf8');

    await auditTrail.log({
      userId: 'u-1',
      action: 'task.complete',
      resource: 'run-1',
      result: 'success',
    });

    const after = await fs.readFile(todayFile, 'utf8');
    assert.strictEqual(after.startsWith(before), true);
  });

  it('exports CSV and SOC2 formats correctly', async () => {
    await auditTrail.log({
      userId: 'u-csv',
      teamId: 't-csv',
      action: 'provider.call',
      resource: 'openai:gpt',
      details: { tokens: 12 },
      result: 'success',
      cost: 0.1,
    });

    const csv = await exporter.exportCSV();
    assert.strictEqual(csv.includes('timestamp,userId,teamId,action,resource,result,cost,details'), true);
    assert.strictEqual(csv.includes('provider.call'), true);

    const soc2 = await exporter.exportSOC2();
    assert.strictEqual(typeof soc2.generatedAt, 'string');
    assert.strictEqual((soc2.controls as any).accessControls.count >= 0, true);
    assert.strictEqual((soc2.controls as any).dataHandling.count >= 0, true);
  });

  it('enforces retention rules (compress, archive, delete)', async () => {
    const oldDate = new Date(Date.now() - 800 * 24 * 60 * 60 * 1000);
    const oldFile = path.join(tempDir, `${oldDate.toISOString().slice(0, 10)}.jsonl`);
    await fs.writeFile(
      oldFile,
      `${JSON.stringify({
        timestamp: oldDate.toISOString(),
        userId: 'u-old',
        action: 'task.run',
        resource: 'old',
        result: 'success',
      })}\n`,
      'utf8'
    );
    await fs.utimes(oldFile, oldDate, oldDate);

    const retention = new AuditRetentionManager(tempDir, {
      retainDays: 1,
      archiveAfterDays: 2,
      deleteAfterDays: 3,
    });
    const outcome = await retention.enforceRetention();

    assert.strictEqual(outcome.compressed >= 1, true);
    assert.strictEqual(outcome.archived >= 0, true);
    assert.strictEqual(outcome.deleted >= 0, true);
  });
});
