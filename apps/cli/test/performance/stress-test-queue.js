import { OptimizedSwarmExecutor } from '../../lib/performance/swarm-optimizer.js';

// Mock Provider
const mockProvider = {
  generate: async (system, prompt) => {
    // Detect slowness based on agent name in prompt
    // The prompt includes agent system prompt which usually says "You are the @name agent"
    // Or we can rely on the fact that OptimizedSwarmExecutor passes agent name in some way?
    // Actually, runAgentInternal loads prompt using agent.name.
    // Let's assume the prompt contains the agent name.

    const isSlow = prompt.includes('@slow_');
    const delay = isSlow ? 2000 : 10;

    await new Promise((resolve) => setTimeout(resolve, delay));
    return { content: `Result...` };
  },
  // Add complete method just in case
  complete: async (prompt) => {
    const isSlow = prompt.includes('@slow_');
    const delay = isSlow ? 2000 : 10;
    await new Promise((resolve) => setTimeout(resolve, delay));
    return `Result...`;
  },
};

async function runStressTest() {
  console.log('Starting Stress Test for OptimizedSwarmExecutor (Fixed)...');
  const executor = new OptimizedSwarmExecutor();

  // 1. Queue Depth & Memory Test
  console.log('\n--- Test 1: Queue Depth (10k tasks) ---');
  const count = 10000;
  // Use smaller context to avoid OOM during quick test, we saw 20MB delta with 100KB context earlier.
  // Let's keep it to verify stability.
  const largeContext = 'x'.repeat(10 * 1024);

  const pipeline = Array.from({ length: count }, (_, i) => ({
    name: `agent_${i}`,
    tier: '2-implementation',
    description: `Task ${i}`,
  }));

  const startMem = process.memoryUsage().heapUsed;
  const startTime = Date.now();

  try {
    const options = { parallel: true };

    const result = await executor.executeSwarm(
      pipeline,
      'Stress Test Task',
      largeContext,
      mockProvider,
      options
    );

    const endMem = process.memoryUsage().heapUsed;
    const duration = Date.now() - startTime;

    console.log(`Completed ${count} tasks in ${duration}ms`);
    console.log(`Memory Delta: ${(endMem - startMem) / 1024 / 1024} MB`);
  } catch (error) {
    console.error('Test 1 Failed:', error);
  }

  // 2. Head-of-Line Blocking Test
  console.log('\n--- Test 2: Head-of-Line Blocking ---');

  // 4 slow tasks (saturating the 4 concurrent workers) followed by 10 fast tasks
  const blockingPipeline = [
    ...Array.from({ length: 4 }, (_, i) => ({
      name: `slow_${i}`,
      tier: '2-implementation',
      description: 'SLOW_TASK',
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      name: `fast_${i}`,
      tier: '2-implementation',
      description: 'FAST_TASK',
    })),
  ];

  const blockStart = Date.now();
  await executor.executeSwarm(blockingPipeline, 'Blocking Test', 'context', mockProvider, {
    parallel: true,
  });
  const blockDuration = Date.now() - blockStart;
  console.log(`Blocking Test Duration: ${blockDuration}ms`);

  // 4 slow tasks (parallel) take 2000ms.
  // 10 fast tasks take 10ms * (10/4) = ~30ms.
  // Total should be ~2030ms.
  // If HEAD-OF-LINE BLOCKING occurs (e.g. if we had 1 slow task and 4 threads),
  // 1 thread is blocked for 2s, other 3 threads process remaining 13 tasks.
  // With 4 slow tasks, ALL threads are blocked for 2s. This is expected saturation.

  // To test Head-of-Line blocking more subtly:
  // 1 slow task, 100 fast tasks.
  // Thread 1: slow (2000ms)
  // Thread 2,3,4: fast (10ms). They should process 100 tasks in ~330ms.
  // Total time should be determined by the slow task (2000ms).
  // If Thread 1 blocks the queue (it shouldn't in a thread pool), other threads continue.

  console.log('\n--- Test 2b: Single Slow Task vs Many Fast ---');
  const mixedPipeline = [
    { name: 'slow_0', tier: '2-implementation' },
    ...Array.from({ length: 100 }, (_, i) => ({ name: `fast_${i}`, tier: '2-implementation' })),
  ];

  const mixedStart = Date.now();
  await executor.executeSwarm(mixedPipeline, 'Mixed Test', 'context', mockProvider, {
    parallel: true,
  });
  const mixedDuration = Date.now() - mixedStart;
  console.log(`Mixed Test Duration: ${mixedDuration}ms`);

  // 100 fast tasks / 3 threads = 33 tasks per thread * 10ms = 330ms.
  // 1 slow task = 2000ms.
  // Max(330, 2000) = 2000ms.
  // If it takes significantly longer (e.g. 2330ms), then slow task delayed start of others? No.
  // If it takes 2000ms, it means parallelization works.

  if (mixedDuration < 1900) {
    console.log("WARNING: Slow task didn't run slow enough?");
  } else if (mixedDuration > 2500) {
    console.log('OBSERVATION: Overhead detected or blocking.');
  } else {
    console.log('OBSERVATION: Parallel execution works as expected (Max(slow, fast_batch)).');
  }
}

runStressTest().catch(console.error);
