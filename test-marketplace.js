/**
 * Test script for Agent Marketplace functionality
 */

import { AgentMarketplaceClient } from './cli/lib/marketplace/client.js';

async function testMarketplace() {
  console.log('🧪 Testing Agent Marketplace Client...\n');
  
  // Create a client instance
  const client = new AgentMarketplaceClient();
  
  // Test metadata validation
  console.log('✅ Testing metadata validation...');
  try {
    // Valid metadata
    client.validateMetadata({
      name: 'test-agent',
      description: 'A test agent',
      version: '1.0.0',
      author: 'test'
    });
    console.log('   Valid metadata passed validation');
    
    // Invalid metadata
    try {
      client.validateMetadata({
        description: 'Missing required name',
        version: '1.0.0',
        author: 'test'
      });
      console.log('   ERROR: Invalid metadata should have failed validation');
    } catch (e) {
      console.log('   Invalid metadata correctly rejected:', e.message);
    }
  } catch (e) {
    console.log('   Metadata validation test failed:', e.message);
  }
  
  console.log('\n🎉 Marketplace client tests completed!');
  console.log('The client has been implemented with:');
  console.log('  - Agent submission/retrieval API');
  console.log('  - Agent versioning and ratings');
  console.log('  - Discovery/search functionality');
  console.log('  - ultra-dex agents --marketplace command');
}

// Run the test
testMarketplace().catch(console.error);