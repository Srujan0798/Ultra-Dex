import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { config } from '../config';
import { logger } from '../utils/logger';
import { webhookQueue } from '../queue/webhook';

interface WebhookEndpoint {
  id: string;
  userId: string;
  url: string;
  events: string[];
  status: 'active' | 'disabled';
  secret?: string;
  createdAt: string;
  updatedAt: string;
}

interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventId: string;
  status: 'pending' | 'delivered' | 'failed';
  httpStatus?: number;
  deliveredAt?: string;
  error?: string;
  retryCount: number;
}

interface CreateWebhookInput {
  userId: string;
  url: string;
  events: string[];
  secret?: string;
}

interface WebhookEvent {
  id: string;
  type: string;
  createdAt: string;
  data: Record<string, unknown>;
}

// In-memory stores for demo
const endpointsStore: Map<string, WebhookEndpoint> = new Map();
const deliveriesStore: Map<string, WebhookDelivery> = new Map();

export class WebhookService {
  async createEndpoint(input: CreateWebhookInput): Promise<WebhookEndpoint> {
    const now = new Date().toISOString();
    const endpoint: WebhookEndpoint = {
      id: `wh_${uuidv4().replace(/-/g, '')}`,
      userId: input.userId,
      url: input.url,
      events: input.events,
      status: 'active',
      secret: input.secret,
      createdAt: now,
      updatedAt: now
    };

    endpointsStore.set(endpoint.id, endpoint);
    logger.info({ endpointId: endpoint.id, userId: input.userId }, 'Webhook endpoint created');

    return endpoint;
  }

  async listEndpoints(userId: string): Promise<WebhookEndpoint[]> {
    return Array.from(endpointsStore.values()).filter(e => e.userId === userId);
  }

  async getEndpoint(id: string, userId: string): Promise<WebhookEndpoint | null> {
    const endpoint = endpointsStore.get(id);
    if (!endpoint || endpoint.userId !== userId) return null;
    return endpoint;
  }

  async deleteEndpoint(id: string, userId: string): Promise<boolean> {
    const endpoint = endpointsStore.get(id);
    if (!endpoint || endpoint.userId !== userId) return false;

    endpointsStore.delete(id);
    logger.info({ endpointId: id, userId }, 'Webhook endpoint deleted');
    return true;
  }

  async testEndpoint(id: string, userId: string): Promise<WebhookDelivery | null> {
    const endpoint = endpointsStore.get(id);
    if (!endpoint || endpoint.userId !== userId) return null;

    const event: WebhookEvent = {
      id: `evt_${uuidv4().replace(/-/g, '')}`,
      type: 'test.event',
      createdAt: new Date().toISOString(),
      data: { message: 'This is a test webhook event' }
    };

    const delivery = await this.triggerWebhook(endpoint, event);
    return delivery;
  }

  async listDeliveries(options: {
    userId: string;
    endpointId?: string;
    status?: string;
    limit: number;
  }): Promise<WebhookDelivery[]> {
    let deliveries = Array.from(deliveriesStore.values());

    // Filter by user's endpoints
    const userEndpoints = await this.listEndpoints(options.userId);
    const userEndpointIds = new Set(userEndpoints.map(e => e.id));
    deliveries = deliveries.filter(d => userEndpointIds.has(d.endpointId));

    if (options.endpointId) {
      deliveries = deliveries.filter(d => d.endpointId === options.endpointId);
    }

    if (options.status) {
      deliveries = deliveries.filter(d => d.status === options.status);
    }

    return deliveries.slice(0, options.limit);
  }

  async triggerWebhook(
    endpoint: WebhookEndpoint,
    event: WebhookEvent
  ): Promise<WebhookDelivery> {
    const delivery: WebhookDelivery = {
      id: `del_${uuidv4().replace(/-/g, '')}`,
      endpointId: endpoint.id,
      eventId: event.id,
      status: 'pending',
      retryCount: 0
    };

    deliveriesStore.set(delivery.id, delivery);

    // Add to queue for async processing
    await webhookQueue.add('deliver', {
      deliveryId: delivery.id,
      endpoint,
      event
    });

    return delivery;
  }

  generateSignature(payload: string, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expected = this.generateSignature(payload, secret);
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }
}

export const webhookService = new WebhookService();
