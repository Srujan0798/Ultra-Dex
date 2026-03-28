// Copyright (c) 2026 Ultra-Dex

import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';

import {
  conversationHistory,
  extractParams,
  getAllIntents,
  getContextualSuggestions,
  getIntentConfidence,
  needsClarification,
  routeIntent,
  routeIntentWithContext,
} from '../lib/nlp/router.js';

describe('nlp router', () => {
  beforeEach(() => {
    conversationHistory.clear();
  });

  test('routes core and natural-language intents', () => {
    assert.equal(routeIntent('init'), 'init');
    assert.equal(routeIntent('My build is failing, help me fix it'), 'fix');
    assert.equal(routeIntent('list all available agents'), 'agents');
    assert.equal(routeIntent('deploy to production'), 'deploy');
  });

  test('extracts common parameters from natural-language input', () => {
    const initParams = extractParams('init', 'project called my-app');
    const modelParams = extractParams('config', 'using model claude-3-5-sonnet');
    const portParams = extractParams('serve', 'start server on port 3000');

    assert.equal(initParams.projectName, 'my-app');
    assert.equal(modelParams.provider, 'claude-3-5-sonnet');
    assert.equal(portParams.port, '3000');
  });

  test('returns confidence metadata for exact and unknown input', () => {
    const exact = getIntentConfidence('build');
    const unknown = getIntentConfidence('staus');

    assert.equal(exact.intent, 'build');
    assert.ok(exact.confidence >= 0.95);
    assert.equal(unknown.intent, null);
    assert.equal(unknown.confidence, 0);
  });

  test('flags unmapped inputs for clarification without suggesting null commands', () => {
    const clarification = needsClarification('staus');
    const clearMatch = needsClarification('status check');

    assert.equal(clarification.intent, null);
    assert.equal(clarification.needsClarification, true);
    assert.match(clarification.clarificationQuestion, /rephrase|command name/i);
    assert.equal(clearMatch.needsClarification, false);
  });

  test('returns ranked alternative intents', () => {
    const intents = getAllIntents('deploy this app to production');

    assert.ok(intents.length > 0);
    assert.equal(intents[0].intent, 'deploy');
  });

  test('tracks conversational context for follow-up suggestions', () => {
    assert.equal(routeIntentWithContext('build the application'), 'build');

    const suggestions = getContextualSuggestions();

    assert.ok(suggestions.some((item) => item.intent === 'test'));
    assert.ok(suggestions.some((item) => item.intent === 'deploy'));
  });
});
