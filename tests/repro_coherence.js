
import { ultraMemory } from '../apps/cli/lib/mcp/memory.js';
import { multiTierMemory } from '../apps/cli/lib/memory/multi-tier.js';

async function run() {
  console.log('Running Memory Coherence Reproduction Test...');

  // 1. Initialize both systems
  await ultraMemory.init();
  await multiTierMemory.initialize();
  await multiTierMemory.load();

  const coherenceKey = `coherence-test-${Date.now()}`;
  const hotValue = { description: 'Data in Hot Tier' };
  const ultraValue = 'Data in UltraMemory';

  // 2. Write to Multi-Tier (Hot)
  console.log(`Writing to Multi-Tier (Hot): ${coherenceKey}`);
  await multiTierMemory.setHot(coherenceKey, hotValue);

  // 3. Try to read from UltraMemory
  const ultraResult = await ultraMemory.search(coherenceKey);
  if (ultraResult.length === 0) {
    console.log('SUCCESS: UltraMemory cannot see data in Multi-Tier (Hot).');
  } else {
    console.log('FAILURE: UltraMemory unexpectedly found data from Multi-Tier.');
  }

  // 4. Write to UltraMemory
  console.log(`Writing to UltraMemory: ${ultraValue}`);
  await ultraMemory.remember(ultraValue, ['test'], 'repro');

  // 5. Try to read from Multi-Tier
  const multiResult = await multiTierMemory.getHot(ultraValue); // Check if value is key? No, key is not ultraValue.
  // UltraMemory uses content as key effectively for search. But let's check if we can find it by content query in multi-tier.
  const multiQueryResult = await multiTierMemory.query(ultraValue);

  if (multiQueryResult.hot.length === 0 && multiQueryResult.warm.length === 0 && multiQueryResult.cold.length === 0) {
    console.log('SUCCESS: Multi-Tier cannot see data in UltraMemory.');
  } else {
    console.log('FAILURE: Multi-Tier unexpectedly found data from UltraMemory.');
  }

  console.log('Coherence Test Complete.');
}

run().catch(console.error);
