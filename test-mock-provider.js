#!/usr/bin/env node

/**
 * Test script to verify mock provider functionality
 */

import { createProvider, getAvailableProviders } from './apps/cli/lib/providers/index.js';

async function testMockProvider() {
  console.log('Testing mock provider functionality...\n');
  
  // Check available providers
  const providers = getAvailableProviders();
  console.log('Available providers:', providers.map(p => p.id));
  
  // Test creating a mock provider
  try {
    // Set environment variable to enable mock
    process.env.MOCK_AI_PROVIDERS = 'true';
    
    console.log('\nCreating mock provider...');
    const provider = await createProvider('mock', { 
      mockResponse: 'Test response from mock provider' 
    });
    
    console.log('Mock provider created successfully!');
    console.log('Provider name:', provider.getName());
    
    // Test the provider's generate function
    console.log('\nTesting provider generate function...');
    const result = await provider.generate(
      'Test system prompt', 
      'Test user prompt'
    );
    
    console.log('Generate result:', result);
    console.log('Content:', result.content);
    
  } catch (error) {
    console.error('Error testing mock provider:', error.message);
    console.error('Stack:', error.stack);
  }
  
  // Reset environment
  delete process.env.MOCK_AI_PROVIDERS;
}

// Run the test
testMockProvider().then(() => {
  console.log('\nTest completed successfully!');
}).catch((error) => {
  console.error('\nTest failed:', error);
});