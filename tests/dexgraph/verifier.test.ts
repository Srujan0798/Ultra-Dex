import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createVerifier, Verifier } from '../../dexgraph/verifier.js';
import { GraphNode } from '../../dexgraph/types.js';

function makeNode(id: string, verify?: GraphNode['verification']): GraphNode {
  return { id, role: 'engineer', instruction: 'test', dependencies: [], context: {}, parallel: false, state: 'CREATED', verification: verify };
}

describe('Verifier', () => {
  const verifier = createVerifier();

  it('validates SUCCESS output correctly', () => {
    const result = verifier.verify(makeNode('A'), { data: 'ok' });
    assert.equal(result.valid, true);
    assert.equal(result.confidence, 0.95);
  });

  it('rejects empty output', () => {
    const result = verifier.verify(makeNode('A'), undefined);
    assert.equal(result.valid, false);
    assert.ok(result.errors?.length);
  });

  it('rejects null output', () => {
    const result = verifier.verify(makeNode('A'), null);
    assert.equal(result.valid, false);
  });

  it('validates file_exists check — passes', () => {
    const node = makeNode('A', { type: 'file_exists', command: 'src/main.ts' });
    const result = verifier.verify(node, { files: ['src/main.ts', 'src/test.ts'] });
    assert.equal(result.valid, true);
  });

  it('validates file_exists check — fails', () => {
    const node = makeNode('A', { type: 'file_exists', command: 'src/main.ts' });
    const result = verifier.verify(node, { files: ['src/other.ts'] });
    assert.equal(result.valid, false);
    assert.ok(result.errors?.[0].includes('not found'));
  });

  it('validates unit_test check — passes', () => {
    const node = makeNode('A', { type: 'unit_test', command: 'npm test' });
    const result = verifier.verify(node, { testResult: { passed: true } });
    assert.equal(result.valid, true);
  });

  it('validates unit_test check — fails', () => {
    const node = makeNode('A', { type: 'unit_test', command: 'npm test' });
    const result = verifier.verify(node, { testResult: { passed: false } });
    assert.equal(result.valid, false);
    assert.ok(result.errors?.[0].includes('failed'));
  });

  it('validates llm_check — always passes', () => {
    const node = makeNode('A', { type: 'llm_check', policy: 'check quality' });
    const result = verifier.verify(node, { data: 'anything' });
    assert.equal(result.valid, true);
  });

  it('validates custom check — passes through', () => {
    const node = makeNode('A', { type: 'custom', command: 'custom-check' });
    const result = verifier.verify(node, { data: 'ok' });
    assert.equal(result.valid, true);
  });

  it('returns confidence score', () => {
    const result = verifier.verify(makeNode('A'), { ok: true });
    assert.equal(result.confidence, 0.95);
  });

  it('returns 0 confidence on failure', () => {
    const result = verifier.verify(makeNode('A'), null);
    assert.equal(result.confidence, 0);
  });

  it('handles output without verification rule', () => {
    const node = makeNode('A');
    const result = verifier.verify(node, { simple: 'value' });
    assert.equal(result.valid, true);
  });
});
