#!/usr/bin/env node

/**
 * Test script to verify agent system with mock provider
 */

import { runAgentLoop } from './apps/cli/lib/commands/run.js';
import { readProjectContext } from './apps/cli/lib/commands/run.js';

async function testAgentSystem() {
  console.log('Testing agent system with mock provider...\n');
  
  // Set environment variable to enable mock
  process.env.MOCK_AI_PROVIDERS = 'true';
  
  try {
    // Read project context (will be empty for this test)
    const context = await readProjectContext();
    console.log('Project context read:', !!context);
    
    // Create a mock provider factory function
    const mockProviderFactory = async (agentId) => {
      // Import the provider system
      const { createProvider } = await import('./apps/cli/lib/providers/index.js');
      return await createProvider('mock', { 
        mockResponse: `Mock response for agent @${agentId}: This is a test task completion.` 
      });
    };
    
    console.log('\nTesting @planner agent with mock provider...');
    
    // Test the planner agent
    const result = await runAgentLoop(
      'planner', 
      'Break down this simple task: "Create a basic API endpoint"', 
      mockProviderFactory, 
      context
    );
    
    console.log('\nAgent result:', result);
    console.log('\n✓ Agent system test completed successfully!');
    
  } catch (error) {
    console.error('\n✗ Error testing agent system:', error.message);
    console.error('Stack:', error.stack);
  }
  
  // Reset environment
  delete process.env.MOCK_AI_PROVIDERS;
}

// Run the test
testAgentSystem().then(() => {
  console.log('\nAgent system test completed!');
}).catch((error) => {
  console.error('\nAgent system test failed:', error);
});