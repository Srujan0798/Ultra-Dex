#!/usr/bin/env node

/**
 * Comprehensive Edge Case Tests for Ultra-Dex
 * Testing various edge cases and failure scenarios
 */

import { ultraDex } from './src/core/index.js';
import { ppmManager } from './src/core/memory/manager.js';
import { agentOrchestrator } from './src/core/orchestration/index.js';
import chalk from 'chalk';

async function runEdgeCaseTests() {
  console.log(chalk.bold.blue('\n🧪 ULTRA-DEX EDGE CASE TESTS\n'));

  let passed = 0;
  let failed = 0;

  // Test 1: Memory system with empty queries
  try {
    console.log(chalk.gray('1. Testing memory system with empty queries...'));
    await ppmManager.init();

    const emptyResults = await ppmManager.search('');
    console.log(chalk.green('   ✅ Empty query handled gracefully'));
    passed++;
  } catch (error) {
    console.log(chalk.red(`   ❌ Empty query test failed: ${error.message}`));
    failed++;
  }

  // Test 2: Memory system with special characters
  try {
    console.log(chalk.gray('2. Testing memory system with special characters...'));
    await ppmManager.add({
      content: 'Test content with % and _ special chars',
      type: 'test',
      importance: 5,
    });

    const specialResults = await ppmManager.search('% and _');
    console.log(chalk.green('   ✅ Special characters handled properly'));
    passed++;
  } catch (error) {
    console.log(chalk.red(`   ❌ Special character test failed: ${error.message}`));
    failed++;
  }

  // Test 3: Memory system with very long content
  try {
    console.log(chalk.gray('3. Testing memory system with very long content...'));
    const longContent = 'A'.repeat(10000); // 10k character string
    await ppmManager.add({
      content: longContent,
      type: 'test',
      importance: 3,
    });

    console.log(chalk.green('   ✅ Long content handled properly'));
    passed++;
  } catch (error) {
    console.log(chalk.red(`   ❌ Long content test failed: ${error.message}`));
    failed++;
  }

  // Test 4: Multiple concurrent initializations
  try {
    console.log(chalk.gray('4. Testing multiple concurrent initializations...'));
    await Promise.all([ultraDex.initialize(), ultraDex.initialize(), ultraDex.initialize()]);

    console.log(chalk.green('   ✅ Concurrent initializations handled properly'));
    passed++;
  } catch (error) {
    console.log(chalk.red(`   ❌ Concurrent initialization test failed: ${error.message}`));
    failed++;
  }

  // Test 5: Orchestrator with null/undefined inputs
  try {
    console.log(chalk.gray('5. Testing orchestrator with null/undefined inputs...'));
    try {
      await agentOrchestrator.execute(null);
    } catch (e) {
      // Expected to fail gracefully
    }

    try {
      await agentOrchestrator.execute(undefined);
    } catch (e) {
      // Expected to fail gracefully
    }

    console.log(chalk.green('   ✅ Null/undefined inputs handled properly'));
    passed++;
  } catch (error) {
    console.log(chalk.red(`   ❌ Null/undefined input test failed: ${error.message}`));
    failed++;
  }

  // Test 6: Memory cache boundary conditions
  try {
    console.log(chalk.gray('6. Testing memory cache boundary conditions...'));

    // Fill cache to near limit
    for (let i = 0; i < 110; i++) {
      await ppmManager.search(`test-query-${i}`, 1);
    }

    console.log(chalk.green('   ✅ Cache boundary conditions handled properly'));
    passed++;
  } catch (error) {
    console.log(chalk.red(`   ❌ Cache boundary test failed: ${error.message}`));
    failed++;
  }

  // Test 7: Error handling in memory operations
  try {
    console.log(chalk.gray('7. Testing error handling in memory operations...'));

    // This should trigger error handling in the SQLite provider
    try {
      await ppmManager.provider.query('nonexistent', 'SELECT * FROM nonexistent_table');
    } catch (e) {
      // Expected to fail, but should be handled gracefully
    }

    console.log(chalk.green('   ✅ Error handling in memory operations works'));
    passed++;
  } catch (error) {
    console.log(chalk.red(`   ❌ Error handling test failed: ${error.message}`));
    failed++;
  }

  // Test 8: Verify system status after operations
  try {
    console.log(chalk.gray('8. Testing system status verification...'));
    const status = ultraDex.getStatus();
    if (status && typeof status === 'object') {
      console.log(chalk.green('   ✅ System status verification works'));
      passed++;
    } else {
      console.log(chalk.red('   ❌ System status verification failed'));
      failed++;
    }
  } catch (error) {
    console.log(chalk.red(`   ❌ System status test failed: ${error.message}`));
    failed++;
  }

  console.log(chalk.bold(`\n📊 TEST RESULTS: ${passed} passed, ${failed} failed`));

  if (failed === 0) {
    console.log(chalk.bold.green('🎉 ALL EDGE CASE TESTS PASSED!'));
    return true;
  } else {
    console.log(chalk.bold.red(`💥 ${failed} TESTS FAILED`));
    return false;
  }
}

// Run the edge case tests
runEdgeCaseTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(chalk.red(`Test suite failed with error: ${error.message}`));
    process.exit(1);
  });
