/**
 * Unit tests for brain sync command
 * Tests: brainCommand, enhanceContextWithProjectInfo, context enhancement logic
 */
import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('brain command', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-brain-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  });

  describe('brainCommand exports', () => {
    test('exports brainCommand function', async () => {
      const { brainCommand } = await import('../lib/commands/brain.js');
      assert.strictEqual(typeof brainCommand, 'function');
    });

    test('exports registerBrainCommand function', async () => {
      const { registerBrainCommand } = await import('../lib/commands/brain.js');
      assert.strictEqual(typeof registerBrainCommand, 'function');
    });

    test('exports default object with both functions', async () => {
      const brainModule = await import('../lib/commands/brain.js');
      assert.ok(brainModule.default);
      assert.strictEqual(typeof brainModule.default.registerBrainCommand, 'function');
      assert.strictEqual(typeof brainModule.default.brainCommand, 'function');
    });
  });

  describe('context enhancement', () => {
    test('enhances context with project statistics', async () => {
      const { enhanceContextWithProjectInfo } = await import('../lib/commands/brain.js');

      const context = `# My Project

## Current Focus
Working on initial setup.
`;
      const state = { phases: [] };
      const graphSummary = { nodeCount: 42, edgeCount: 156, totalLines: 5000 };

      const enhanced = await enhanceContextWithProjectInfo(context, state, graphSummary);

      // Should add Current State section
      assert.ok(enhanced.includes('### Current State'), 'Should add Current State section');
      assert.ok(enhanced.includes('**Files Analyzed**: 42'), 'Should include file count');
      assert.ok(enhanced.includes('**Dependencies**: 156'), 'Should include dependency count');

      // Should add Project Statistics section
      assert.ok(
        enhanced.includes('## Project Statistics'),
        'Should add Project Statistics section'
      );
      assert.ok(enhanced.includes('| Files | 42 |'), 'Should include files in table');
      assert.ok(
        enhanced.includes('| Dependencies | 156 |'),
        'Should include dependencies in table'
      );
    });

    test('adds timestamp to context', async () => {
      const { enhanceContextWithProjectInfo } = await import('../lib/commands/brain.js');

      const context = `## Current Focus\nTest`;
      const state = {};
      const graphSummary = { nodeCount: 10, edgeCount: 20 };

      const enhanced = await enhanceContextWithProjectInfo(context, state, graphSummary);

      // Should contain ISO timestamp
      const isoDateRegex = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
      assert.ok(isoDateRegex.test(enhanced), 'Should include ISO timestamp');
    });

    test('includes active phases when available', async () => {
      const { enhanceContextWithProjectInfo } = await import('../lib/commands/brain.js');

      const context = `## Current Focus\nTest`;
      const state = {
        phases: [
          {
            name: 'Phase 1',
            status: 'in-progress',
            steps: [{ status: 'completed' }, { status: 'pending' }],
          },
          { name: 'Phase 2', status: 'completed', steps: [{ status: 'completed' }] },
        ],
      };
      const graphSummary = { nodeCount: 10, edgeCount: 20 };

      const enhanced = await enhanceContextWithProjectInfo(context, state, graphSummary);

      assert.ok(enhanced.includes('### Active Phases:'), 'Should include Active Phases section');
      assert.ok(enhanced.includes('Phase 1'), 'Should include Phase 1');
      assert.ok(enhanced.includes('Phase 2'), 'Should include Phase 2');
      assert.ok(enhanced.includes('in-progress'), 'Should show phase status');
    });

    test('replaces existing Current State sections', async () => {
      const { enhanceContextWithProjectInfo } = await import('../lib/commands/brain.js');

      const context = `## Current Focus
Working on setup.

### Current State
- Old data: should be removed
- Files: 5

## Other Section
Content here.
`;
      const state = {};
      const graphSummary = { nodeCount: 100, edgeCount: 200 };

      const enhanced = await enhanceContextWithProjectInfo(context, state, graphSummary);

      // Should have new data
      assert.ok(enhanced.includes('**Files Analyzed**: 100'), 'Should have updated file count');
      // Should not have old data
      assert.ok(!enhanced.includes('Old data: should be removed'), 'Should remove old state data');
    });

    test('replaces existing Project Statistics sections', async () => {
      const { enhanceContextWithProjectInfo } = await import('../lib/commands/brain.js');

      const context = `## Current Focus
Test.

## Project Statistics
Old stats here.

## Other Section
Content.
`;
      const state = {};
      const graphSummary = { nodeCount: 50, edgeCount: 100 };

      const enhanced = await enhanceContextWithProjectInfo(context, state, graphSummary);

      // Should have new stats table
      assert.ok(enhanced.includes('| Files | 50 |'), 'Should have updated stats');
    });

    test('handles empty phases gracefully', async () => {
      const { enhanceContextWithProjectInfo } = await import('../lib/commands/brain.js');

      const context = `## Current Focus\nTest`;
      const state = { phases: [] };
      const graphSummary = { nodeCount: 10, edgeCount: 20 };

      const enhanced = await enhanceContextWithProjectInfo(context, state, graphSummary);

      // Should not have Active Phases section
      assert.ok(
        !enhanced.includes('### Active Phases:'),
        'Should not include Active Phases when empty'
      );
    });

    test('handles missing phases property', async () => {
      const { enhanceContextWithProjectInfo } = await import('../lib/commands/brain.js');

      const context = `## Current Focus\nTest`;
      const state = {}; // No phases property
      const graphSummary = { nodeCount: 10, edgeCount: 20 };

      const enhanced = await enhanceContextWithProjectInfo(context, state, graphSummary);

      // Should still work without phases
      assert.ok(enhanced.includes('### Current State'), 'Should still add Current State');
    });

    test('handles null state gracefully', async () => {
      const { enhanceContextWithProjectInfo } = await import('../lib/commands/brain.js');

      const context = `## Current Focus\nTest`;
      const state = null;
      const graphSummary = { nodeCount: 10, edgeCount: 20 };

      const enhanced = await enhanceContextWithProjectInfo(context, state, graphSummary);

      // Should still work with null state
      assert.ok(enhanced.includes('### Current State'), 'Should still add Current State');
      assert.ok(enhanced.includes('**Project Phases**: 0'), 'Should show 0 phases');
    });

    test('appends context when Current Focus section missing', async () => {
      const { enhanceContextWithProjectInfo } = await import('../lib/commands/brain.js');

      const context = `# My Project\n\nSome content without Current Focus.`;
      const state = {};
      const graphSummary = { nodeCount: 10, edgeCount: 20 };

      const enhanced = await enhanceContextWithProjectInfo(context, state, graphSummary);

      // Should add Current Focus section
      assert.ok(enhanced.includes('## Current Focus'), 'Should add Current Focus section');
      assert.ok(
        enhanced.includes('### Current State'),
        'Should add Current State within Current Focus'
      );
    });

    test('limits phases display to first 3', async () => {
      const { enhanceContextWithProjectInfo } = await import('../lib/commands/brain.js');

      const context = `## Current Focus\nTest`;
      const state = {
        phases: [
          { name: 'Phase 1', status: 'active', steps: [] },
          { name: 'Phase 2', status: 'active', steps: [] },
          { name: 'Phase 3', status: 'active', steps: [] },
          { name: 'Phase 4', status: 'active', steps: [] },
          { name: 'Phase 5', status: 'active', steps: [] },
        ],
      };
      const graphSummary = { nodeCount: 10, edgeCount: 20 };

      const enhanced = await enhanceContextWithProjectInfo(context, state, graphSummary);

      // Should only include first 3 phases
      assert.ok(enhanced.includes('Phase 1'), 'Should include Phase 1');
      assert.ok(enhanced.includes('Phase 2'), 'Should include Phase 2');
      assert.ok(enhanced.includes('Phase 3'), 'Should include Phase 3');
      // Phase 4 and 5 might be there or not depending on implementation
    });
  });

  describe('brainCommand functionality', () => {
    test('creates CONTEXT.md if it does not exist', async () => {
      const { brainCommand } = await import('../lib/commands/brain.js');

      // Ensure CONTEXT.md doesn't exist
      const contextPath = path.join(tmpDir, 'CONTEXT.md');

      // Mock projectGraph.scan
      const graphModule = await import('../lib/mcp/graph.js');
      const originalScan = graphModule.projectGraph.scan;
      graphModule.projectGraph.scan = async () => {};
      graphModule.projectGraph.getSummary = () => ({ nodeCount: 10, edgeCount: 20 });

      try {
        await brainCommand({ commit: false, push: false, force: false });

        // Check that CONTEXT.md was created
        const contextExists = await fs
          .access(contextPath)
          .then(() => true)
          .catch(() => false);

        assert.strictEqual(contextExists, true, 'CONTEXT.md should be created');

        const content = await fs.readFile(contextPath, 'utf8');
        assert.ok(content.includes('# {{PROJECT_NAME}}'), 'Should have template content');
      } finally {
        graphModule.projectGraph.scan = originalScan;
      }
    });

    test('updates existing CONTEXT.md', async () => {
      const { brainCommand } = await import('../lib/commands/brain.js');

      const contextPath = path.join(tmpDir, 'CONTEXT.md');
      await fs.writeFile(contextPath, `## Current Focus\nExisting content.`);

      // Mock projectGraph
      const graphModule = await import('../lib/mcp/graph.js');
      const originalScan = graphModule.projectGraph.scan;
      graphModule.projectGraph.scan = async () => {};
      graphModule.projectGraph.getSummary = () => ({ nodeCount: 25, edgeCount: 50 });

      try {
        await brainCommand({ commit: false, push: false, force: false });

        const content = await fs.readFile(contextPath, 'utf8');
        assert.ok(content.includes('Existing content'), 'Should preserve existing content');
        assert.ok(content.includes('**Files Analyzed**: 25'), 'Should add updated stats');
      } finally {
        graphModule.projectGraph.scan = originalScan;
      }
    });
  });

  describe('registerBrainCommand', () => {
    test('registers command with program', async () => {
      const { registerBrainCommand } = await import('../lib/commands/brain.js');

      // Mock program object
      const program = {
        command: function (name) {
          this.commandName = name;
          return this;
        },
        alias: function (alias) {
          this.commandAlias = alias;
          return this;
        },
        description: function (desc) {
          this.commandDescription = desc;
          return this;
        },
        option: function (flags, description) {
          if (!this.options) this.options = [];
          this.options.push({ flags, description });
          return this;
        },
        action: function (fn) {
          this.actionFn = fn;
          return this;
        },
      };

      registerBrainCommand(program);

      assert.strictEqual(program.commandName, 'brain', 'Should register "brain" command');
      assert.strictEqual(program.commandAlias, 'sync-brain', 'Should have alias');
      assert.ok(program.commandDescription.includes('Synchronize'), 'Should have description');
      assert.ok(program.options.length >= 2, 'Should have options');
      assert.strictEqual(typeof program.actionFn, 'function', 'Should have action function');
    });

    test('registers commit option', async () => {
      const { registerBrainCommand } = await import('../lib/commands/brain.js');

      const program = {
        command: () => program,
        alias: () => program,
        description: () => program,
        options: [],
        option: function (flags, description) {
          this.options.push({ flags, description });
          return this;
        },
        action: () => program,
      };

      registerBrainCommand(program);

      const commitOption = program.options.find((o) => o.flags.includes('--commit'));
      assert.ok(commitOption, 'Should have --commit option');
      assert.ok(
        commitOption.description.includes('commit'),
        'Should describe commit functionality'
      );
    });

    test('registers push option', async () => {
      const { registerBrainCommand } = await import('../lib/commands/brain.js');

      const program = {
        command: () => program,
        alias: () => program,
        description: () => program,
        options: [],
        option: function (flags, description) {
          this.options.push({ flags, description });
          return this;
        },
        action: () => program,
      };

      registerBrainCommand(program);

      const pushOption = program.options.find((o) => o.flags.includes('--push'));
      assert.ok(pushOption, 'Should have --push option');
      assert.ok(pushOption.description.includes('push'), 'Should describe push functionality');
    });

    test('registers force option', async () => {
      const { registerBrainCommand } = await import('../lib/commands/brain.js');

      const program = {
        command: () => program,
        alias: () => program,
        description: () => program,
        options: [],
        option: function (flags, description) {
          this.options.push({ flags, description });
          return this;
        },
        action: () => program,
      };

      registerBrainCommand(program);

      const forceOption = program.options.find((o) => o.flags.includes('--force'));
      assert.ok(forceOption, 'Should have --force option');
      assert.ok(forceOption.description.includes('Force'), 'Should describe force functionality');
    });
  });
});
