import { EventEmitter as NodeEventEmitter } from 'events';
import { logger } from '../utils/logger';
import { webhookService } from '../services/webhook';

interface EventPayload {
  userId: string;
  [key: string]: unknown;
}

class ApiEventEmitter extends NodeEventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  private setupListeners(): void {
    this.on('resource.created', this.handleResourceCreated.bind(this));
    this.on('resource.updated', this.handleResourceUpdated.bind(this));
    this.on('resource.deleted', this.handleResourceDeleted.bind(this));
    this.on('api_key.created', this.handleApiKeyCreated.bind(this));
    this.on('api_key.deleted', this.handleApiKeyDeleted.bind(this));
  }

  private async handleResourceCreated(payload: EventPayload): Promise<void> {
    await this.triggerWebhooks(payload.userId, 'resource.created', {
      resource: payload.resource,
    });
  }

  private async handleResourceUpdated(payload: EventPayload): Promise<void> {
    await this.triggerWebhooks(payload.userId, 'resource.updated', {
      resource: payload.resource,
    });
  }

  private async handleResourceDeleted(payload: EventPayload): Promise<void> {
    await this.triggerWebhooks(payload.userId, 'resource.deleted', {
      resourceId: payload.resourceId,
    });
  }

  private async handleApiKeyCreated(payload: EventPayload): Promise<void> {
    await this.triggerWebhooks(payload.userId, 'api_key.created', {
      apiKey: payload.apiKey,
    });
  }

  private async handleApiKeyDeleted(payload: EventPayload): Promise<void> {
    await this.triggerWebhooks(payload.userId, 'api_key.deleted', {
      keyId: payload.keyId,
    });
  }

  private async triggerWebhooks(
    userId: string,
    eventType: string,
    data: Record<string, unknown>
  ): Promise<void> {
    try {
      const endpoints = await webhookService.listEndpoints(userId);

      for (const endpoint of endpoints) {
        if (endpoint.status !== 'active') continue;
        if (!endpoint.events.includes(eventType) && !endpoint.events.includes('*')) continue;

        const event = {
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: eventType,
          createdAt: new Date().toISOString(),
          data,
        };

        await webhookService.triggerWebhook(endpoint, event);
      }
    } catch (error) {
      logger.error({ error, userId, eventType }, 'Failed to trigger webhooks');
    }
  }
}

export const EventEmitter = ApiEventEmitter;
export const eventEmitter = new ApiEventEmitter();
