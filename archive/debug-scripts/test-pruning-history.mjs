// Test TaskGraph pruning and AgentStateMachine history cap

import { TaskGraph } from './src/core/orchestration/index.js';
import { AgentStateMachine } from './src/core/orchestration/agent-state.js';

async function runTests() {
  console.log('Testing TaskGraph pruning...');
  const tg = new TaskGraph();

  // Add a completed task
  const taskId = tg.addTask({ name: 'test task' });
  tg.markComplete(taskId);

  // Verify task exists
  console.log('Task exists before prune:', !!tg.tasks.get(taskId));

  // Prune with 0 max age (should remove completed task)
  tg.prune(0);
  console.log('Task exists after prune (0ms):', !!tg.tasks.get(taskId));

  // Add another task
  const taskId2 = tg.addTask({ name: 'test task 2' });
  tg.markComplete(taskId2);

  // Prune with large max age (should not remove)
  tg.prune(10000);
  console.log('Task exists after prune (10000ms):', !!tg.tasks.get(taskId2));

  console.log('\nTesting AgentStateMachine history cap...');
  const asm = new AgentStateMachine();

  // Initialize state machine
  await asm.initialize();

  // Add 1500 transitions to test the cap
  for (let i = 0; i < 1500; i++) {
    await asm.transition(`agent_${i % 10}`, i % 2 === 0 ? 'working' : 'idle');
  }

  // Check history length for one agent
  const history = asm.getHistory('agent_0');
  console.log(`History length for agent_0: ${history.length}`);

  // Should be at most 1000, but note that we have 10 agents and 1500 transitions,
  // so each agent gets about 150 transitions. However, the ring buffer is global,
  // so we are testing that the global buffer does not exceed 1000.
  // We can check the total number of transitions stored in the ring buffer by accessing the internal state (for testing only).
  // Since we cannot access the internal state easily, we rely on the fact that the ring buffer size is fixed.

  // Instead, we can check that the history for any agent does not exceed 1000 (which it shouldn't in this test).
  // But to be thorough, let's check the internal state (even though it's not exposed, we can for this test).
  // We'll use a workaround: the ring buffer is stored in the instance, but we are not supposed to access it.
  // However, for the purpose of this test, we'll assume the implementation is correct.

  // Let's at least verify that the history array size is 1000.
  console.log('AgentStateMachine stateHistory length:', asm.stateHistory.length);
  console.log('AgentStateMachine historyCount:', asm.historyCount);
  console.log('AgentStateMachine historyIndex:', asm.historyIndex);

  // After 1500 transitions, historyCount should be 1000 (capped) and historyIndex should be 1500 % 1000 = 500.
  console.log('Expected historyCount: 1000, actual:', asm.historyCount);
  console.log('Expected historyIndex: 500, actual:', asm.historyIndex);

  console.log('\nAll tests completed.');
}

runTests().catch(console.error);
