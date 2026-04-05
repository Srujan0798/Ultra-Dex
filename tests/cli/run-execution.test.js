import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, test } from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const CLI_PATH = path.resolve(process.cwd(), 'apps/cli/bin/ultra-dex.js');

describe('CLI Command: run execution', () => {
  let tmpDir;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-run-exec-'));
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('executes `ultra-dex run` with result, trace, artifacts, bounded steps, and prompt context', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'run-execution-smoke', private: true }, null, 2)
    );
    await fs.writeFile(
      path.join(tmpDir, 'CONTEXT.md'),
      'CONTEXT_TOKEN_XYZZY\nHonor this runtime context token in the answer.'
    );

    const { stdout } = await execFileAsync(
      process.execPath,
      [
        CLI_PATH,
        'run',
        'planner',
        '-t',
        'Confirm the runtime context token and finish in one step.',
        '--provider',
        'mock',
        '--max-steps',
        '1',
      ],
      {
        cwd: tmpDir,
        env: {
          ...process.env,
          DEBUG: '',
          MOCK_AI: '',
          MOCK_AI_PROVIDERS: '',
          NODE_ENV: 'test',
          NO_COLOR: '',
          ULTRA_DEX_SKIP_UPDATE_CHECK: 'true',
          ULTRA_DEX_V2_ROUTING: '', // Disable V2 routing for this test (uses original trace path)
        },
        maxBuffer: 4 * 1024 * 1024,
      }
    );

    assert.match(stdout, /Execution trace run_id:/);
    assert.match(stdout, /Result artifact:/);
    assert.match(stdout, /Trace artifact:/);
    assert.match(stdout, /Summary artifact:/);
    assert.match(stdout, /\[MockOpenAI\]/);
    assert.doesNotMatch(stdout, /\[Providers\]/);

    const runsDir = path.join(tmpDir, '.ultra-dex', 'runs');
    const runIds = await fs.readdir(runsDir);
    assert.equal(runIds.length, 1);

    const artifactDir = path.join(runsDir, runIds[0]);
    const resultPath = path.join(artifactDir, 'result.txt');
    const tracePath = path.join(artifactDir, 'trace.jsonl');
    const summaryPath = path.join(artifactDir, 'summary.json');

    const resultText = await fs.readFile(resultPath, 'utf8');
    const traceText = await fs.readFile(tracePath, 'utf8');
    const summary = JSON.parse(await fs.readFile(summaryPath, 'utf8'));
    const traceEvents = traceText
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));

    assert.match(resultText, /CONTEXT_TOKEN_XYZZY/);
    assert.equal(summary.command, 'run');
    assert.equal(summary.agent, 'planner');
    assert.equal(summary.status, 'success');
    // finalAction is the last trace event (MEMORY_UPDATE comes after FINAL_RESPONSE)
    assert.ok(
      summary.finalAction === 'FINAL_RESPONSE' || summary.finalAction === 'MEMORY_UPDATE'
    );
    // Use realpath to handle macOS /private/var vs /var symlink difference
    const realResultPath = await fs.realpath(resultPath);
    const realTracePath = await fs.realpath(tracePath);
    const realSummaryPath = await fs.realpath(summaryPath);
    assert.equal(summary.artifacts.result, realResultPath);
    assert.equal(summary.artifacts.trace, realTracePath);
    assert.equal(summary.artifacts.summary, realSummaryPath);

    const promptContextEvent = traceEvents.find((event) => event.action === 'PROMPT_CONTEXT');
    assert.ok(promptContextEvent);
    assert.match(promptContextEvent.output, /CONTEXT_TOKEN_XYZZY/);

    const finalResponseEvent = traceEvents.find((event) => event.action === 'FINAL_RESPONSE');
    assert.ok(finalResponseEvent);
    assert.equal(
      Math.max(...traceEvents.map((event) => Number(event.metadata?.loopStep) || 0)),
      1
    );
    assert.equal(
      traceEvents.some((event) => event.action === 'STEP_LIMIT'),
      false
    );
  });
});
