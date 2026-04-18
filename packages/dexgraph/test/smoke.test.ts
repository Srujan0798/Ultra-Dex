import { describe, it } from 'node:test';
import assert from 'node:assert';

import { parse } from '../src/parser.js';
import { DexGraph } from '../src/graph.js';

describe('E2E Smoke Test', () => {
  it('runs the README example end-to-end', () => {
    const result = parse('./test-workflow.yaml');
    const graph = new DexGraph(result);

    assert.ok(graph.getExecutionOrder().length > 0, 'README example works');
  });
});
