import { UltraDex } from './packages/sdk/src/client.js';

async function testStreamingExecution() {
  const client = new UltraDex();

  console.log('Testing streaming execution...');

  const task = 'Analyze the current codebase and provide a summary';

  try {
    const progressUpdates = [];
    const onProgress = (progress) => {
      progressUpdates.push(progress);
      console.log(`Progress: ${progress.type} - ${progress.status || 'in progress'}`);
    };

    // Test streaming execution
    for await (const progress of client.executeStream(task, { onProgress, trace: true })) {
      console.log('Received progress:', progress.type);
    }

    console.log(`Total progress updates: ${progressUpdates.length}`);
    console.log('Streaming test completed successfully');
  } catch (error) {
    console.error('Streaming test failed:', error.message);
  }
}

testStreamingExecution();
