/**
 * @fileoverview Index module
 * @module routes/index
 */

import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { rateLimit } from '../middleware/rate-limit';
import { apiKeyRouter } from './api-keys';
import { resourceRouter } from './resources';
import { webhookRouter } from './webhooks';
import { analyticsRouter } from './analytics';

const router = Router();

// Apply authentication and rate limiting to all routes
router.use(authenticate);
router.use(rateLimit);

// Mount route modules
router.use('/api-keys', apiKeyRouter);
router.use('/resources', resourceRouter);
router.use('/webhook-endpoints', webhookRouter);
router.use('/webhook-deliveries', webhookRouter);
router.use('/analytics', analyticsRouter);

export { router as apiRouter };

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
