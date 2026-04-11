/**
 * @fileoverview Webhooks module
 * @module routes/webhooks
 */

import { Router } from 'express';
import { WebhookService } from '../services/webhook';
import { ValidationError, NotFoundError } from '../middleware/error-handler';
import { createWebhookSchema } from '../validation/schemas';

const router = Router();
const webhookService = new WebhookService();

// List webhook endpoints
router.get('/', async (req, res, next) => {
  try {
    const endpoints = await webhookService.listEndpoints(req.apiKey.userId);

    res.json({
      data: endpoints,
    });
  } catch (error) {
    next(error);
  }
});

// Create webhook endpoint
router.post('/', async (req, res, next) => {
  try {
    const validation = createWebhookSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError(
        'Invalid request data',
        validation.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }

    const endpoint = await webhookService.createEndpoint({
      userId: req.apiKey.userId,
      ...validation.data,
    });

    res.status(201).json(endpoint);
  } catch (error) {
    next(error);
  }
});

// Get webhook endpoint
router.get('/:id', async (req, res, next) => {
  try {
    const endpoint = await webhookService.getEndpoint(req.params.id, req.apiKey.userId);

    if (!endpoint) {
      throw new NotFoundError('Webhook endpoint not found');
    }

    res.json(endpoint);
  } catch (error) {
    next(error);
  }
});

// Delete webhook endpoint
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await webhookService.deleteEndpoint(req.params.id, req.apiKey.userId);

    if (!success) {
      throw new NotFoundError('Webhook endpoint not found');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Test webhook endpoint
router.post('/:id/test', async (req, res, next) => {
  try {
    const delivery = await webhookService.testEndpoint(req.params.id, req.apiKey.userId);

    if (!delivery) {
      throw new NotFoundError('Webhook endpoint not found');
    }

    res.json(delivery);
  } catch (error) {
    next(error);
  }
});

// List webhook deliveries
router.get('/deliveries', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const endpointId = req.query.endpoint_id as string | undefined;
    const status = req.query.status as string | undefined;

    const deliveries = await webhookService.listDeliveries({
      userId: req.apiKey.userId,
      endpointId,
      status,
      limit,
    });

    res.json({
      data: deliveries,
    });
  } catch (error) {
    next(error);
  }
});

export { router as webhookRouter };
