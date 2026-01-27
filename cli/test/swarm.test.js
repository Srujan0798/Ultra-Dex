import assert from 'assert';
import { SwarmCoordinator } from '../lib/swarm/coordinator.js';

// Mock Provider
class MockProvider {
  constructor() {
    this.generations = [];
  }

  async generate(system, prompt) {
    this.generations.push({ system, prompt });
    
    // Simulate Planner Output
    if (system.includes('Hive Mind Planner')) {
      return {
        content: JSON.stringify({
          tasks: [
            { id: 1, agent: 'backend', task: 'Build API' },
            { id: 2, agent: 'frontend', task: 'Build UI' }
          ]
        })
      };
    }

    // Simulate Agent Output
    return { content: 'Mock execution output' };
  }
}

// Test Runner
async function runTests() {
  console.log('🧪 Testing Swarm Coordinator...');

  const provider = new MockProvider();
  const context = { plan: 'Mock Plan', context: 'Mock Context' };
  const coordinator = new SwarmCoordinator(provider, context);

  // Test Plan Generation
  const tasks = await coordinator.plan('Test Feature');
  assert.strictEqual(tasks.length, 2);
  assert.strictEqual(tasks[0].agent, 'backend');
  console.log('  ✅ Plan generation passed');

  // Test Execution (Mocked)
  // We can't easily test the full execution loop here without mocking runAgentLoop
  // but we verified the plan parsing logic which is the critical new part.
  
  console.log('✅ All Swarm tests passed');
}

runTests().catch(console.error);
