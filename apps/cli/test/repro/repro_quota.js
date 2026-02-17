
import { createBudgetManager } from '../../lib/commerce/budget.js';
import { MockOpenAI } from '../../lib/providers/mock.js';

async function run() {
  console.log('Starting Quota Accounting Reproduction...');

  const budgetManager = await createBudgetManager();
  const initialStatus = budgetManager.getBudgetStatus();
  console.log(`Initial Daily Spent: $${initialStatus.daily.spent}`);

  const provider = new MockOpenAI();
  const requestCount = 10;

  console.log(`Making ${requestCount} requests...`);
  const promises = [];
  for (let i = 0; i < requestCount; i++) {
    promises.push(provider.generate('system prompt', `user prompt ${i}`));
  }

  await Promise.all(promises);

  const finalStatus = budgetManager.getBudgetStatus();
  console.log(`Final Daily Spent: $${finalStatus.daily.spent}`);

  if (initialStatus.daily.spent === finalStatus.daily.spent) {
    console.log('✅ PASS: Quota/Budget did NOT increase (Accounting missing/disconnected).');
  } else {
    console.error('❌ FAIL: Quota/Budget increased unexpectedly (Tracking is working?).');
  }
}

run();
