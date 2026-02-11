// Copyright (c) 2026 Ultra-Dex
/**
 * Webhook System
 * Event-driven webhooks for enterprise integrations
 *
 * @module services/webhooks/webhook-manager
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { ppmManager } from '../../core/memory/manager.js';
import { auditLogger } from '../audit/audit-logger.js';

/**
 * Webhook event types
 */
export type WebhookEventType =
  | 'project.created'
  | 'project.updated'
  | 'project.deleted'
  | 'project.deployed'
  | 'agent.execution.started'
  | 'agent.execution.completed'
  | 'agent.execution.failed'
  | 'team.member.invited'
  | 'team.member.joined'
  | 'team.member.removed'
  | 'approval.requested'
  | 'approval.approved'
  | 'approval.rejected'
  | 'user.login'
  | 'user.logout'
  | 'security.alert'
  | 'billing.invoice.created'
  | 'billing.payment.succeeded'
  | 'billing.payment.failed';

/**
 * Webhook configuration
 */
export interface Webhook {
  id: string;
  organizationId: string;
  name: string;
  url: string;
  events: WebhookEventType[];
  secret: string;
  isActive: boolean;
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
  metadata: {
    description?: string;
    createdBy: string;
    tags?: string[];
  };
  stats: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    lastDeliveryAt?: Date;
    lastError?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Webhook delivery attempt
 */
export interface WebhookDelivery {
  id: string;
  webhookId: string;
  eventType: WebhookEventType;
  payload: Record<string, any>;
  status: 'pending' | 'success' | 'failed';
  attempts: number;
  responseStatus?: number;
  responseBody?: string;
  error?: string;
  createdAt: Date;
  deliveredAt?: Date;
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  webhookId: string;
  data: Record<string, any>;
}

/**
 * Webhook Manager
 */
export class WebhookManager {
  private initialized: boolean = false;
  private webhooks: Map<string, Webhook> = new Map();

  async initialize(): Promise<void> {
    if (this.initialized) return;

    await ppmManager.init();
    await auditLogger.initialize();

    console.log('✓ Webhook system initialized');
    this.initialized = true;
  }

