
import { ExecutionController } from './apps/cli/lib/autonomous/execution-controller.js';
import assert from 'assert';

async function testConcurrency() {
  const controller = new ExecutionController({
    circuitThreshold: 3,
    maxRetries: 0 // Keep it simple
  });

  // Mock _runTaskExecution to fail
  controller._runTaskExecution = async () => {
    throw new Error('Task failed');
  };

  let circuitOpenEvents = 0;
  controller.on('circuit:open', () => {
    circuitOpenEvents++;
  });

  const tasks = Array.from({ length: 100 }, (_, i) => ({
    id: `task_${i}`,
    description: `Test task ${i}`
  }));

  console.log('Running 100 concurrent failing tasks...');
  await Promise.all(tasks.map(task => controller._executeTask(task).catch(() => {})));

  console.log(`Circuit open events: ${circuitOpenEvents}`);
  console.log(`Circuit state: ${controller._circuitState}`);
  console.log(`Circuit failures: ${controller._circuitFailures}`);

  // In the current implementation, it might emit multiple events because of race conditions
  // if(this._circuitFailures >= this.options.circuitThreshold) is checked and then state is updated
  // If multiple tasks reach this check simultaneously, they all might see it >= threshold and emit.
}

testConcurrency().catch(err => {
  console.error(err);
  process.exit(1);
});
