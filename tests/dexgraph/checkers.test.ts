import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkExecutionSuccess,
  checkOutputExists,
  checkOutputField,
  checkFileExists,
  checkTestsPassed,
  checkConfidence,
  checkDuration,
  runNodeChecks,
} from '../../dexgraph/checkers.js';
import { ExecutionResult } from '../../adapters/executionAdapter.js';
import { GraphNode } from '../../dexgraph/types.js';

function makeResult(overrides: Partial<ExecutionResult> = {}): ExecutionResult {
  return {
    status: 'SUCCESS',
    output: { result: 'ok' },
    logs: [],
    cost: { tokens: 10, estimatedUSD: 0.001, provider: 'mock' },
    confidence: 0.95,
    duration: 100,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeNode(verify?: GraphNode['verification']): GraphNode {
  return {
    id: 'n1', role: 'engineer', instruction: 'test',
    dependencies: [], context: {}, parallel: false,
    state: 'RUNNING', verification: verify,
  };
}

describe('checkExecutionSuccess', () => {
  it('passes on SUCCESS status', () => {
    assert.strictEqual(checkExecutionSuccess(makeResult()).passed, true);
  });

  it('fails on FAILED status', () => {
    const r = checkExecutionSuccess(makeResult({ status: 'FAILED', error: 'oops' }));
    assert.strictEqual(r.passed, false);
    assert.ok(r.reason.includes('FAILED'));
  });

  it('fails on TIMEOUT', () => {
    assert.strictEqual(checkExecutionSuccess(makeResult({ status: 'TIMEOUT' })).passed, false);
  });

  it('fails on CANCELLED', () => {
    assert.strictEqual(checkExecutionSuccess(makeResult({ status: 'CANCELLED' })).passed, false);
  });
});

describe('checkOutputExists', () => {
  it('passes when output is present', () => {
    assert.strictEqual(checkOutputExists(makeResult({ output: { x: 1 } })).passed, true);
  });

  it('fails when output is undefined', () => {
    assert.strictEqual(checkOutputExists(makeResult({ output: undefined })).passed, false);
  });

  it('fails when output is null', () => {
    assert.strictEqual(checkOutputExists(makeResult({ output: null })).passed, false);
  });

  it('passes when output is a string', () => {
    assert.strictEqual(checkOutputExists(makeResult({ output: 'hello' })).passed, true);
  });
});

describe('checkOutputField', () => {
  it('passes when field is present', () => {
    const r = checkOutputField(makeResult({ output: { foo: 'bar' } }), 'foo');
    assert.strictEqual(r.passed, true);
  });

  it('fails when field is missing', () => {
    const r = checkOutputField(makeResult({ output: { foo: 'bar' } }), 'baz');
    assert.strictEqual(r.passed, false);
    assert.ok(r.reason.includes('"baz"'));
  });

  it('fails when output is not an object', () => {
    const r = checkOutputField(makeResult({ output: 'not-object' }), 'foo');
    assert.strictEqual(r.passed, false);
  });

  it('fails when field value is null', () => {
    const r = checkOutputField(makeResult({ output: { foo: null } }), 'foo');
    assert.strictEqual(r.passed, false);
  });
});

describe('checkFileExists', () => {
  it('passes when file is in output.files', () => {
    const r = checkFileExists(makeResult({ output: { files: ['a.ts', 'b.ts'] } }), 'a.ts');
    assert.strictEqual(r.passed, true);
  });

  it('fails when file is not in output.files', () => {
    const r = checkFileExists(makeResult({ output: { files: ['b.ts'] } }), 'a.ts');
    assert.strictEqual(r.passed, false);
    assert.ok(r.reason.includes('a.ts'));
  });

  it('fails when output.files is not an array', () => {
    const r = checkFileExists(makeResult({ output: { files: 'a.ts' } }), 'a.ts');
    assert.strictEqual(r.passed, false);
  });

  it('fails when output is not an object', () => {
    const r = checkFileExists(makeResult({ output: null }), 'a.ts');
    assert.strictEqual(r.passed, false);
  });
});

describe('checkTestsPassed', () => {
  it('passes when testResult.passed is true', () => {
    const r = checkTestsPassed(makeResult({ output: { testResult: { passed: true } } }));
    assert.strictEqual(r.passed, true);
  });

  it('fails when testResult.passed is false', () => {
    const r = checkTestsPassed(makeResult({ output: { testResult: { passed: false } } }));
    assert.strictEqual(r.passed, false);
  });

  it('fails when testResult is missing', () => {
    const r = checkTestsPassed(makeResult({ output: {} }));
    assert.strictEqual(r.passed, false);
  });

  it('fails when output is not an object', () => {
    const r = checkTestsPassed(makeResult({ output: null }));
    assert.strictEqual(r.passed, false);
  });

  it('includes failed count in reason', () => {
    const r = checkTestsPassed(makeResult({ output: { testResult: { passed: false, failed: 3 } } }));
    assert.ok(r.reason.includes('3'));
  });
});

describe('checkConfidence', () => {
  it('passes when confidence meets threshold', () => {
    assert.strictEqual(checkConfidence(makeResult({ confidence: 0.9 }), 0.7).passed, true);
  });

  it('fails when confidence is below threshold', () => {
    const r = checkConfidence(makeResult({ confidence: 0.5 }), 0.7);
    assert.strictEqual(r.passed, false);
    assert.ok(r.reason.includes('0.50'));
  });

  it('passes when confidence exactly equals threshold', () => {
    assert.strictEqual(checkConfidence(makeResult({ confidence: 0.7 }), 0.7).passed, true);
  });
});

describe('checkDuration', () => {
  it('passes when duration is within limit', () => {
    assert.strictEqual(checkDuration(makeResult({ duration: 100 }), 1000).passed, true);
  });

  it('fails when duration exceeds limit', () => {
    const r = checkDuration(makeResult({ duration: 5000 }), 1000);
    assert.strictEqual(r.passed, false);
    assert.ok(r.reason.includes('5000ms'));
  });

  it('passes when duration equals limit', () => {
    assert.strictEqual(checkDuration(makeResult({ duration: 1000 }), 1000).passed, true);
  });
});

describe('runNodeChecks', () => {
  it('passes for successful node with no verification rule', () => {
    const node = makeNode();
    const result = runNodeChecks(node, makeResult());
    assert.strictEqual(result.passed, true);
    assert.strictEqual(result.failedChecks.length, 0);
  });

  it('fails when execution failed', () => {
    const node = makeNode();
    const result = runNodeChecks(node, makeResult({ status: 'FAILED', error: 'x' }));
    assert.strictEqual(result.passed, false);
    assert.ok(result.failedChecks.length > 0);
  });

  it('runs file_exists check', () => {
    const node = makeNode({ type: 'file_exists', command: 'src/main.ts' });
    const r = runNodeChecks(node, makeResult({ output: { files: ['src/main.ts'] } }));
    assert.strictEqual(r.passed, true);
  });

  it('fails file_exists when file missing', () => {
    const node = makeNode({ type: 'file_exists', command: 'src/missing.ts' });
    const r = runNodeChecks(node, makeResult({ output: { files: ['src/other.ts'] } }));
    assert.strictEqual(r.passed, false);
  });

  it('runs unit_test check', () => {
    const node = makeNode({ type: 'unit_test', command: 'npm test' });
    const r = runNodeChecks(node, makeResult({ output: { testResult: { passed: true } } }));
    assert.strictEqual(r.passed, true);
  });

  it('fails unit_test when tests fail', () => {
    const node = makeNode({ type: 'unit_test' });
    const r = runNodeChecks(node, makeResult({ output: { testResult: { passed: false } } }));
    assert.strictEqual(r.passed, false);
  });

  it('llm_check applies confidence threshold', () => {
    const node = makeNode({ type: 'llm_check', policy: 'must be good' });
    const r = runNodeChecks(node, makeResult({ confidence: 0.9 }));
    assert.strictEqual(r.passed, true);
  });

  it('returns all check details in checks array', () => {
    const node = makeNode({ type: 'unit_test' });
    const r = runNodeChecks(node, makeResult({ output: { testResult: { passed: true } } }));
    assert.ok(r.checks.length >= 2);
  });
});
