import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ClaudeProvider, normalizeClaudeModel } from '../../lib/providers/claude.js';

test('normalizeClaudeModel maps aliases to Sonnet 5', () => {
  assert.equal(normalizeClaudeModel('fennec'), 'claude-sonnet-5-20260201');
  assert.equal(normalizeClaudeModel('sonnet5'), 'claude-sonnet-5-20260201');
  assert.equal(normalizeClaudeModel('claude-sonnet-5'), 'claude-sonnet-5-20260201');
});

test('ClaudeProvider uses env model when provided', () => {
  const original = process.env.ULTRA_DEX_CLAUDE_MODEL;
  process.env.ULTRA_DEX_CLAUDE_MODEL = 'fennec';
  const provider = new ClaudeProvider('test-key', {});
  assert.equal(provider.model, 'claude-sonnet-5-20260201');
  process.env.ULTRA_DEX_CLAUDE_MODEL = original;
});
