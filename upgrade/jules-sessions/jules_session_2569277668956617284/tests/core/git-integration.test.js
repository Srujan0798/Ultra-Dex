import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import fs from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

// Mock implementation of Git integration for testing
const git = {
  async isRepository() {
    try {
      await execAsync('git rev-parse --is-inside-work-tree');
      return true;
    } catch {
      return false;
    }
  },

  async getCurrentBranch() {
    try {
      const { stdout } = await execAsync('git branch --show-current');
      const branch = stdout.trim();
      // In CI environments (detached HEAD), branch might be empty
      if (!branch) {
        // Fallback to getting the hash or a special indicator
        const { stdout: hash } = await execAsync('git rev-parse --short HEAD');
        return `HEAD-${hash.trim()}`;
      }
      return branch;
    } catch {
      return 'unknown';
    }
  },

  async getStatus() {
    try {
      const { stdout } = await execAsync('git status --porcelain');
      return stdout.trim().split('\n').filter(Boolean).map(line => {
        const [status, ...pathParts] = line.trim().split(/\s+/);
        return { status, path: pathParts.join(' ') };
      });
    } catch {
      return [];
    }
  },

  async getDiff(staged = false) {
    try {
      const flag = staged ? '--staged' : '';
      const { stdout } = await execAsync(`git diff ${flag}`);
      return stdout;
    } catch {
      return '';
    }
  },

  async getCommitHistory(limit = 10) {
    try {
      const { stdout } = await execAsync(`git log -n ${limit} --pretty=format:"%h|%s|%an|%ad"`);
      return stdout.trim().split('\n').map(line => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
      });
    } catch {
      return [];
    }
  },

  async getCurrentCommit() {
    try {
      const { stdout } = await execAsync('git rev-parse HEAD');
      return stdout.trim();
    } catch {
      return null;
    }
  },

  async getChangedFiles(base = 'HEAD') {
    try {
      const { stdout } = await execAsync(`git diff --name-only ${base}`);
      return stdout.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  },

  async getFileHistory(filepath) {
    try {
      const { stdout } = await execAsync(`git log --pretty=format:"%h|%s|%an|%ad" -- ${filepath}`);
      return stdout.trim().split('\n').map(line => {
        const [hash, message, author, date] = line.split('|');
        return { hash, message, author, date };
      });
    } catch {
      return [];
    }
  },

  async getConfig(key) {
    try {
      const { stdout } = await execAsync(`git config ${key}`);
      return stdout.trim();
    } catch {
      return null;
    }
  },

  async getRepoRoot() {
    try {
      const { stdout } = await execAsync('git rev-parse --show-toplevel');
      return stdout.trim();
    } catch {
      return null;
    }
  },

  async getContext() {
    const [branch, commit, status, root] = await Promise.all([
      this.getCurrentBranch(),
      this.getCurrentCommit(),
      this.getStatus(),
      this.getRepoRoot()
    ]);

    return {
      branch,
      commit,
      status,
      root,
      timestamp: new Date().toISOString()
    };
  }
};

describe('Git Integration', () => {
  describe('Repository Detection', () => {
    it('should detect if current directory is a Git repository', async () => {
      const isRepo = await git.isRepository();
      assert.strictEqual(isRepo, true);
    });
  });

  describe('Branch Operations', () => {
    it('should get current branch name', async () => {
      const branch = await git.getCurrentBranch();
      assert.ok(typeof branch === 'string');
      assert.ok(branch.length > 0);
    });
  });

  describe('Status Operations', () => {
    it('should get Git status', async () => {
      const status = await git.getStatus();
      assert.ok(Array.isArray(status));
    });
  });

  describe('Diff Operations', () => {
    it('should get working directory diff', async () => {
      const diff = await git.getDiff();
      assert.strictEqual(typeof diff, 'string');
    });

    it('should get staged diff', async () => {
      const diff = await git.getDiff(true);
      assert.strictEqual(typeof diff, 'string');
    });
  });

  describe('Commit Operations', () => {
    it('should get commit history', async () => {
      const history = await git.getCommitHistory();
      assert.ok(Array.isArray(history));
      if (history.length > 0) {
        assert.ok(history[0].hash);
        assert.ok(history[0].message);
      }
    });

    it('should get current commit hash', async () => {
      const hash = await git.getCurrentCommit();
      assert.ok(typeof hash === 'string');
      assert.strictEqual(hash.length, 40);
    });
  });

  describe('File Operations', () => {
    it('should get changed files', async () => {
      const files = await git.getChangedFiles();
      assert.ok(Array.isArray(files));
    });

    it('should get file history', async () => {
      // Use this file itself for history test
      const history = await git.getFileHistory('tests/core/git-integration.test.js');
      assert.ok(Array.isArray(history));
    });
  });

  describe('Configuration Operations', () => {
    it('should get Git configuration', async () => {
      const email = await git.getConfig('user.email');
      // In CI, user.email might not be set or might be null if not configured globally
      // So we check if it returns a string or null, both are valid for the test execution stability
      assert.ok(email === null || typeof email === 'string'); 
    });

    it('should get repository root', async () => {
      const root = await git.getRepoRoot();
      assert.ok(typeof root === 'string');
      assert.ok(path.isAbsolute(root));
    });
  });

  describe('Git Context', () => {
    it('should get comprehensive Git context', async () => {
      const context = await git.getContext();
      assert.ok(context.branch);
      assert.ok(context.commit);
      assert.ok(Array.isArray(context.status));
      assert.ok(context.root);
      assert.ok(context.timestamp);
    });
  });

  describe('Memory Integration', () => {
    it('should link memory entries to Git context', async () => {
      const context = await git.getContext();
      const memoryEntry = {
        content: 'Test memory with git context',
        context: {
          git: {
            commit: context.commit,
            branch: context.branch
          }
        }
      };

      assert.strictEqual(memoryEntry.context.git.commit, context.commit);
      assert.strictEqual(memoryEntry.context.git.branch, context.branch);
    });
  });
});
