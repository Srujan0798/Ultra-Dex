import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';

import { createExecutionTrace } from '../lib/analytics/execution-trace.js';
import { getRunArtifactPaths, writeRunArtifacts } from '../lib/analytics/run-artifacts.js';

describe('run artifacts', () => {
  let tmpDir;
  let originalCwd;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-run-artifacts-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('writes required result, trace, and summary artifacts for a run', async () => {
    const trace = createExecutionTrace();

    await trace.record({
      agent: 'planner',
      action: 'RUN_START',
      input: 'Ship priority 5',
      output: 'Agent execution started',
      status: 'success',
    });
    await trace.record({
      agent: 'planner',
      action: 'WRITE_CODE',
      input: { filePath: 'apps/cli/lib/commands/run.js', content: 'patched' },
      output: 'Wrote apps/cli/lib/commands/run.js',
      status: 'success',
    });
    await trace.record({
      agent: 'planner',
      action: 'FINAL_RESPONSE',
      input: 'Ship priority 5',
      output: 'Completed priority 5.',
      status: 'success',
    });

    const artifactBundle = await writeRunArtifacts({
      runId: trace.runId,
      command: 'run',
      agent: 'planner',
      task: 'Ship priority 5',
      result: 'Completed priority 5.',
      traceFile: trace.traceFile,
    });

    const resultText = await fs.readFile(artifactBundle.paths.result, 'utf8');
    const traceText = await fs.readFile(artifactBundle.paths.trace, 'utf8');
    const summary = JSON.parse(await fs.readFile(artifactBundle.paths.summary, 'utf8'));

    assert.equal(resultText, 'Completed priority 5.');
    assert.match(traceText, /"action":"WRITE_CODE"/);
    assert.equal(summary.runId, trace.runId);
    assert.equal(summary.command, 'run');
    assert.equal(summary.agent, 'planner');
    assert.equal(summary.finalAction, 'FINAL_RESPONSE');
    assert.equal(summary.actionCounts.WRITE_CODE, 1);
    assert.deepEqual(summary.filesTouched, ['apps/cli/lib/commands/run.js']);
    assert.equal(summary.artifacts.result, artifactBundle.paths.result);
    assert.equal(summary.artifacts.trace, artifactBundle.paths.trace);
    assert.equal(summary.artifacts.summary, artifactBundle.paths.summary);
  });

  test('computes deterministic artifact paths under .ultra-dex/runs', () => {
    const paths = getRunArtifactPaths('run_123');

    assert.equal(paths.directory, path.resolve('.ultra-dex', 'runs', 'run_123'));
    assert.equal(paths.result, path.resolve('.ultra-dex', 'runs', 'run_123', 'result.txt'));
    assert.equal(paths.trace, path.resolve('.ultra-dex', 'runs', 'run_123', 'trace.jsonl'));
    assert.equal(paths.summary, path.resolve('.ultra-dex', 'runs', 'run_123', 'summary.json'));
  });

  test('run command source persists first-class artifacts without relying on --output', async () => {
    const source = await fs.readFile(
      path.join(originalCwd, 'apps/cli/lib/commands/run.js'),
      'utf8'
    );

    assert.match(source, /writeRunArtifacts/);
    assert.match(source, /persistAndPrintRunArtifacts/);
    assert.match(source, /Result artifact:/);
    assert.match(source, /Trace artifact:/);
    assert.match(source, /Summary artifact:/);
    assert.match(source, /\[No result returned\]/);
  });
});
