import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { AutoCEOScheduler } from '../../src/automation/scheduler';
import { JobRunner } from '../../src/automation/job-runner';

describe('AutoCEOScheduler', () => {
  const testConfigPath = path.join('.ultra-dex', 'test-automation-schedule.json');
  const testStatePath = path.join('.ultra-dex', 'test-state.json');
  const testLogsDir = path.join('.ultra-dex', 'test-logs');

  before(() => {
    if (!fs.existsSync('.ultra-dex')) {
      fs.mkdirSync('.ultra-dex', { recursive: true });
    }
  });

  after(() => {
    // Cleanup
    [testConfigPath, testStatePath].forEach(p => {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    if (fs.existsSync(testLogsDir)) {
      fs.rmSync(testLogsDir, { recursive: true, force: true });
    }
  });

  test('should initialize with default jobs', () => {
    const scheduler = new AutoCEOScheduler(testConfigPath);
    const status = scheduler.status();
    assert.strictEqual(status.isRunning, false);
    assert.ok(status.jobs.length > 0);
    assert.ok(status.jobs.find(j => j.id === 'reddit-scraper'));
  });

  test('should start and stop gracefully', async () => {
    const scheduler = new AutoCEOScheduler(testConfigPath);
    await scheduler.start();
    assert.strictEqual(scheduler.status().isRunning, true);
    await scheduler.stop();
    assert.strictEqual(scheduler.status().isRunning, false);
  });

  test('should persist state across restarts', async () => {
    const scheduler1 = new AutoCEOScheduler(testConfigPath);
    await scheduler1.start();
    const startedAt = scheduler1.status().startedAt;
    await scheduler1.stop();

    const scheduler2 = new AutoCEOScheduler(testConfigPath);
    await scheduler2.start();
    assert.strictEqual(scheduler2.status().startedAt, startedAt);
    await scheduler2.stop();
  });

  test('should handle job retries on failure', async () => {
    const scheduler = new AutoCEOScheduler(testConfigPath);
    const runner = new JobRunner(testLogsDir);
    
    // Register a failing handler
    let attempts = 0;
    runner.registerHandler('failHandler', async () => {
      attempts++;
      return { success: false, error: 'Forced failure' };
    });

    // Manually inject a job with this handler
    const testJobId = 'test-fail-job';
    // Accessing private members for testing purposes or using status/runJobNow
    // Since we want to test internal retry logic of executeJob, we'll use runJobNow
    // but runJobNow calls executeJob which has the retry loop.
    
    // Actually executeJob is private. runJobNow calls it.
    // We need to configure the job in the config file.
    fs.writeFileSync(testConfigPath, JSON.stringify({
      jobs: [{
        id: testJobId,
        cronExpression: '* * * * *',
        handler: 'failHandler',
        enabled: true,
        timeoutMs: 1000,
        maxRetries: 2, // 3 attempts total
        requiresApproval: false
      }]
    }));

    await scheduler.init();
    await scheduler.runJobNow(testJobId);
    
    const state = scheduler.getJobState(testJobId);
    assert.strictEqual(state?.status, 'failed');
    assert.strictEqual(state?.errorCount, 1); // errorCount is incremented AFTER all retries fail
    assert.strictEqual(attempts, 3); // 1 initial + 2 retries
  });

  test('should add to dead letter queue after 3 consecutive failures', async () => {
    const scheduler = new AutoCEOScheduler(testConfigPath);
    const runner = new JobRunner(testLogsDir);
    
    runner.registerHandler('failHandler', async () => ({ success: false, error: 'Permanent failure' }));

    fs.writeFileSync(testConfigPath, JSON.stringify({
      jobs: [{
        id: 'dlq-job',
        cronExpression: '* * * * *',
        handler: 'failHandler',
        enabled: true,
        timeoutMs: 1000,
        maxRetries: 0,
        requiresApproval: false
      }]
    }));

    await scheduler.init();
    
    // Run 3 times
    await scheduler.runJobNow('dlq-job');
    await scheduler.runJobNow('dlq-job');
    await scheduler.runJobNow('dlq-job');

    const status = scheduler.status();
    assert.strictEqual(status.deadLetterQueue.length, 1);
    assert.strictEqual(status.deadLetterQueue[0].jobId, 'dlq-job');
  });
});
