import 'reflect-metadata';
// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Tests for Stripe webhook handler
 * @module tests/core/webhook-handler
 */

import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import Stripe from 'stripe';
import { WebhookHandler } from '../../src/core/billing/webhook-handler.js';
import { usageMeter } from '../../src/core/billing/usage-meter.js';
import { clerk } from '../../src/core/auth/clerk-client.js';

describe('WebhookHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new WebhookHandler();

    // Mock Clerk calls used by webhook handler
    // @ts-ignore - override for testing
    clerk.users = {
      getUser: mock.fn(async (userId) => ({
        id: userId,
        publicMetadata: {},
      })),
      updateUserMetadata: mock.fn(async () => {}),
    };
  });

  it('should reject webhook with invalid signature', () => {
    const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    try {
      const rawBody = Buffer.from(JSON.stringify({ type: 'test.event' }));
      const invalidSignature = 'invalid_signature_12345';

      assert.throws(
        () => handler.verifyWebhook(rawBody, invalidSignature),
        /Unable to extract|timestamp|signature/i
      );
    } finally {
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    }
  });

  it('should throw error if STRIPE_WEBHOOK_SECRET not configured', () => {
    const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const rawBody = Buffer.from(JSON.stringify({ type: 'test.event' }));
    const signature = 'some_signature';

    assert.throws(
      () => handler.verifyWebhook(rawBody, signature),
      /STRIPE_WEBHOOK_SECRET not configured/
    );

    // Restore
    if (originalSecret) {
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    }
  });

  it('should verify webhook with valid signature', () => {
    const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    try {
      const stripe = new Stripe('sk_test_dummy', { apiVersion: '2024-12-18.acacia' });
      const payload = JSON.stringify({
        id: 'evt_test_valid',
        object: 'event',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: { object: {} },
      });
      const signature = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: process.env.STRIPE_WEBHOOK_SECRET,
      });

      const event = handler.verifyWebhook(Buffer.from(payload), signature);
      assert.equal(event.id, 'evt_test_valid');
      assert.equal(event.type, 'checkout.session.completed');
    } finally {
      if (originalSecret) {
        process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
      } else {
        delete process.env.STRIPE_WEBHOOK_SECRET;
      }
    }
  });

  it('should handle checkout.session.completed event', async () => {
    const event = {
      id: 'evt_checkout_' + Date.now(),
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_123',
          mode: 'subscription',
          subscription: 'sub_test_123',
          customer_email: 'test@example.com',
          metadata: {
            userId: 'user_test_123',
            tierId: 'pro',
          },
        },
      },
    };

    // Should not throw
    await handler.handleEvent(event);

    // Verify usage was reset for the user
    const usage = usageMeter.getUsage('user_test_123');
    assert.equal(usage.requestCount, 0);
    assert.equal(usage.tokenCount, 0);
  });

  it('should handle invoice.paid event', async () => {
    const userId = 'user_invoice_paid_123';
    const subscriptionId = 'sub_test_456';

    // Set up some usage first
    usageMeter.increment(userId, { requests: 50, tokens: 10000 });

    const event = {
      id: 'evt_invoice_' + Date.now(),
      type: 'invoice.paid',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'in_test_123',
          amount_paid: 2900,
          currency: 'usd',
          billing_reason: 'subscription_cycle',
          subscription: subscriptionId,
          metadata: {
            userId,
          },
        },
      },
    };

    await handler.handleEvent(event);

    // Verify usage was reset
    const usage = usageMeter.getUsage(userId);
    assert.equal(usage.requestCount, 0);
    assert.equal(usage.tokenCount, 0);
  });

  it('should handle invoice.payment_failed event', async () => {
    const event = {
      id: 'evt_payment_failed_' + Date.now(),
      type: 'invoice.payment_failed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'in_test_failed_123',
          amount_due: 2900,
          attempt_count: 1,
          next_payment_attempt: Math.floor(Date.now() / 1000) + 86400,
          subscription: 'sub_test_789',
          metadata: {
            userId: 'user_payment_failed_123',
          },
        },
      },
    };

    // Should not throw
    await handler.handleEvent(event);
  });

  it('should handle customer.subscription.deleted event', async () => {
    const userId = 'user_sub_deleted_123';

    // Set up some usage
    usageMeter.increment(userId, { requests: 100, tokens: 50000 });

    const event = {
      id: 'evt_sub_deleted_' + Date.now(),
      type: 'customer.subscription.deleted',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'sub_test_deleted_123',
          canceled_at: Math.floor(Date.now() / 1000),
          cancel_at_period_end: false,
          metadata: {
            userId,
          },
        },
      },
    };

    await handler.handleEvent(event);

    // Verify usage was reset (downgraded to free tier)
    const usage = usageMeter.getUsage(userId);
    assert.equal(usage.requestCount, 0);
    assert.equal(usage.tokenCount, 0);
  });

  it('should handle customer.subscription.created event', async () => {
    const event = {
      id: 'evt_sub_created_' + Date.now(),
      type: 'customer.subscription.created',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'sub_test_created_123',
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          metadata: {
            userId: 'user_sub_created_123',
            tierId: 'pro',
          },
        },
      },
    };

    // Should not throw
    await handler.handleEvent(event);
  });

  it('should handle customer.subscription.updated event', async () => {
    const event = {
      id: 'evt_sub_updated_' + Date.now(),
      type: 'customer.subscription.updated',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'sub_test_updated_123',
          status: 'active',
          cancel_at_period_end: true,
          metadata: {
            userId: 'user_sub_updated_123',
          },
        },
      },
    };

    // Should not throw
    await handler.handleEvent(event);
  });

  it('should handle duplicate events idempotently', async () => {
    const eventId = 'evt_duplicate_' + Date.now();
    const event = {
      id: eventId,
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_duplicate',
          mode: 'subscription',
          subscription: 'sub_test_duplicate',
          customer_email: 'duplicate@example.com',
          metadata: {
            userId: 'user_duplicate_123',
            tierId: 'pro',
          },
        },
      },
    };

    // Process first time
    await handler.handleEvent(event);
    usageMeter.increment('user_duplicate_123', { requests: 10 });

    const usageAfterFirst = usageMeter.getUsage('user_duplicate_123');
    assert.equal(usageAfterFirst.requestCount, 10);

    // Process second time (should be skipped)
    await handler.handleEvent(event);

    const usageAfterSecond = usageMeter.getUsage('user_duplicate_123');
    // Usage should remain the same (not reset again)
    assert.equal(usageAfterSecond.requestCount, 10);
  });

  it('should handle unhandled event types gracefully', async () => {
    const event = {
      id: 'evt_unknown_' + Date.now(),
      type: 'unknown.event.type',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {},
      },
    };

    // Should not throw
    await handler.handleEvent(event);
  });

  it('should handle events without metadata gracefully', async () => {
    const event = {
      id: 'evt_no_metadata_' + Date.now(),
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_no_metadata',
          mode: 'subscription',
          subscription: 'sub_test_no_metadata',
          customer_email: 'no-metadata@example.com',
          metadata: {}, // Empty metadata
        },
      },
    };

    // Should not throw
    await handler.handleEvent(event);
  });

  it('should handle subscription.deleted without userId', async () => {
    const event = {
      id: 'evt_sub_deleted_no_user_' + Date.now(),
      type: 'customer.subscription.deleted',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'sub_test_no_user',
          canceled_at: Math.floor(Date.now() / 1000),
          cancel_at_period_end: false,
          metadata: {}, // No userId
        },
      },
    };

    // Should not throw, just log error
    await handler.handleEvent(event);
  });
});
