/**
 * @fileoverview Autonomous E2e Test module
 * @module test/autonomous-e2e.test
 */

import { test } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AutonomousEngine } from '../lib/commands/autonomous.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tempDir = path.join(__dirname, 'temp-autonomous-test');

async function setup() {
  await fs.mkdir(tempDir, { recursive: true });

  // Create a buggy file
  await fs.writeFile(
    path.join(tempDir, 'math.js'),
    `
    export function add(a, b) {
      return a - b; // BUG: subtraction instead of addition
    }
  `
  );

  // Create a test file (simple check script)
  await fs.writeFile(
    path.join(tempDir, 'test-math.js'),
    `
    import { add } from './math.js';
    if (add(2, 3) !== 5) {
      console.error('Test failed: 2 + 3 should be 5');
      process.exit(1);
    }
  `
  );

  // Mock package.json so it looks like a project
  await fs.writeFile(
    path.join(tempDir, 'package.json'),
    JSON.stringify({
      name: 'test-project',
      type: 'module',
    })
  );
}

async function teardown() {
  await fs.rm(tempDir, { recursive: true, force: true });
}

test('AutonomousEngine self-healing E2E', async (t) => {
  await setup();
  const originalCwd = process.cwd();

  try {
    process.chdir(tempDir);

    // Mock Provider
    const mockProvider = {
      generate: async (system, prompt) => {
        // Return a fix instruction
        // Note: Using absolute path resolution in runAgentLoop might still be tricky if not handled right,
        // but changing CWD should fix relative paths.

        // Return null for subsequent calls to stop recursion
        if (prompt.includes('Successfully wrote')) {
          return { content: 'Fix applied.' };
        }

        return {
          content: `I found the bug. It's a subtraction instead of addition.
>> WRITE_CODE: "math.js" "
    export function add(a, b) {
      return a + b; // FIXED
    }
"
`,
        };
      },
    };

    const engine = new AutonomousEngine(tempDir, mockProvider, 'node test-math.js');

    // 1. Initial Test Run (should fail)
    const initialResult = await engine.runTests();
    assert.strictEqual(initialResult.passed, false, 'Initial test should fail');

    // 2. Run Self-Heal
    await engine.selfHeal(initialResult.output, 'Test failed');

    // 3. Verify Fix
    const fileContent = await fs.readFile(path.join(tempDir, 'math.js'), 'utf8');
    assert.match(fileContent, /return a \+ b/, 'File should be patched with addition');

    // 4. Verify Test Pass
    const finalResult = await engine.runTests();
    assert.strictEqual(finalResult.passed, true, 'Tests should pass after healing');
  } finally {
    process.chdir(originalCwd);
    await teardown();
  }
});
