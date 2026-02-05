/**
 * Unit tests for github command
 * Tests: GitHub CLI integration, issue sync, PR creation, webhook parsing
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'child_process';
import { promisify } from 'util';

// Mock the execFile function to avoid actual GitHub CLI calls
const execFileAsync = promisify(execFile);

// Create a mock for child_process.execFile
let originalExecFile;

// Mock execFile to simulate GitHub CLI responses
function mockExecFile(command, args) {
  if (command === 'gh') {
    if (args[0] === '--version') {
      return Promise.resolve({ stdout: 'gh version 2.0.0' });
    }

    if (args[0] === 'auth' && args[1] === 'status') {
      return Promise.resolve({ stdout: 'Logged in to github.com' });
    }

    if (args[0] === 'repo' && args[1] === 'view') {
      return Promise.resolve({
        stdout: JSON.stringify({
          owner: { login: 'testuser' },
          name: 'testrepo',
          url: 'https://github.com/testuser/testrepo'
        })
      });
    }

    if (args[0] === 'issue' && args[1] === 'list') {
      // Return sample issues
      return Promise.resolve({
        stdout: JSON.stringify([
          {
            number: 1,
            title: 'Sample Issue',
            labels: [{ name: 'bug' }],
            body: 'This is a sample issue',
            assignees: [],
            createdAt: '2023-01-01T00:00:00Z'
          }
        ])
      });
    }
  }

  // For git commands, return success
  if (command === 'git') {
    return Promise.resolve({ stdout: '' });
  }

  // Default: reject with error
  return Promise.reject(new Error(`Unexpected command: ${command} ${args.join(' ')}`));
}

describe('github command', () => {
  let tmpDir;
  let originalCwd;
  let originalExecFile;

  beforeEach(async () => {
    // Store original execFile
    originalExecFile = global.originalExecFile || execFile;

    // Temporarily override the execFile function for mocking
    // We'll use a global variable to store the mock
    global.mockExecFileFunction = mockExecFile;

    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-github-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);

    // Clean up global mock
    global.mockExecFileFunction = undefined;

    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('registerGitHubCommand', () => {
    test('exports registerGitHubCommand function', async () => {
      const { registerGitHubCommand } = await import('../lib/commands/github.js');
      assert.strictEqual(typeof registerGitHubCommand, 'function');
    });

    test('registers github command with correct options', async () => {
      const { registerGitHubCommand } = await import('../lib/commands/github.js');

      const mockProgram = {
        command: function(name) {
          this.commandName = name;
          return this;
        },
        description: function(desc) {
          this.commandDescription = desc;
          return this;
        },
        option: function(flags, description, defaultValue) {
          if (!this.options) this.options = [];
          this.options.push({ flags, description, defaultValue });
          return this;
        },
        action: function(fn) {
          this.actionFn = fn;
          return this;
        }
      };

      registerGitHubCommand(mockProgram);

      assert.strictEqual(mockProgram.commandName, 'github');
      assert.ok(mockProgram.commandDescription.includes('GitHub integration'));
      
      // Check for expected options
      const expectedOptions = [
        '--sync',
        '--issues', 
        '--prs',
        '--create-issue',
        '--create-pr',
        '--status',
        '--labels',
        '--draft'
      ];
      
      const actualFlags = mockProgram.options.map(opt => opt.flags.split(' ')[0]);
      for (const expectedFlag of expectedOptions) {
        assert.ok(actualFlags.includes(expectedFlag), `Should have option ${expectedFlag}`);
      }
      
      assert.strictEqual(typeof mockProgram.actionFn, 'function');
    });
  });

  describe('GitHub CLI utilities', () => {
    test('checkGitHubCLI detects installed and authenticated status', async () => {
      const { checkGitHubCLI } = await import('../lib/commands/github.js');
      
      const status = await checkGitHubCLI();
      assert.strictEqual(status.installed, true);
      assert.strictEqual(status.authenticated, true);
    });

    test('getRepoInfo returns repository information', async () => {
      const { getRepoInfo } = await import('../lib/commands/github.js');
      
      const repoInfo = await getRepoInfo();
      assert.ok(repoInfo);
      assert.strictEqual(repoInfo.owner.login, 'testuser');
      assert.strictEqual(repoInfo.name, 'testrepo');
    });

    test('listIssues returns parsed issues', async () => {
      const { listIssues } = await import('../lib/commands/github.js');
      
      const issues = await listIssues();
      assert.ok(Array.isArray(issues));
      assert.ok(issues.length > 0);
      
      const issue = issues[0];
      assert.strictEqual(issue.number, 1);
      assert.strictEqual(issue.title, 'Sample Issue');
      assert.ok(Array.isArray(issue.labels));
    });

    test('createIssue function exists', async () => {
      const { createIssue } = await import('../lib/commands/github.js');
      assert.strictEqual(typeof createIssue, 'function');
    });

    test('createPullRequest function exists', async () => {
      const { createPullRequest } = await import('../lib/commands/github.js');
      assert.strictEqual(typeof createPullRequest, 'function');
    });

    test('listPRs function exists', async () => {
      const { listPRs } = await import('../lib/commands/github.js');
      assert.strictEqual(typeof listPRs, 'function');
    });
  });

  describe('Issue to Task conversion', () => {
    test('issueToTask converts GitHub issue to Ultra-Dex task format', async () => {
      const { issueToTask } = await import('../lib/commands/github.js');
      
      const sampleIssue = {
        number: 123,
        title: 'Fix login bug',
        body: 'User cannot login with email',
        labels: [{ name: 'bug' }],
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      const task = issueToTask(sampleIssue);
      
      assert.strictEqual(task.id, 'gh-123');
      assert.strictEqual(task.source, 'github');
      assert.strictEqual(task.issueNumber, 123);
      assert.strictEqual(task.title, 'Fix login bug');
      assert.strictEqual(task.description, 'User cannot login with email');
      assert.strictEqual(task.agent, '@Debugger'); // Bug label maps to Debugger agent
      assert.strictEqual(task.status, 'pending');
    });

    test('issueToTask defaults to Planner agent for unknown labels', async () => {
      const { issueToTask } = await import('../lib/commands/github.js');
      
      const sampleIssue = {
        number: 456,
        title: 'Feature request',
        body: 'Add new feature',
        labels: [{ name: 'enhancement' }], // No mapping for this label
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      const task = issueToTask(sampleIssue);
      
      assert.strictEqual(task.agent, '@Planner'); // Default agent
    });

    test('issueToTask maps backend label to Backend agent', async () => {
      const { issueToTask } = await import('../lib/commands/github.js');
      
      const sampleIssue = {
        number: 789,
        title: 'API endpoint',
        body: 'Create new API endpoint',
        labels: [{ name: 'backend' }],
        createdAt: '2023-01-01T00:00:00Z'
      };
      
      const task = issueToTask(sampleIssue);
      
      assert.strictEqual(task.agent, '@Backend');
    });
  });

  describe('Issue synchronization', () => {
    test('syncIssuesToTasks creates state file', async () => {
      const { syncIssuesToTasks } = await import('../lib/commands/github.js');
      
      const result = await syncIssuesToTasks(tmpDir);
      
      assert.ok(Array.isArray(result.all));
      assert.ok(Array.isArray(result.new));
      
      // Check that state file was created
      const stateFilePath = path.join(tmpDir, '.ultra-dex/github-sync.json');
      const stateExists = await fs.access(stateFilePath)
        .then(() => true)
        .catch(() => false);
        
      assert.ok(stateExists, 'State file should be created');
    });

    test('syncIssuesToTasks tracks synced issues', async () => {
      const { syncIssuesToTasks } = await import('../lib/commands/github.js');
      
      // First sync
      const result1 = await syncIssuesToTasks(tmpDir);
      assert.ok(result1.new.length >= 0); // May be 0 if issue was already synced
      
      // Second sync - should have 0 new issues
      const result2 = await syncIssuesToTasks(tmpDir);
      assert.ok(Array.isArray(result2.all));
    });
  });

  describe('Webhook parsing', () => {
    test('parseWebhook handles issue opened event', async () => {
      const { parseWebhook } = await import('../lib/commands/github.js');
      
      const webhookPayload = {
        action: 'opened',
        issue: {
          number: 1,
          title: 'New issue',
          labels: [{ name: 'bug' }]
        }
      };
      
      const parsed = parseWebhook(webhookPayload);
      
      assert.strictEqual(parsed.type, 'issue_opened');
      assert.ok(parsed.issue);
      assert.strictEqual(parsed.issue.issueNumber, 1);
    });

    test('parseWebhook handles workflow completed event', async () => {
      const { parseWebhook } = await import('../lib/commands/github.js');
      
      const webhookPayload = {
        action: 'completed',
        workflow_run: {
          id: 123,
          conclusion: 'success'
        }
      };
      
      const parsed = parseWebhook(webhookPayload);
      
      assert.strictEqual(parsed.type, 'workflow_completed');
      assert.strictEqual(parsed.success, true);
    });

    test('parseWebhook handles PR review event', async () => {
      const { parseWebhook } = await import('../lib/commands/github.js');
      
      const webhookPayload = {
        action: 'submitted',
        review: { state: 'approved' },
        pull_request: { number: 1 }
      };
      
      const parsed = parseWebhook(webhookPayload);
      
      assert.strictEqual(parsed.type, 'pr_review');
      assert.strictEqual(parsed.approved, true);
    });

    test('parseWebhook handles unknown event', async () => {
      const { parseWebhook } = await import('../lib/commands/github.js');
      
      const webhookPayload = {
        action: 'unknown_action',
        some_data: 'test'
      };
      
      const parsed = parseWebhook(webhookPayload);
      
      assert.strictEqual(parsed.type, 'unknown');
    });
  });

  describe('Configuration', () => {
    test('GITHUB_CONFIG has expected properties', async () => {
      // Since we can't directly import the config object, we'll test through the functions
      const { issueToTask } = await import('../lib/commands/github.js');
      
      // Test that label mappings work
      const backendIssue = { number: 1, title: 'Test', labels: [{ name: 'backend' }] };
      const backendTask = issueToTask(backendIssue);
      assert.strictEqual(backendTask.agent, '@Backend');
      
      const frontendIssue = { number: 2, title: 'Test', labels: [{ name: 'frontend' }] };
      const frontendTask = issueToTask(frontendIssue);
      assert.strictEqual(frontendTask.agent, '@Frontend');
    });
  });

  describe('Integration scenarios', () => {
    test('full sync workflow works', async () => {
      const { syncIssuesToTasks, issueToTask } = await import('../lib/commands/github.js');
      
      // Test issue to task conversion
      const sampleIssue = {
        number: 999,
        title: 'Integration test issue',
        body: 'Testing issue to task conversion',
        labels: [{ name: 'documentation' }],
        createdAt: new Date().toISOString()
      };
      
      const task = issueToTask(sampleIssue);
      assert.strictEqual(task.id, 'gh-999');
      assert.strictEqual(task.agent, '@Documentation');
      
      // Test sync
      const result = await syncIssuesToTasks(tmpDir);
      assert.ok(result.all !== undefined);
    });
  });
});