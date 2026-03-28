// Copyright (c) 2026 Ultra-Dex

import { describe, test } from 'node:test';
import assert from 'node:assert/strict';

import { translateToCommand } from '../lib/nlp/router.js';

describe('nlp translation', () => {
  test('translates build-failure language into fix command', () => {
    assert.equal(
      translateToCommand('My build is failing, help me fix it'),
      'ultra-dex fix --build'
    );
  });

  test('translates project creation language into init command', () => {
    assert.equal(
      translateToCommand('Initialize a new project called my-app'),
      'ultra-dex init my-app'
    );
  });

  test('translates health checks into doctor command', () => {
    assert.equal(translateToCommand('Check system health'), 'ultra-dex doctor');
  });

  test('preserves extracted flags in translated commands', () => {
    assert.equal(
      translateToCommand('Run tests with verbose output'),
      'ultra-dex test --verbose'
    );
  });
});
