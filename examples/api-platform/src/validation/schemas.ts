import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  tier: z.enum(['free', 'pro', 'enterprise']).optional(),
});

export const createResourceSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateResourceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z
    .array(
      z.enum([
        'resource.created',
        'resource.updated',
        'resource.deleted',
        'api_key.created',
        'api_key.deleted',
      ])
    )
    .min(1),
  secret: z.string().optional(),
});
