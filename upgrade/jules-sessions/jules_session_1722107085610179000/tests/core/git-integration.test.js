import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { gitIntegration } from '../../src/core/integrations/git.js';

describe('Git Integration', () => {
  let gitIntegrationInstance;

  beforeEach(() => {
    gitIntegrationInstance = gitIntegration;
    gitIntegrationInstance.options.repoPath = process.cwd();
  });

  describe('Repository Detection', () => {
    it('should detect if current directory is a Git repository', async () => {
      const isRepo = await gitIntegrationInstance.isGitRepository();
      assert.strictEqual(typeof isRepo, 'boolean');
    });
  });

  describe('Branch Operations', () => {
    it('should get current branch name', async () => {
      const branch = await gitIntegrationInstance.getCurrentBranch();
      assert.strictEqual(typeof branch, 'string');
      assert.ok(branch.length > 0);
    });
  });

  describe('Status Operations', () => {
    it('should get Git status', async () => {
      const status = await gitIntegrationInstance.getStatus();
      assert.ok(status.hasOwnProperty('files'));
      assert.ok(Array.isArray(status.files));
    });
  });

  describe('Diff Operations', () => {
    it('should get working directory diff', async () => {
      const diff = await gitIntegrationInstance.getWorkingDiff();
      assert.strictEqual(typeof diff, 'string');
    });

    it('should get staged diff', async () => {
      const diff = await gitIntegrationInstance.getStagedDiff();
      assert.strictEqual(typeof diff, 'string');
    });
  });

  describe('Commit Operations', () => {
    it('should get commit history', async () => {
      const log = await gitIntegrationInstance.getLog(5);
      assert.ok(Array.isArray(log));
    });

    it('should get current commit hash', async () => {
      const hash = await gitIntegrationInstance.getCurrentCommitHash();
      assert.strictEqual(typeof hash, 'string');
      assert.ok(hash.length > 0);
    });
  });

  describe('File Operations', () => {
    it('should get changed files', async () => {
      const files = await gitIntegrationInstance.getChangedFiles();
      assert.ok(Array.isArray(files));
    });

    it('should get file history', async () => {
      // Just test with a known file that should exist
      const history = await gitIntegrationInstance.getFileHistory('package.json');
      assert.ok(Array.isArray(history));
    });
  });

  describe('Configuration Operations', () => {
    it('should get Git configuration', async () => {
      const userConfig = await gitIntegrationInstance.getConfig('user.name');
      if (userConfig === null) {
        assert.strictEqual(userConfig, null);
      } else {
        assert.strictEqual(typeof userConfig, 'string');
      }
    });

    it('should get repository root', async () => {
      const root = await gitIntegrationInstance.getRepoRoot();
      assert.strictEqual(typeof root, 'string');
      assert.ok(root.length > 0);
    });
  });

  describe('Git Context', () => {
    it('should get comprehensive Git context', async () => {
      const context = await gitIntegrationInstance.getGitContext();
      assert.ok(context.hasOwnProperty('isGitRepo'));
      assert.ok(typeof context.isGitRepo === 'boolean');
    });
  });

  describe('Memory Integration', () => {
    it('should link memory entries to Git context', async () => {
      const mockMemoryEntry = { content: 'Test memory entry', type: 'observation' };
      const enhancedEntry = await gitIntegrationInstance.linkMemoryToGit(mockMemoryEntry);

      if (await gitIntegrationInstance.isGitRepository()) {
        assert.ok(enhancedEntry.hasOwnProperty('gitContext'));
        assert.ok(enhancedEntry.gitContext.hasOwnProperty('commit'));
      } else {
        // If not in a Git repo, should return original entry
        assert.deepStrictEqual(enhancedEntry, mockMemoryEntry);
      }
    });
  });
});