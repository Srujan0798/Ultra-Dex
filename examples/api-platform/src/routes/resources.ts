/**
 * @fileoverview Resources module
 * @module routes/resources
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ResourceService } from '../services/resources';
import { WebhookService } from '../services/webhook';
import { EventEmitter } from '../events/emitter';
import { ValidationError, NotFoundError } from '../middleware/error-handler';
import { createResourceSchema, updateResourceSchema } from '../validation/schemas';

const router = Router();
const resourceService = new ResourceService();
const webhookService = new WebhookService();
const eventEmitter = new EventEmitter();

// List resources
router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const cursor = req.query.cursor as string | undefined;
    const status = req.query.status as string | undefined;

    const result = await resourceService.listResources({
      userId: req.apiKey.userId,
      limit,
      cursor,
      status,
    });

    res.json({
      data: result.data,
      pagination: {
        has_more: result.hasMore,
        next_cursor: result.nextCursor,
        prev_cursor: result.prevCursor,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create resource
router.post('/', async (req, res, next) => {
  try {
    const validation = createResourceSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError(
        'Invalid request data',
        validation.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }

    const resource = await resourceService.createResource({
      userId: req.apiKey.userId,
      ...validation.data,
    });

    // Emit event for webhooks
    eventEmitter.emit('resource.created', {
      userId: req.apiKey.userId,
      resource,
    });

    res.status(201).json(resource);
  } catch (error) {
    next(error);
  }
});

// Get resource
router.get('/:id', async (req, res, next) => {
  try {
    const resource = await resourceService.getResource(req.params.id, req.apiKey.userId);

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    res.json(resource);
  } catch (error) {
    next(error);
  }
});

// Update resource
router.patch('/:id', async (req, res, next) => {
  try {
    const validation = updateResourceSchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError(
        'Invalid request data',
        validation.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }

    const resource = await resourceService.updateResource(
      req.params.id,
      req.apiKey.userId,
      validation.data
    );

    if (!resource) {
      throw new NotFoundError('Resource not found');
    }

    // Emit event for webhooks
    eventEmitter.emit('resource.updated', {
      userId: req.apiKey.userId,
      resource,
    });

    res.json(resource);
  } catch (error) {
    next(error);
  }
});

// Delete resource
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await resourceService.deleteResource(req.params.id, req.apiKey.userId);

    if (!success) {
      throw new NotFoundError('Resource not found');
    }

    // Emit event for webhooks
    eventEmitter.emit('resource.deleted', {
      userId: req.apiKey.userId,
      resourceId: req.params.id,
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export { router as resourceRouter };
