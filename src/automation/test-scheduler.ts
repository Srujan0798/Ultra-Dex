/**
 * Test script for AUTO-CEO Scheduler
 */

import { AutoCEOScheduler } from './scheduler.js';

async function main() {
  const command = process.argv[2] || 'status';

  const scheduler = new AutoCEOScheduler('config/automation-schedule.json');
  await scheduler.init();

  switch (command) {
    case 'start':
      await scheduler.start();
      console.log('\nScheduler started. Press Ctrl+C to stop.');
      // Keep process running
      await new Promise(() => {});
      break;

    case 'stop':
      await scheduler.stop();
      console.log('Scheduler stopped');
      break;

    case 'status':
    default:
      const status = scheduler.status();
      console.log('\n=== AUTO-CEO Scheduler Status ===\n');
      console.log(`Running: ${status.isRunning}`);
      console.log(`Started At: ${status.startedAt || 'N/A'}`);
      console.log(`\nJobs:`);
      status.jobs.forEach((job) => {
        console.log(`  - ${job.id}:`);
        console.log(`      Status: ${job.status}`);
        console.log(`      Last Run: ${job.lastRun || 'Never'}`);
        console.log(`      Next Run: ${job.nextRun || 'N/A'}`);
        console.log(`      Error Count: ${job.errorCount}`);
        if (job.lastError) {
          console.log(`      Last Error: ${job.lastError}`);
        }
      });
      console.log(`\nDead Letter Queue: ${status.deadLetterQueue.length} items`);
      if (status.deadLetterQueue.length > 0) {
        status.deadLetterQueue.forEach((item) => {
          console.log(`  - ${item.jobId}: ${item.error} (at ${item.failedAt})`);
        });
      }
      console.log('\n===================================\n');
      break;
  }
}

main().catch(console.error);
