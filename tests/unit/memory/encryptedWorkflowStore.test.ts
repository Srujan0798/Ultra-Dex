/**
 * Encrypted Workflow Store Tests
 *
 * Tests for EncryptedWorkflowStore with AES-256-GCM encryption.
 * Addresses security audit: C-001 (unencrypted data at rest)
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EncryptedWorkflowStore, createEncryptedWorkflowStore } from '../../../memory/encryptedWorkflowStore.js';

describe('EncryptedWorkflowStore', () => {
  let store: EncryptedWorkflowStore;
  const testDir = '.test/workflows-encrypted';
  const testKey = 'test-encryption-key-32chars-long!!';

  before(async () => {
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Directory may not exist
    }

    store = await createEncryptedWorkflowStore({
      basePath: testDir,
      encryptionKey: testKey,
      autoSave: false,
    });
  });

  after(async () => {
    if (store) {
      await store.close();
    }
    // Clean up test directory
    try {
      await fs.rm(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Constructor Validation', () => {
    it('should require encryption key', () => {
      assert.throws(() => {
        new EncryptedWorkflowStore({
          basePath: testDir,
          encryptionKey: '',
        });
      }, /Encryption key must be at least 32 characters/);
    });

    it('should require minimum 32 character key', () => {
      assert.throws(() => {
        new EncryptedWorkflowStore({
          basePath: testDir,
          encryptionKey: 'short-key',
        });
      }, /Encryption key must be at least 32 characters/);
    });

    it('should accept valid encryption key', () => {
      assert.doesNotThrow(() => {
        new EncryptedWorkflowStore({
          basePath: testDir,
          encryptionKey: testKey,
        });
      });
    });
  });

  describe('Basic Operations', () => {
    it('should create workflow', () => {
      const workflow = store.createWorkflow('test-1');

      assert.strictEqual(workflow.workflowId, 'test-1');
      assert.strictEqual(workflow.status, 'CREATED');
      assert.ok(workflow.createdAt);
      assert.ok(workflow.updatedAt);
      assert.strictEqual(workflow.nodes.size, 0);
      assert.strictEqual(workflow.nodeHistory.size, 0);
    });

    it('should retrieve workflow', () => {
      store.createWorkflow('test-2');
      const retrieved = store.getWorkflow('test-2');

      assert.ok(retrieved);
      assert.strictEqual(retrieved?.workflowId, 'test-2');
    });

    it('should return undefined for non-existent workflow', () => {
      const result = store.getWorkflow('non-existent');
      assert.strictEqual(result, undefined);
    });
  });

  describe('Node Operations', () => {
    it('should update node state', () => {
      store.createWorkflow('node-test');

      const nodeState = {
        nodeId: 'node-1',
        taskType: 'architect' as const,
        state: 'SUCCESS' as const,
        input: { key: 'value' },
        output: { result: 'done' },
        executedAt: new Date().toISOString(),
        duration: 1000,
      };

      store.updateNode('node-test', nodeState);

      const workflow = store.getWorkflow('node-test');
      assert.strictEqual(workflow?.nodes.get('node-1')?.state, 'SUCCESS');
    });

    it('should add execution history', () => {
      store.createWorkflow('history-test');

      store.addHistory('history-test', 'node-1', {
        attempt: 1,
        status: 'SUCCESS',
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        duration: 5000,
        cost: {
          tokens: 1000,
          estimatedUSD: 0.01,
          provider: 'test',
        },
      });

      const workflow = store.getWorkflow('history-test');
      assert.strictEqual(workflow?.nodeHistory.get('node-1')?.length, 1);
    });
  });

  describe('Encryption', () => {
    it('should encrypt data when saving', async () => {
      const workflowId = 'encryption-test';
      store.createWorkflow(workflowId);
      store.updateNode(workflowId, {
        nodeId: 'node-1',
        taskType: 'engineer',
        state: 'SUCCESS',
        input: { secret: 'sensitive-data' },
        output: { result: 'confidential' },
      });

      await store.save(workflowId);

      // Read raw file
      const filePath = path.join(testDir, `${workflowId}.json.enc`);
      const rawContent = await fs.readFile(filePath, 'utf-8');

      // Should NOT contain plain text
      assert.strictEqual(rawContent.includes('sensitive-data'), false);
      assert.strictEqual(rawContent.includes('confidential'), false);
    });

    it('should decrypt data when loading', async () => {
      const workflowId = 'decryption-test';
      const originalOutput = { secret: 'my-secret-data' };

      store.createWorkflow(workflowId);
      store.updateNode(workflowId, {
        nodeId: 'node-1',
        taskType: 'engineer',
        state: 'SUCCESS',
        input: {},
        output: originalOutput,
      });

      await store.save(workflowId);

      // Load workflow
      const loadedWorkflow = await store.load(workflowId);

      assert.strictEqual(loadedWorkflow.workflowId, workflowId);
      assert.deepStrictEqual(
        loadedWorkflow.nodes.get('node-1')?.output,
        originalOutput
      );
    });
  });

  describe('Persistence', () => {
    it('should delete workflow', async () => {
      const workflowId = 'delete-test';
      store.createWorkflow(workflowId);
      await store.save(workflowId);

      assert.strictEqual(await store.exists(workflowId), true);

      await store.delete(workflowId);

      assert.strictEqual(await store.exists(workflowId), false);
    });
  });
});
