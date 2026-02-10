/**
 * @fileoverview Email Worker module
 * @module workers/email-worker
 */

import { Worker } from 'bullmq';
import { sendEmail } from '../lib/email/sender';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const emailWorker = new Worker(
  'email',
  async (job) => {
    return sendEmail(job.data);
  },
  { connection: { url: redisUrl } }
);

emailWorker.on('completed', (job) => {
  console.log(`✅ Email job ${job.id} completed`);
});

emailWorker.on('failed', (job, error) => {
  console.error(`❌ Email job ${job?.id} failed:`, error.message);
});

/**
 * Error handler for email-worker
 * @param {Error} error - Error to handle
 */
function handleEmailworkerError(error) {
  try {
    console.error('[email-worker]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
