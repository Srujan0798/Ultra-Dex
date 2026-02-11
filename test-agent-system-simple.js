#!/usr/bin/env node

/**
 * Test script to verify agent system with mock provider
 */

async function testAgentSystem() {
  console.log('Testing agent system with mock provider...\n');
  
  // Set environment variable to enable mock
  process.env.MOCK_AI_PROVIDERS = 'true';
  
  try {
    // Import the necessary modules
    const { runAgentLoop } = await import('./apps/cli/lib/commands/run.js');
    const { createProvider } = await import('./apps/cli/lib/providers/index.js');
    
    console.log('Modules imported successfully');
    
    // Create a mock provider
    const provider = await createProvider('mock', { 
      mockResponse: 'Mock response: Task completed successfully by the agent.' 
    });
    
    console.log('Mock provider created:', provider.getName());
    
    // Create a simple project context
    const context = {
      plan: null,
      context: 'This is a test project context',
      state: null,
      graph: null
    };
    
    console.log('\nTesting @planner agent with mock provider...');
    
    // Test the planner agent
    const result = await runAgentLoop(
      'planner', 
      'Break down this simple task: "Create a basic API endpoint"', 
      provider, 
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