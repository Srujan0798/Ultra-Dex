#!/usr/bin/env node

/**
 * Ultra-Dex Connector Integration Test
 * Tests GitHub connector integration with skills
 */

import { UltraDexCore } from '../src/core/orchestration/ultra-dex-core.ts';
import { GitHubConnector } from '../src/core/connectors/github.ts';

async function testConnectors() {
  console.log('🔌 Ultra-Dex Connector Integration Test');
  console.log('======================================\n');

  // Initialize Ultra-Dex core with Mock AI
  console.log('🔧 Initializing Ultra-Dex Core...');
  const core = new UltraDexCore();
  process.env.MOCK_AI_PROVIDERS = 'true';
  await core.initialize({ env: 'test' });
  console.log('✅ Ultra-Dex Core ready\n');

  // Test 1: Check if connectors are available
  console.log('📋 Test 1: Connector Availability');
  console.log('-------------------------------');

  // Check if connector registry exists
  const hasConnectorRegistry = !!core.connectors;
  console.log('Connector registry available:', hasConnectorRegistry);

  if (hasConnectorRegistry) {
    console.log('Available connectors:', Object.keys(core.connectors));
  }
  console.log('');

  // Test 2: Test GitHub connector mock
  console.log('🐙 Test 2: GitHub Connector Mock');
  console.log('------------------------------');

  try {
    // Create mock GitHub connector
    const githubConnector = new GitHubConnector({
      token: 'mock-token-for-testing',
    });

    console.log('GitHub connector created:', githubConnector.id);
    console.log('Status:', githubConnector.status);
    console.log('Operations:', githubConnector.operations.length);
    console.log('');

    // Test connection (should work with mock)
    await githubConnector.connect();
    console.log('✅ GitHub connector connected successfully');
    console.log('');
  } catch (error) {
    console.log('❌ GitHub connector test failed:', error.message);
    console.log('');
  }

  // Test 3: Test skills with connector integration
  console.log('🔗 Test 3: Skills with Connector Integration');
  console.log('------------------------------------------');

  try {
    // Test code review with PR URL (should trigger connector)
    const reviewResult = await core.skills.execute(
      '/code-review',
      {
        code: 'function test() { return "hello"; }',
        language: 'javascript',
        prUrl: 'https://github.com/test/repo/pull/1',
        focus: ['security', 'performance', 'correctness'],
      },
      {
        connectors: { github: { token: 'mock-token' } },
      }
    );

    console.log('✅ Code review with connector integration completed');

    // Handle mock responses
    if (typeof reviewResult.output === 'string') {
      console.log('Mock response received');
      console.log('Output preview:', reviewResult.output.substring(0, 150) + '...');
    } else {
      console.log('Summary:', reviewResult.output?.summary || 'No summary available');
      console.log('Findings count:', reviewResult.output?.findings?.length || 0);
    }
    console.log('');
  } catch (error) {
    console.log('❌ Skills with connector integration failed:', error.message);
    console.log('');
  }

  // Test 4: Test connector-enhanced executor
  console.log('⚡ Test 4: Connector-Enhanced Executor');
  console.log('-------------------------------------');

  try {
    // Check if connector executor is being used
    const executorType = core.skills.executor?.constructor?.name;
    console.log('Executor type:', executorType);

    // Test if connector methods are available
    const hasConnectorMethods = !!core.skills.executor?.enrichWithConnectorData;
    console.log('Has connector methods:', hasConnectorMethods);
    console.log('');
  } catch (error) {
    console.log('❌ Connector executor test failed:', error.message);
    console.log('');
  }

  // List connector-aware skills
  console.log('📊 Test 5: Connector-Aware Skills');
  console.log('--------------------------------');

  const skills = core.skills.list();
  const connectorSkills = skills.filter((skill) => skill.connectors && skill.connectors.length > 0);

  console.log(`Found ${connectorSkills.length} connector-aware skills:`);
  connectorSkills.slice(0, 10).forEach((skill) => {
    console.log(`  ${skill.id.padEnd(25)} - ${skill.name}`);
    console.log(`    Connectors: ${skill.connectors?.join(', ') || 'none'}`);
  });

  if (connectorSkills.length > 10) {
    console.log(`  ... and ${connectorSkills.length - 10} more`);
  }
  console.log('');

  // Cleanup
  await core.stop();
  console.log('🏁 Connector integration test completed!');
}

// Run test
testConnectors().catch((error) => {
  console.error('❌ Connector test failed:', error);
  process.exit(1);
});
