
import { MockOpenAI } from '../../lib/providers/mock.js';

async function run() {
  console.log('Starting Rate Limit Bypass Reproduction...');
  const provider = new MockOpenAI();
  const requestCount = 100;
  const startTime = Date.now();

  const promises = [];
  for (let i = 0; i < requestCount; i++) {
    promises.push(provider.generate('system prompt', `user prompt ${i}`));
  }

  try {
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    console.log(`Successfully completed ${results.length} requests in ${duration}ms.`);
    console.log(`Rate: ${(results.length / (duration / 1000)).toFixed(2)} req/sec`);
    console.log('✅ PASS: Rate limit bypassed (no errors encountered).');
  } catch (error) {
    console.error('❌ FAIL: Rate limit encountered or other error:', error);
  }
}

run();
