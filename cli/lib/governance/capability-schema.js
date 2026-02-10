// Copyright (c) 2026 Ultra-Dex

/**
 * Capability Schema
 * Defines the safety contract for tools and plugins.
 */

import { z } from 'zod';

export const CapabilitySchema = z.object({
  sideEffects: z.array(z.string()).default(['none']),
  rateLimit: z
    .object({
      max: z.number().int().positive(),
      window: z.string().optional(),
    })
    .optional(),
  riskScore: z.union([z.number().min(1).max(10), z.enum(['low', 'medium', 'high', 'critical'])]).optional(),
  permissions: z.array(z.enum(['read', 'write', 'execute', 'admin'])).optional(),
  requiresApproval: z.boolean().optional(),
});

export const CapabilityManifestSchema = z.object({
  name: z.string(),
  version: z.string().optional(),
  tools: z
    .array(
      z.object({
        name: z.string(),
        type: z.string().optional(),
        sideEffects: z.array(z.string()).default(['none']),
        rateLimit: z
          .object({
            max: z.number().int().positive(),
            window: z.string().optional(),
          })
          .optional(),
        riskScore: z
          .union([z.number().min(1).max(10), z.enum(['low', 'medium', 'high', 'critical'])])
          .optional(),
        permissions: z.array(z.enum(['read', 'write', 'execute', 'admin'])).optional(),
        requiresApproval: z.boolean().optional(),
      })
    )
    .default([]),
});

export function parseCapabilityManifest(payload) {
  return CapabilityManifestSchema.parse(payload);
}

/**
 * Handle errors in capability-schema module
 * @param {Error} error - The error to handle
 * @param {string} [context='capability-schema'] - Error context
 */
function handleModuleError(error, context = 'capability-schema') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
