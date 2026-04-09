import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import {
  buildPromptContextSection,
  extractDecision,
  stripDecisionLine,
} from '../lib/run-context.js';

describe('run context helpers', () => {
  test('builds a prompt section from context, plan, state, graph, history, and memory', () => {
    const promptContext = buildPromptContextSection({
      contextMarkdown: 'Project constraints and business rules.',
      planMarkdown: '## 1. Foundation\n- Ship runtime context',
      state: {
        project: { name: 'Ultra-Dex' },
        phases: [{ name: 'Foundation', status: 'active', steps: [1, 2] }],
        runtime: {
          recentSteps: [
            {
              agent: 'planner',
              action: 'READ_CODE',
              status: 'success',
              decision: 'Inspect the current run flow.',
            },
          ],
        },
      },
      graph: { nodeCount: 42, edgeCount: 17 },
      memories: [
        {
          text: 'Prior run showed write verification failures.',
          tags: ['planner', 'run-context'],
        },
      ],
      interactionHistory: [
        {
          agent: 'planner',
          action: 'WRITE_CODE',
          status: 'success',
          decision: 'Persist recent step state.',
        },
      ],
    });

    assert.match(promptContext, /## Context/);
    assert.match(promptContext, /## Implementation Plan/);
    assert.match(promptContext, /## Live State/);
    assert.match(promptContext, /## Codebase Graph/);
    assert.match(promptContext, /## Execution History/);
    assert.match(promptContext, /## Relevant Memory/);
  });

  test('extracts and strips explicit decisions from model output', () => {
    const content = `DECISION: Read the run loop before changing persistence.\n>> READ_CODE: "apps/cli/lib/commands/run.js"`;

    assert.equal(extractDecision(content), 'Read the run loop before changing persistence.');
    assert.equal(stripDecisionLine(content), '>> READ_CODE: "apps/cli/lib/commands/run.js"');
  });

  test('synthesizes a decision from a tool-only response', () => {
    const content = '>> RUN_SHELL: "npm test -- run-context"';

    assert.equal(extractDecision(content), 'Execute RUN_SHELL on npm test -- run-context.');
  });
});

describe('run command wiring', () => {
  test('wires prompt context, decision capture, and memory update into run.js', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'apps/cli/lib/commands/run.js'),
      'utf8'
    );

    assert.match(source, /buildPromptContextSection/);
    assert.match(source, /action:\s*'PROMPT_CONTEXT'/);
    assert.match(source, /extractDecision/);
    assert.match(source, /action:\s*'DECISION'/);
    assert.match(source, /ultraMemory\.remember/);
    assert.match(source, /action:\s*'MEMORY_UPDATE'/);
    assert.match(source, /DEFAULT_MAX_STEPS/);
    assert.match(source, /for \(let stepIndex = 1; stepIndex <= boundedMaxSteps;/);
    assert.match(source, /action:\s*'STEP_LIMIT'/);
    assert.match(source, /--max-steps <steps>/);
    assert.doesNotMatch(source, /SEARCH_CODE/);
    assert.doesNotMatch(source, /--stream/);
    assert.doesNotMatch(source, /--no-stream/);
  });
});
