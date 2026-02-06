import Bull from 'bull';
import { config } from '../config';
import { logger } from '../utils/logger';
import { webhookService } from '../services/webhook';

interface WebhookJobData {
  deliveryId: string;
  endpoint: {
    id: string;
    url: string;
    secret?: string;
  };
  event: {
    id: string;
    type: string;
    createdAt: string;
    data: Record<string, unknown>;
  };
}

// Create queue (in production, use Redis)
const webhookQueue = new Bull<WebhookJobData>('webhook-delivery', {
  redis: config.redis.url,
  defaultJobOptions: {
    attempts: config.webhook.maxRetries,
    backoff: {
      type: 'exponential',
      delay: config.webhook.retryDelayMs,
    },
    timeout: config.webhook.timeoutMs,
  },
});

// Process jobs
webhookQueue.process('deliver', async (job) => {
  const { deliveryId, endpoint, event } = job.data;

  logger.info({ deliveryId, endpointId: endpoint.id }, 'Processing webhook delivery');

  try {
    const payload = JSON.stringify(event);
    const signature = endpoint.secret
      ? webhookService.generateSignature(payload, endpoint.secret)
      : undefined;

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-ID': deliveryId,
        'X-Event-ID': event.id,
        'X-Event-Type': event.type,
        ...(signature && { 'X-Webhook-Signature': signature }),
      },
      body: payload,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    logger.info({ deliveryId, status: response.status }, 'Webhook delivered successfully');

    return {
      success: true,
      status: response.status,
    };
  } catch (error) {
    logger.error({ deliveryId, error: (error as Error).message }, 'Webhook delivery failed');
    throw error;
  }
});

// Handle completed jobs
webhookQueue.on('completed', (job, result) => {
  logger.info({ jobId: job.id, result }, 'Webhook job completed');
});

// Handle failed jobs
webhookQueue.on('failed', (job, err) => {
  logger.error({ jobId: job.id, error: err.message }, 'Webhook job failed permanently');
});

export { webhookQueue };
