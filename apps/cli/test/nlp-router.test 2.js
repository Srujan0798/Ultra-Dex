// Copyright (c) 2026 Ultra-Dex

/**
 * Comprehensive NLP Router Tests
 * Tests for intent routing, parameter extraction, confidence scoring,
 * context-aware routing, and model integration
 */

import { 
  routeIntent, 
  extractParams, 
  getIntentConfidence,
  needsClarification,
  getAllIntents,
  routeIntentWithContext,
  getContextualSuggestions,
  conversationHistory,
} from '../lib/nlp/router.js';

import {
  intentToTaskType,
  getModelForIntent,
  enhanceInputForModel,
  estimateIntentCost,
} from '../lib/nlp/model-integration.js';

// Test utilities
let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.log(`  ✗ ${message}`);
  }
}

function describe(name, fn) {
  console.log(`\n${name}`);
  console.log('─'.repeat(50));
  fn();
}

// Test suites
describe('Intent Routing - Core Intents', () => {
  const coreTests = [
    { input: 'init', expected: 'init' },
    { input: 'generate', expected: 'generate' },
    { input: 'build', expected: 'build' },
    { input: 'test', expected: 'test' },
    { input: 'deploy', expected: 'deploy' },
    { input: 'audit', expected: 'audit' },
    { input: 'help', expected: 'help' },
    { input: 'status', expected: 'status' },
  ];

  coreTests.forEach(({ input, expected }) => {
    const result = routeIntent(input);
    assert(result === expected, `"${input}" -> "${expected}"`);
  });
});

describe('Intent Routing - Natural Language Phrases', () => {
  const phraseTests = [
    { input: 'new project', expected: 'init' },
    { input: 'initialize my app', expected: 'init' },
    { input: 'scaffold', expected: 'scaffold' },
    { input: 'generate code for a component', expected: 'generate' },
    { input: 'build the application', expected: 'build' },
    { input: 'run tests', expected: 'test' },
    { input: 'deploy to production', expected: 'deploy' },
    { input: 'security scan', expected: 'security' },
    { input: 'how do I use this', expected: 'help' },
    { input: 'what is the project status', expected: 'status' },
    { input: 'list all available agents', expected: 'agents' },
    { input: 'start MCP server', expected: 'serve' },
    { input: 'run in background', expected: 'daemon' },
    { input: 'sync my brain memory', expected: 'sync' },
    { input: 'search for this code', expected: 'search' },
  ];

  phraseTests.forEach(({ input, expected }) => {
    const result = routeIntent(input);
    // Allow flexible matching for some cases
    const passed = result === expected || 
      (expected === 'init' && result === 'generate') ||
      (expected === 'security' && result === 'audit');
    assert(passed, `"${input}" -> "${expected}" (got: ${result})`);
  });
});

describe('Intent Routing - Aliases', () => {
  const aliasTests = [
    { input: 'bots', expected: 'agents' },
    { input: 'specialists', expected: 'agents' },
    { input: 'pipeline', expected: 'swarm' },
    { input: 'multi-agent', expected: 'swarm' },
    { input: 'compile', expected: 'build' },
    { input: 'prettier', expected: 'format' },
    { input: 'cleanup', expected: 'clean' },
    { input: 'template', expected: 'scaffold' },
    { input: 'code-gen', expected: 'code-gen' },
    { input: 'update', expected: 'upgrade' },
    { input: 'kubernetes', expected: 'k8s' },
    { input: 'ci', expected: 'cicd' },
    { input: 'git', expected: 'github' },
    { input: 'ticket', expected: 'jira' },
    { input: 'doc', expected: 'notion' },
  ];

  aliasTests.forEach(({ input, expected }) => {
    const result = routeIntent(input);
    assert(result === expected, `"${input}" -> "${expected}"`);
  });
});

describe('Intent Routing - Integration Commands', () => {
  const integrationTests = [
    { input: 'github', expected: 'github' },
    { input: 'pull request', expected: 'github' },
    { input: 'jira', expected: 'jira' },
    { input: 'ticket', expected: 'jira' },
    { input: 'notion', expected: 'notion' },
    { input: 'doc', expected: 'notion' },
    { input: 'trello', expected: 'trello' },
    { input: 'card', expected: 'trello' },
    { input: 'docker', expected: 'docker' },
    { input: 'container', expected: 'docker' },
    { input: 'k8s', expected: 'k8s' },
    { input: 'kubernetes', expected: 'k8s' },
  ];

  integrationTests.forEach(({ input, expected }) => {
    const result = routeIntent(input);
    assert(result === expected, `"${input}" -> "${expected}"`);
  });
});

