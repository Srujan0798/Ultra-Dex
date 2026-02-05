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
