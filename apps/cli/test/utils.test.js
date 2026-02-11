/**
 * Unit tests for utility modules
 * Tests: agents, theme-state, version, providers/index
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { agents, avengersAgents } from '../lib/utils/agents.js';
import { setDoomsdayMode, isDoomsdayMode } from '../lib/utils/theme-state.js';
import { VERSION, PACKAGE_NAME } from '../lib/utils/version.js';
import { getAvailableProviders, createProvider, getProvider } from '../lib/providers/index.js';

// ===============================
// AGENTS TESTS
// ===============================
describe('agents utility', () => {
  test('exports agents object with all 15 agents', () => {
    const agentNames = Object.keys(agents);
    assert.equal(agentNames.length, 15, 'Should have 15 agents');
  });

  test('each agent has required properties', () => {
    for (const [key, agent] of Object.entries(agents)) {
      assert.ok(agent.name, `Agent ${key} should have a name`);
      assert.ok(agent.emoji, `Agent ${key} should have an emoji`);
      assert.ok(agent.tagline, `Agent ${key} should have a tagline`);
    }
  });

  test('contains all tier agents', () => {
    const leadershipAgents = ['cto', 'planner', 'research'];
    const devAgents = ['backend', 'frontend', 'database'];
    const securityAgents = ['auth', 'security'];
    const devopsAgents = ['devops'];
    const qualityAgents = ['testing', 'documentation', 'reviewer', 'debugger'];
    const specialistAgents = ['performance', 'refactoring'];

    for (const agent of leadershipAgents) {
      assert.ok(agents[agent], `Should have ${agent} agent`);
    }
    for (const agent of devAgents) {
      assert.ok(agents[agent], `Should have ${agent} agent`);
    }
    for (const agent of securityAgents) {
      assert.ok(agents[agent], `Should have ${agent} agent`);
    }
    for (const agent of devopsAgents) {
      assert.ok(agents[agent], `Should have ${agent} agent`);
    }
    for (const agent of qualityAgents) {
      assert.ok(agents[agent], `Should have ${agent} agent`);
    }
    for (const agent of specialistAgents) {
      assert.ok(agents[agent], `Should have ${agent} agent`);
    }

    // Verify tier counts
    assert.strictEqual(leadershipAgents.length, 3, 'Should have 3 leadership agents');
    assert.strictEqual(devAgents.length, 3, 'Should have 3 development agents');
    assert.strictEqual(securityAgents.length, 2, 'Should have 2 security agents');
    assert.strictEqual(devopsAgents.length, 1, 'Should have 1 devops agent');
    assert.strictEqual(qualityAgents.length, 4, 'Should have 4 quality agents');
    assert.strictEqual(specialistAgents.length, 2, 'Should have 2 specialist agents');
  });

  test('avengersAgents is alias for agents', () => {
    assert.strictEqual(avengersAgents, agents, 'avengersAgents should be same reference as agents');
  });

  test('agent properties are non-empty strings', () => {
    for (const [key, agent] of Object.entries(agents)) {
      assert.strictEqual(typeof agent.name, 'string', `Agent ${key} name should be string`);
      assert.strictEqual(typeof agent.emoji, 'string', `Agent ${key} emoji should be string`);
      assert.strictEqual(typeof agent.tagline, 'string', `Agent ${key} tagline should be string`);
      assert.ok(agent.name.length > 0, `Agent ${key} name should not be empty`);
      assert.ok(agent.emoji.length > 0, `Agent ${key} emoji should not be empty`);
      assert.ok(agent.tagline.length > 0, `Agent ${key} tagline should not be empty`);
    }
  });
});

// ===============================
// THEME-STATE TESTS
// ===============================
describe('theme-state utility', () => {
  test('isDoomsdayMode returns false by default', () => {
    // Reset state first
    setDoomsdayMode(false);
    assert.strictEqual(isDoomsdayMode(), false, 'Should be false by default');
  });

  test('setDoomsdayMode(true) enables doomsday mode', () => {
    setDoomsdayMode(true);
    assert.strictEqual(isDoomsdayMode(), true, 'Should be true after enabling');
  });

  test('setDoomsdayMode(false) disables doomsday mode', () => {
    setDoomsdayMode(true);
    assert.strictEqual(isDoomsdayMode(), true);

    setDoomsdayMode(false);
    assert.strictEqual(isDoomsdayMode(), false, 'Should be false after disabling');
  });

  test('multiple toggles work correctly', () => {
    setDoomsdayMode(false);
    assert.strictEqual(isDoomsdayMode(), false);

    setDoomsdayMode(true);
    assert.strictEqual(isDoomsdayMode(), true);

    setDoomsdayMode(true);
    assert.strictEqual(isDoomsdayMode(), true);

    setDoomsdayMode(false);
    assert.strictEqual(isDoomsdayMode(), false);
  });
});

// ===============================
// VERSION TESTS
// ===============================
describe('version utility', () => {
  test('VERSION is exported and is valid semver', () => {
    assert.ok(VERSION, 'VERSION should be exported');
    assert.strictEqual(typeof VERSION, 'string', 'VERSION should be string');

    // Basic semver regex: major.minor.patch
    const semverRegex = /^\d+\.\d+\.\d+$/;
    assert.ok(semverRegex.test(VERSION), `VERSION "${VERSION}" should be valid semver`);
  });

  test('PACKAGE_NAME is exported and is string', () => {
    assert.ok(PACKAGE_NAME, 'PACKAGE_NAME should be exported');
    assert.strictEqual(typeof PACKAGE_NAME, 'string', 'PACKAGE_NAME should be string');
    assert.ok(PACKAGE_NAME.length > 0, 'PACKAGE_NAME should not be empty');
  });

  test('PACKAGE_NAME equals ultra-dex', () => {
    assert.strictEqual(PACKAGE_NAME, 'ultra-dex', 'Package name should be ultra-dex');
  });
});

// ===============================
// PROVIDERS INDEX TESTS
// ===============================
describe('providers/index', () => {
  test('getAvailableProviders returns array of providers', () => {
    const providers = getAvailableProviders();
    assert.ok(Array.isArray(providers), 'Should return array');
    assert.ok(providers.length > 0, 'Should have at least one provider');
  });

  test('each provider has required properties', () => {
    const providers = getAvailableProviders();
    for (const provider of providers) {
      assert.ok(provider.id, 'Provider should have id');
      assert.ok(provider.name, 'Provider should have name');
      assert.strictEqual(typeof provider.id, 'string', 'Provider id should be string');
      assert.strictEqual(typeof provider.name, 'string', 'Provider name should be string');
    }
  });

  test('includes expected providers', () => {
    const providers = getAvailableProviders();
    const providerIds = providers.map((p) => p.id);

    assert.ok(providerIds.includes('claude'), 'Should include claude');
    assert.ok(providerIds.includes('openai'), 'Should include openai');
    assert.ok(providerIds.includes('gemini'), 'Should include gemini');
    assert.ok(providerIds.includes('ollama'), 'Should include ollama');
    assert.ok(providerIds.includes('router'), 'Should include router');
  });

  test('getProvider returns null without API keys', () => {
    // Save original env vars
    const originalAnthropic = process.env.ANTHROPIC_API_KEY;
    const originalOpenAI = process.env.OPENAI_API_KEY;
    const originalGemini = process.env.GOOGLE_AI_KEY;

    // Clear API keys
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_AI_KEY;

    try {
      const provider = getProvider();
      // Should return null when no API keys are set
      assert.strictEqual(provider, null, 'Should return null without API keys');
    } finally {
      // Restore original env vars
      if (originalAnthropic) process.env.ANTHROPIC_API_KEY = originalAnthropic;
      if (originalOpenAI) process.env.OPENAI_API_KEY = originalOpenAI;
      if (originalGemini) process.env.GOOGLE_AI_KEY = originalGemini;
    }
  });

  test('createProvider throws for invalid provider', () => {
    assert.throws(
      () => {
        createProvider('invalid-provider');
      },
      /Unknown provider|invalid-provider/i,
      'Should throw for unknown provider'
    );
  });

  test('provider objects have envKey or are router', () => {
    const providers = getAvailableProviders();
    for (const provider of providers) {
      if (provider.id !== 'router') {
        assert.ok(provider.envKey, `Provider ${provider.id} should have envKey (except router)`);
      }
    }
  });
});
