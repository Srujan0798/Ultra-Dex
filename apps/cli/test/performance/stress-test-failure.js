
import { OptimizedSwarmExecutor } from '../../lib/performance/swarm-optimizer.js';

const mockProvider = {
  generate: async (system, prompt) => {
    // The prompt contains the agent prompt which contains "You are the @agent_fail agent."
    // So checking for "@agent_fail" should work if default prompt logic is used.
    if (prompt.includes('@agent_fail')) {
      throw new Error('Task Failed');
    }
    return { content: `Result...` };
  },
  complete: async (prompt) => {
    if (prompt.includes('@agent_fail')) {
      throw new Error('Task Failed');
    }
    return `Result...`;
  }
};

async function runFailureTest() {
  console.log('--- Test 3: Failure Propagation ---');
  const executor = new OptimizedSwarmExecutor();

  const pipeline = [
    { name: 'agent_fail', tier: '2-implementation', description: 'FAIL_TASK' },
    { name: 'agent_next', tier: '4-quality', description: 'NEXT_TASK' }
  ];

  try {
    const result = await executor.executeSwarm(
      pipeline,
      'Failure Test',
      'context',
      mockProvider,
      { parallel: true }
    );

    const failResult = result.results.find(r => r.agent === 'agent_fail');
    const nextResult = result.results.find(r => r.agent === 'agent_next');

    console.log('Fail Agent Success:', failResult.success);
    console.log('Fail Agent Error:', failResult.error);
    console.log('Next Agent Ran:', !!nextResult);

    if (nextResult && failResult.success === false) {
      console.log('OBSERVATION: Execution continued despite failure (Tier Failure Propagation).');
    } else {
      console.log('OBSERVATION: Execution logic behavior: ', failResult.success ? 'Success unexpectedly' : 'Stopped?');
    }
  } catch (e) {
    console.error('Executor threw exception:', e);
  }
}

runFailureTest().catch(console.error);