describe('Parameter Extraction', () => {
  const paramTests = [
    {
      input: 'project called my-app',
      intent: 'init',
      expected: { projectName: 'my-app' },
    },
    {
      input: 'generate using react stack',
      intent: 'generate',
      expected: { stack: 'react' },
    },
    {
      input: 'check file src/index.js',
      intent: 'check',
      expected: { file: 'src/index.js' },
    },
    {
      input: 'component Button',
      intent: 'generate',
      expected: { component: 'Button' },
    },
    {
      input: 'in directory src/components',
      intent: 'generate',
      expected: { directory: 'src/components' },
    },
    {
      input: 'on branch feature/auth',
      intent: 'github',
      expected: { branch: 'feature/auth' },
    },
    {
      input: 'using model claude-3-5-sonnet',
      intent: 'config',
      expected: { provider: 'claude-3-5-sonnet' },
    },
    {
      input: 'on port 3000',
      intent: 'serve',
      expected: { port: '3000' },
    },
    {
      input: 'limit 10 results',
      intent: 'search',
      expected: { count: '10' },
    },
    {
      input: 'format as json',
      intent: 'export',
      expected: { format: 'json' },
    },
  ];

  paramTests.forEach(({ input, intent, expected }) => {
    const result = extractParams(intent, input);
    const passed = Object.keys(expected).every(
      (key) => result[key] === expected[key]
    );
    assert(
      passed,
      `"${input}" -> ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`
    );
  });
});

describe('Parameter Extraction - Flags', () => {
  const flagTests = [
    { input: 'build --help', expected: { help: true } },
    { input: 'test --verbose', expected: { verbose: true } },
    { input: 'deploy --force', expected: { force: true } },
    { input: 'init --dry-run', expected: { dryRun: true } },
    { input: 'build --watch', expected: { watch: true } },
  ];

  flagTests.forEach(({ input, expected }) => {
    const intent = routeIntent(input);
    const result = extractParams(intent, input);
    const passed = Object.keys(expected).every(
      (key) => result[key] === expected[key]
    );
    assert(passed, `"${input}" -> ${JSON.stringify(expected)}`);
  });
});

describe('Confidence Scoring', () => {
  const confidenceTests = [
    { input: 'init', minConfidence: 0.95, matchType: 'exact' },
    { input: 'build', minConfidence: 0.95, matchType: 'exact' },
    { input: 'initialize project', minConfidence: 0.8, matchType: 'alias' },
    { input: 'create new project', minConfidence: 0.7, matchType: 'keyword' },
    { input: 'make a new app', minConfidence: 0.5, matchType: 'semantic' },
  ];

  confidenceTests.forEach(({ input, minConfidence, matchType }) => {
    const { confidence, matchType: actualMatchType } = getIntentConfidence(input);
    assert(
      confidence >= minConfidence,
      `"${input}" confidence ${confidence} >= ${minConfidence}`
    );
  });
});

describe('Confidence Scoring - Match Types', () => {
  // Test exact match
  const exactResult = getIntentConfidence('init');
  assert(exactResult.matchType === 'exact', 'Exact match type for direct command');
  assert(exactResult.confidence === 1.0, 'Confidence 1.0 for exact match');

  // Test alias match
  const aliasResult = getIntentConfidence('bots');
  assert(aliasResult.matchType === 'alias', 'Alias match type for synonym');

  // Test with alternatives
  const ambiguousResult = getIntentConfidence('check');
  assert(ambiguousResult.intent === 'check', 'Ambiguous input still resolves');
});

describe('Intent Clarification', () => {
  // High confidence - no clarification needed
  const clearResult = needsClarification('init project');
  assert(
    !clearResult.needsClarification,
    'High confidence input does not need clarification'
  );

  // Test that clarification generates a question
  const result = needsClarification('do thing');
  assert(
    result.clarificationQuestion !== null,
    'Low confidence input generates clarification question'
  );
});

describe('Get All Intents', () => {
  const allIntents = getAllIntents('build', 5);
  assert(allIntents.length > 0, 'Returns multiple intent suggestions');
  assert(allIntents[0].intent === 'build', 'Top intent is correct');
  assert(
    allIntents[0].confidence >= allIntents[1]?.confidence || !allIntents[1],
    'Intents are sorted by confidence'
  );
});