  /**
   * Create webhook
   */
  async createWebhook(
    organizationId: string,
    name: string,
    url: string,
    events: WebhookEventType[],
    createdBy: string,
    options?: {
      description?: string;
      secret?: string;
      tags?: string[];
    }
  ): Promise<Webhook> {
    await this.initialize();

    // Validate URL
    if (!this.isValidUrl(url)) {
      throw new Error('Invalid webhook URL');
    }

    const webhook: Webhook = {
      id: uuidv4(),
      organizationId,
      name: name.trim(),
      url: url.trim(),
      events: [...new Set(events)], // Remove duplicates
      secret: options?.secret || this.generateSecret(),
      isActive: true,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
      },
      metadata: {
        description: options?.description,
        createdBy,
        tags: options?.tags,
      },
      stats: {
        totalDeliveries: 0,
        successfulDeliveries: 0,
        failedDeliveries: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.webhooks.set(webhook.id, webhook);

    await ppmManager.add({
      content: `Webhook created: ${name}`,
      type: 'webhook-created',
      importance: 5,
      metadata: {
        webhookId: webhook.id,
        organizationId,
        name,
        events,
      },
    });

    console.log(`✓ Webhook created: ${name} (${webhook.id})`);
    return webhook;
  }

  /**
   * Trigger webhook event
   */
  async triggerEvent(
    eventType: WebhookEventType,
    organizationId: string,
    data: Record<string, any>
  ): Promise<WebhookDelivery[]> {
    await this.initialize();

    const deliveries: WebhookDelivery[] = [];

    // Find webhooks subscribed to this event
    for (const webhook of this.webhooks.values()) {
      if (
        webhook.organizationId === organizationId &&
        webhook.isActive &&
        webhook.events.includes(eventType)
      ) {
        const delivery = await this.deliverWebhook(webhook, eventType, data);
        deliveries.push(delivery);
      }
    }

    return deliveries;
  }

  /**
   * Deliver webhook
   */
  private async deliverWebhook(
    webhook: Webhook,
    eventType: WebhookEventType,
    data: Record<string, any>
  ): Promise<WebhookDelivery> {
    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      webhookId: webhook.id,
      data,
    };

    const delivery: WebhookDelivery = {
      id: uuidv4(),
      webhookId: webhook.id,
      eventType,
      payload,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };

    // Generate signature
    const signature = this.generateSignature(payload, webhook.secret);

    // Attempt delivery with retries
    let success = false;
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= webhook.retryConfig.maxRetries; attempt++) {
      delivery.attempts = attempt;

      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Signature': signature,
            'X-Webhook-ID': webhook.id,
            'X-Event-Type': eventType,
            'User-Agent': 'Ultra-Dex-Webhook/6.0.0',
          },
          body: JSON.stringify(payload),
        });

        delivery.responseStatus = response.status;
        delivery.responseBody = await response.text();

        if (response.ok) {
          success = true;
          break;
        } else {
          lastError = `HTTP ${response.status}: ${delivery.responseBody}`;
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
      }

      // Wait before retry
      if (attempt < webhook.retryConfig.maxRetries) {
        const delay = webhook.retryConfig.exponentialBackoff
          ? webhook.retryConfig.retryDelay * Math.pow(2, attempt - 1)
          : webhook.retryConfig.retryDelay;

        await this.sleep(delay);
      }
    }

    // Update delivery status
    delivery.status = success ? 'success' : 'failed';
    delivery.error = lastError;
    delivery.deliveredAt = success ? new Date() : undefined;

    // Update webhook stats
    webhook.stats.totalDeliveries++;
    if (success) {
      webhook.stats.successfulDeliveries++;
    } else {
      webhook.stats.failedDeliveries++;
    }
    webhook.stats.lastDeliveryAt = new Date();
    if (!success) {
      webhook.stats.lastError = lastError;
    }

    // Log to audit
    await auditLogger.log({
      type: 'security.alert',
      severity: success ? 'info' : 'warning',
      action: `WEBHOOK_DELIVERY_${success ? 'SUCCESS' : 'FAILED'}`,
      resource: 'webhook',
      resourceId: webhook.id,
      details: {
        eventType,
        attempts: delivery.attempts,
        success,
      },
    });

    return delivery;
  }

  /**
   * Generate webhook secret
   */
  private generateSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate signature for payload
   */
  private generateSignature(payload: WebhookPayload, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return `sha256=${hmac.digest('hex')}`;
  }

  /**
   * Validate webhook URL
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:' || parsed.protocol === 'http:';
    } catch {
      return false;
    }
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get webhook by ID
   */
  async getWebhook(webhookId: string): Promise<Webhook | null> {
    await this.initialize();
    return this.webhooks.get(webhookId) || null;
  }

  /**
   * List webhooks for organization
   */
  async listWebhooks(organizationId: string): Promise<Webhook[]> {
    await this.initialize();

    return Array.from(this.webhooks.values())
      .filter((w) => w.organizationId === organizationId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Update webhook
   */
  async updateWebhook(
    webhookId: string,
    updates: Partial<Omit<Webhook, 'id' | 'createdAt'>>
  ): Promise<Webhook | null> {
    await this.initialize();

    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;

    Object.assign(webhook, updates, { updatedAt: new Date() });

    await ppmManager.add({
      content: `Webhook updated: ${webhook.name}`,
      type: 'webhook-updated',
      importance: 5,
      metadata: {
        webhookId,
        updates: Object.keys(updates),
      },
    });

    console.log(`✓ Webhook updated: ${webhook.name}`);
    return webhook;
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(webhookId: string): Promise<boolean> {
    await this.initialize();

    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return false;

    this.webhooks.delete(webhookId);

    await ppmManager.add({
      content: `Webhook deleted: ${webhook.name}`,
      type: 'webhook-deleted',
      importance: 5,
      metadata: {
        webhookId,
        name: webhook.name,
      },
    });

    console.log(`✓ Webhook deleted: ${webhook.name}`);
    return true;
  }

  /**
   * Test webhook
   */
  async testWebhook(webhookId: string): Promise<WebhookDelivery> {
    await this.initialize();

    const webhook = this.webhooks.get(webhookId);
    if (!webhook) {
      throw new Error(`Webhook ${webhookId} not found`);
    }

    return this.deliverWebhook(webhook, 'project.created', {
      test: true,
      message: 'This is a test event',
    });
  }

  /**
   * Get webhook delivery history
   */
  async getDeliveryHistory(webhookId: string, limit: number = 50): Promise<WebhookDelivery[]> {
    await this.initialize();

    const results = await ppmManager.search(`webhook-delivery:${webhookId}`);
    const deliveries: WebhookDelivery[] = [];

    for (const result of results || []) {
      if (result.metadata?.delivery) {
        deliveries.push(result.metadata.delivery as WebhookDelivery);
      }
    }

    return deliveries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }

  /**
   * Regenerate webhook secret
   */
  async regenerateSecret(webhookId: string): Promise<string | null> {
    await this.initialize();

    const webhook = this.webhooks.get(webhookId);
    if (!webhook) return null;

    const newSecret = this.generateSecret();
    webhook.secret = newSecret;
    webhook.updatedAt = new Date();

    await ppmManager.add({
      content: `Webhook secret regenerated: ${webhook.name}`,
      type: 'webhook-secret-regenerated',
      importance: 6,
      metadata: {
        webhookId,
      },
    });

    console.log(`✓ Webhook secret regenerated: ${webhook.name}`);
    return newSecret;
  }
}

// Export singleton instance
export const webhookManager = new WebhookManager();
export default webhookManager;
