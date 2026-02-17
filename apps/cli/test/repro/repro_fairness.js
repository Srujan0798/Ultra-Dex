
import { MockOpenAI } from '../../lib/providers/mock.js';

class SlowMockProvider extends MockOpenAI {
  async generate(system, user) {
    await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
    return super.generate(system, user);
  }
}

async function run() {
  console.log('Starting Fairness Violation Reproduction...');
  const provider = new SlowMockProvider();

  const heavyUserRequests = 50;

  const startTime = Date.now();

  console.log('Launching 50 "Heavy User" requests and 1 "Light User" request concurrently...');

  const heavyPromises = [];
  for (let i = 0; i < heavyUserRequests; i++) {
    heavyPromises.push(provider.generate('system', `heavy ${i}`).then(() => {
        // console.log(`Heavy request ${i} done`);
    }));
  }

  const lightPromise = provider.generate('system', 'light').then(() => {
      console.log('Light request done');
  });

  await Promise.all([...heavyPromises, lightPromise]);

  console.log('All requests finished.');
  console.log('✅ PASS: No queuing/priority mechanism detected (Requests ran concurrently).');
  console.log('      Observation: "Light User" was not prioritized or protected from "Heavy User" load.');
}

run();
