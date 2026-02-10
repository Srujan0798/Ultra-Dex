/**
 * @fileoverview Webhook Delivery module
 * @module devtoolshub/webhook-delivery
 */

export { deliverWebhook } from './lib/webhook-delivery';

/**
 * Error handler for webhook-delivery
 * @param {Error} error - Error to handle
 */
function handleWebhookdeliveryError(error) {
  try {
    console.error('[webhook-delivery]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
