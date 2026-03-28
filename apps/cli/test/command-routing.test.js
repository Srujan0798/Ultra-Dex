import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  analyzeCliInput,
  getProgramCommandNames,
  splitCommandString,
} from '../lib/utils/command-routing.js';

describe('command routing helpers', () => {
  test('collects command names and aliases from commander', () => {
    const program = {
      commands: [
        {
          name: () => 'dashboard',
          aliases: () => ['d'],
        },
        {
          name: () => 'status',
          aliases: () => ['s'],
        },
      ],
    };

    const names = getProgramCommandNames(program);

    assert.ok(names.includes('dashboard'));
    assert.ok(names.includes('d'));
    assert.ok(names.includes('status'));
    assert.ok(names.includes('s'));
  });

  test('splits translated commands with quoted arguments', () => {
    const parts = splitCommandString('ultra-dex run planner "repair failing build"');

    assert.deepEqual(parts, ['ultra-dex', 'run', 'planner', 'repair failing build']);
  });

  test('rewrites high-confidence natural language requests', () => {
    const result = analyzeCliInput(
      ['My', 'build', 'is', 'failing,', 'help', 'me', 'fix', 'it'],
      ['fix', 'dashboard', 'status']
    );

    assert.equal(result.type, 'rewrite');
    assert.equal(result.intent, 'fix');
    assert.equal(result.translatedCommand, 'ultra-dex fix --build');
  });

  test('prefers typo suggestions for low-confidence single-word input', () => {
    const result = analyzeCliInput(['staus'], ['status', 'dashboard', 'monitor']);

    assert.equal(result.type, 'unknown');
    assert.equal(result.typoSuggestion, 'status');
  });

  test('passes through known commands unchanged', () => {
    const result = analyzeCliInput(['dashboard', '--json'], ['dashboard', 'status']);

    assert.equal(result.type, 'passthrough');
  });

  test('rewrites exact NLP aliases even when a typo suggestion also exists', () => {
    const result = analyzeCliInput(['bots'], ['bot', 'agents', 'dashboard']);

    assert.equal(result.type, 'rewrite');
    assert.equal(result.intent, 'agents');
    assert.equal(result.translatedCommand, 'ultra-dex agents');
  });
});
