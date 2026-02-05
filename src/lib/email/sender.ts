import { Resend } from 'resend';
import { Queue } from 'bullmq';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const resend = new Resend(RESEND_API_KEY);
export const emailQueue = new Queue('email', { connection: { url: redisUrl } });

export async function queueEmail(payload: {
  to: string;
  subject: string;
  html: string;
  tags?: string[];
}) {
  return emailQueue.add('send-email', payload, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 }
  });
}

export async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
}) {
  return resend.emails.send({
    from: 'Ultra-Dex <no-reply@ultra-dex.dev>',
    to: payload.to,
    subject: payload.subject,
    html: payload.html
  });
}
