/**
 * Test Multiple NVIDIA API Keys
 * Demonstrates key rotation and load balancing
 * 
 * Setup: Add keys to .env.local
 * - NVIDIA_API_KEY
 * - NVIDIA_API_KEY_1
 * - NVIDIA_API_KEY_2
 * etc.
 */

import { initNVIDIAKeys, createRotatingClient } from './src/services/ai-providers/nemotron.js';
import { keyManager } from './src/services/ai-providers/nvidia-key-manager.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
const envPath = join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function testMultipleKeys() {
  console.log('🚀 NVIDIA Multi-Key Test\n');
  console.log('='.repeat(50) + '\n');
  
  // Initialize keys from env
  initNVIDIAKeys();
  
  const keyCount = keyManager.getKeyCount();
  console.log(`📊 Total keys loaded: ${keyCount}\n`);
  
  if (keyCount === 0) {
    console.log('⚠️  No API keys found!');
    console.log('\nAdd keys to .env.local:');
    console.log('  NVIDIA_API_KEY=nvapi-your-key...');
    console.log('  NVIDIA_API_KEY_1=nvapi-secondary-key...');
    console.log('  NVIDIA_API_KEY_2=nvapi-tertiary-key...');
    process.exit(1);
  }
  
  // List all keys
  console.log('📋 Loaded Keys:');
  console.log('-'.repeat(50));
  const keys = keyManager.listKeys();
  keys.forEach(k => {
    console.log(`  ${k.index + 1}. ${k.name.padEnd(15)} → ${k.masked}`);
  });
  console.log();
  
  // Test each key with rotation
  console.log('🧪 Testing key rotation...\n');
  
  const testPrompts = [
    'Say hello from key 1',
    'Say hello from key 2',
    'Say hello from key 3',
  ];
  
  for (let i = 0; i < Math.min(testPrompts.length, keyCount * 2); i++) {
    try {
      const { client, keyName, keyIndex } = createRotatingClient('nvidia/nemotron-3-super-120b-a12b');
      
      console.log(`Request ${i + 1}: Using ${keyName} (index: ${keyIndex})`);
      
      const response = await client.chat.completions.create({
        model: 'nvidia/nemotron-3-super-120b-a12b',
        messages: [{ role: 'user', content: testPrompts[i % testPrompts.length] }],
        max_tokens: 50,
        temperature: 0.5,
        top_p: 0.95,
        extra_body: {
          chat_template_kwargs: { enable_thinking: false }
        }
      });
      
      console.log(`  Response: ${response.choices[0].message.content.trim()}\n`);
      
      // Record success
      const currentKey = keyManager.getCurrentKey();
      keyManager.recordSuccess(currentKey.key);
      
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}\n`);
      
      // Record failure
      const currentKey = keyManager.getCurrentKey();
      keyManager.recordFailure(currentKey.key);
    }
  }
  
  // Show usage stats
  console.log('📊 Usage Statistics:');
  console.log('-'.repeat(50));
  const stats = keyManager.getUsageStats();
  stats.forEach(stat => {
    const usagePercent = ((stat.usage / stat.rateLimit) * 100).toFixed(0);
    const bar = '█'.repeat(Math.floor(usagePercent / 5)) + '░'.repeat(20 - Math.floor(usagePercent / 5));
    console.log(`  ${stat.name.padEnd(15)} [${bar}] ${stat.usage} reqs, ${stat.failures} fails`);
  });
  console.log();
  
  // Summary
  console.log('✅ Multi-key test complete!');
  console.log('\nBenefits of multiple keys:');
  console.log('  ✓ Avoid rate limits');
  console.log('  ✓ Automatic failover');
  console.log('  ✓ Load balancing');
  console.log('  ✓ Higher throughput\n');
}

testMultipleKeys().catch(console.error);