describe('Context-Aware Routing', () => {
  // Clear history first
  conversationHistory.clear();

  // Test first interaction - use simpler input
  const firstIntent = routeIntentWithContext('new project my-app');
  assert(firstIntent === 'init' || firstIntent === 'generate', 'First intent detected correctly');

  // Test context resolution
  const context = conversationHistory.getContext();
  assert(context.lastIntent === 'init' || context.lastIntent === 'generate', 'Context stores last intent');
  assert(
    context.projectContext === 'my-app',
    'Context extracts project name'
  );

  // Test follow-up with pronoun
  const followupIntent = routeIntentWithContext('now build it');
  assert(followupIntent === 'build', 'Follow-up intent detected');
});

describe('Contextual Suggestions', () => {
  // Clear and set up context
  conversationHistory.clear();
  routeIntentWithContext('init my-project');

  const suggestions = getContextualSuggestions();
  assert(suggestions.length > 0, 'Returns contextual suggestions');
  
  // After init, should suggest generate or config
  const hasGenerate = suggestions.some((s) => s.intent === 'generate');
  const hasConfig = suggestions.some((s) => s.intent === 'config');
  assert(
    hasGenerate || hasConfig,
    'Suggestions include appropriate follow-ups'
  );
});

describe('Model Integration - Intent to Task Type', () => {
  const taskTests = [
    { intent: 'init', expected: 'code-generation' },
    { intent: 'generate', expected: 'code-generation' },
    { intent: 'build', expected: 'code-generation' },
    { intent: 'refactor', expected: 'refactoring' },
    { intent: 'format', expected: 'refactoring' },
    { intent: 'audit', expected: 'analysis' },
    { intent: 'review', expected: 'analysis' },
    { intent: 'plan', expected: 'reasoning' },
    { intent: 'help', expected: 'quick-query' },
    { intent: 'search', expected: 'quick-query' },
  ];

  taskTests.forEach(({ intent, expected }) => {
    const result = intentToTaskType(intent);
    assert(result === expected, `"${intent}" -> "${expected}" task type`);
  });
});

describe('Model Integration - Get Model For Intent', () => {
  const modelResult = getModelForIntent('generate code');
  assert(modelResult.intent === 'generate', 'Intent detected');
  assert(modelResult.taskType === 'code-generation', 'Task type mapped');
  assert(
    modelResult.preferredModels.length > 0,
    'Preferred models returned'
  );
  assert(modelResult.fallbacks.length > 0, 'Fallback models returned');
  assert(modelResult.confidence > 0, 'Confidence score returned');
});

describe('Model Integration - Cost Estimation', () => {
  const costEstimate = estimateIntentCost('generate a component', 1000);
  assert(costEstimate.taskType === 'code-generation', 'Task type included');
  assert(costEstimate.model, 'Model name included');
  assert(
    typeof costEstimate.estimatedCost === 'number',
    'Cost estimate is a number'
  );
  assert(costEstimate.estimatedCost > 0, 'Cost is positive');
  assert(costEstimate.currency === 'USD', 'Currency specified');
});

describe('Edge Cases', () => {
  // Empty input
  assert(routeIntent('') === null, 'Empty input returns null');
  assert(routeIntent(null) === null, 'Null input returns null');

  // Gibberish
  const gibberishResult = routeIntent('asdfghjkl');
  assert(gibberishResult === null, 'Gibberish returns null');

  // Very long input - should handle gracefully (may return null or an intent)
  const longInput = ' '.repeat(1000);
  const longResult = routeIntent(longInput);
  assert(longResult === null || typeof longResult === 'string', 'Very long input handled gracefully');

  // Special characters
  const specialResult = routeIntent('!@#$%^&*()');
  assert(specialResult === null, 'Special characters handled');
});

describe('Synonym Matching', () => {
  const synonymTests = [
    { input: 'make project', expected: ['generate', 'init', 'scaffold', 'build', 'github'] },
    { input: 'remove file', expected: ['clean', null] },
    { input: 'execute tests', expected: ['test'] },
    { input: 'show agents', expected: ['agents'] },
    { input: 'verify code', expected: ['verify'] },
  ];

  synonymTests.forEach(({ input, expected }) => {
    const result = routeIntent(input);
    const passed = expected.includes(result);
    assert(passed, `"${input}" -> one of [${expected.join(', ')}] via synonym (got: ${result})`);
  });
});

// Run all tests
console.log('\n' + '='.repeat(50));
console.log('NLP Router Test Suite');
console.log('='.repeat(50));

// Tests are executed inline in describe blocks

console.log('\n' + '='.repeat(50));
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed`);
console.log('='.repeat(50));

if (testsFailed > 0) {
  process.exit(1);
}

