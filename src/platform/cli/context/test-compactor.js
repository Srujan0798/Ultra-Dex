// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Test Compactor module
 * @module context/test-compactor
 */

import { ContextCompactor } from './compactor.js';

async function runTests() {
  logger.log('Testing Context Compactor...');

  // Test 1: Basic token calculation
  logger.log('\n1. Testing token calculation...');
  const compactor = new ContextCompactor({ maxTokens: 1000, tokenThreshold: 0.95 });

  const testContext = {
    message: 'This is a test message that will be used to test the token calculation.',
    history: [
      { role: 'user', content: 'Hello, world!' },
      { role: 'assistant', content: 'Hi there!' },
      { role: 'user', content: 'How are you?' },
      { role: 'assistant', content: 'I am doing well, thank you for asking.' },
    ],
    SACRED_DNA: 'This is critical information that must be preserved',
    template_section: 'Another section that should be preserved',
  };

  const tokens = compactor.calculateTokens(testContext);
  logger.log(`Tokens in test context: ${tokens}`);

  // Test 2: Sacred DNA detection
  logger.log('\n2. Testing Sacred DNA detection...');
  const isSacred = compactor.isSacredSection('This contains SACRED_DNA information');
  logger.log(`Is sacred section: ${isSacred}`);

  const isNotSacred = compactor.isSacredSection('This is regular content');
  logger.log(`Is sacred section (should be false): ${isNotSacred}`);

  // Test 3: Context compaction
  logger.log('\n3. Testing context compaction...');

  // Create a large context to trigger compaction
  const largeContext = [
    { type: 'SACRED_DNA', content: 'This is critical information that must be preserved' },
    { type: 'TEMPLATE_SECTION', content: 'Another section that should be preserved' },
  ];

  // Add many messages to exceed token threshold
  for (let i = 0; i < 50; i++) {
    largeContext.push({
      role: 'user',
      content: `Message ${i}: This is a longer message to increase token count and test the compaction algorithm. It contains various information that might or might not be important for the overall context.`,
    });
  }

  logger.log(`Large context tokens before compaction: ${compactor.calculateTokens(largeContext)}`);

  // Temporarily lower the threshold for testing
  const testCompactor = new ContextCompactor({ maxTokens: 500, tokenThreshold: 0.5 });

  const result = await testCompactor.compact(largeContext);
  logger.log(`Was compressed: ${result.compressed}`);
  logger.log(`Tokens before: ${result.tokensBefore}`);
  logger.log(`Tokens after: ${result.tokensAfter}`);
  logger.log(`Compression ratio: ${result.compressionRatio.toFixed(2)}`);
  logger.log(`Preserved sections: ${result.preservedSections.length}`);

  // Test 4: Statistics
  logger.log('\n4. Testing statistics...');
  const stats = testCompactor.getStats();
  logger.log('Statistics:', stats);

  logger.log('\nAll tests completed successfully!');
}

// Run the tests
runTests().catch(console.error);
