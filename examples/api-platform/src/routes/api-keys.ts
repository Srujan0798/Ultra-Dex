/**
 * @fileoverview Api Keys module
 * @module routes/api-keys
 */

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiKeyService } from '../services/auth';
import { ValidationError, NotFoundError } from '../middleware/error-handler';
import { createApiKeySchema } from '../validation/schemas';

const router = Router();
const apiKeyService = new ApiKeyService();

// List API keys
router.get('/', async (req, res, next) => {
  try {
    const keys = await apiKeyService.listKeys(req.apiKey.userId);

    res.json({
      data: keys.map((key) => ({
        id: key.id,
        name: key.name,
        prefix: key.prefix,
        tier: key.tier,
        status: key.status,
        created_at: key.createdAt,
        last_used_at: key.lastUsedAt,
      })),
      pagination: {
        total: keys.length,
        page: 1,
        per_page: keys.length,
        total_pages: 1,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create API key
router.post('/', async (req, res, next) => {
  try {
    const validation = createApiKeySchema.safeParse(req.body);

    if (!validation.success) {
      throw new ValidationError(
        'Invalid request data',
        validation.error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
      );
    }

    const { name, tier = 'free' } = validation.data;
    const apiKey = await apiKeyService.createKey(req.apiKey.userId, { name, tier });

    res.status(201).json({
      id: apiKey.id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      tier: apiKey.tier,
      status: apiKey.status,
      created_at: apiKey.createdAt,
      secret: apiKey.secret, // Only shown once on creation
    });
  } catch (error) {
    next(error);
  }
});

// Get API key
router.get('/:id', async (req, res, next) => {
  try {
    const key = await apiKeyService.getKey(req.params.id, req.apiKey.userId);

    if (!key) {
      throw new NotFoundError('API key not found');
    }

    res.json({
      id: key.id,
      name: key.name,
      prefix: key.prefix,
      tier: key.tier,
      status: key.status,
      created_at: key.createdAt,
      last_used_at: key.lastUsedAt,
    });
  } catch (error) {
    next(error);
  }
});

// Revoke API key
router.delete('/:id', async (req, res, next) => {
  try {
    const success = await apiKeyService.revokeKey(req.params.id, req.apiKey.userId);

    if (!success) {
      throw new NotFoundError('API key not found');
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Rotate API key
router.post('/:id/rotate', async (req, res, next) => {
  try {
    const rotatedKey = await apiKeyService.rotateKey(req.params.id, req.apiKey.userId);

    if (!rotatedKey) {
      throw new NotFoundError('API key not found');
    }

    res.json({
      id: rotatedKey.id,
      name: rotatedKey.name,
      prefix: rotatedKey.prefix,
      tier: rotatedKey.tier,
      status: rotatedKey.status,
      created_at: rotatedKey.createdAt,
      last_used_at: rotatedKey.lastUsedAt,
      secret: rotatedKey.secret, // Only shown once after rotation
    });
  } catch (error) {
    next(error);
  }
});

export { router as apiKeyRouter };
