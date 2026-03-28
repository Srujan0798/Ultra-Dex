import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

import { createExecutionTrace, readExecutionTrace } from '../lib/analytics/execution-trace.js';

const cleanupPaths = new Set();

async function makeTempDir(prefix) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  cleanupPaths.add(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(
    Array.from(cleanupPaths).map(async (target) => {
      await fs.rm(target, { recursive: true, force: true }).catch(() => {});
    })
  );
  cleanupPaths.clear();
});

describe('execution trace recorder', () => {
  test('writes schema-complete trace entries', async () => {
    const traceDir = await makeTempDir('ultra-dex-trace-schema-');
    const trace = createExecutionTrace({ traceDir });

    await trace.record({
      agent: 'planner',
      action: 'WRITE_CODE',
      input: { filePath: 'src/app.js', content: 'console.log("x")' },
      output: 'Wrote src/app.js',
      status: 'success',
    });

    const events = await readExecutionTrace(trace.runId, { traceDir });
    assert.equal(events.length, 1);
    assert.equal(events[0].run_id, trace.runId);
    assert.equal(events[0].step, 1);
    assert.equal(events[0].agent, 'planner');
    assert.equal(events[0].action, 'WRITE_CODE');
    assert.equal(events[0].status, 'success');
    assert.equal(typeof events[0].input, 'string');
    assert.equal(typeof events[0].output, 'string');
  });

  test('run command source is wired to emit execution trace events', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'apps/cli/lib/commands/run.js'),
      'utf8'
    );

    assert.match(source, /ensureExecutionTrace/);
    assert.match(source, /Execution trace run_id:/);
    assert.match(source, /action:\s*'MODEL_RESPONSE'/);
    assert.match(source, /action:\s*'WRITE_CODE'/);
    assert.match(source, /action:\s*'FINAL_RESPONSE'/);
  });
});
