import { z } from 'zod';

export enum PluginCategory {
  AGENT = 'agent',
  PROVIDER = 'provider',
  TOOL = 'tool',
  WORKFLOW = 'workflow',
}

export const PluginSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  author: z.string().min(1),
  category: z.nativeEnum(PluginCategory),
  tags: z.array(z.string()).default([]),
  dependencies: z.record(z.string()).default({}),
  manifest: z.record(z.any()),
  downloads: z.number().default(0),
  rating: z.number().min(0).max(5).default(0),
  reviews: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
  published: z.boolean().default(false),
});

export type Plugin = z.infer<typeof PluginSchema>;

export const PluginCreateSchema = PluginSchema.omit({
  id: true,
  downloads: true,
  rating: true,
  reviews: true,
  createdAt: true,
  updatedAt: true,
  published: true,
});

export type PluginCreate = z.infer<typeof PluginCreateSchema>;

export const PluginUpdateSchema = PluginSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type PluginUpdate = z.infer<typeof PluginUpdateSchema>;
