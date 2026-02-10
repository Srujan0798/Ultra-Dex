/**
 * @fileoverview Usage module
 * @module lib/usage
 */

import { prisma } from './prisma';

export async function trackUsage(options: {
  keyId: string;
  endpoint: string;
  responseTime?: number;
  statusCode?: number;
}) {
  return prisma.usage.create({
    data: {
      keyId: options.keyId,
      endpoint: options.endpoint,
      responseTime: options.responseTime ?? 0,
      statusCode: options.statusCode ?? 200,
    },
  });
}

export async function getUsageAnalytics(keyId: string, since?: Date) {
  return prisma.usage.findMany({
    where: {
      keyId,
      ...(since ? { timestamp: { gte: since } } : {}),
    },
    orderBy: { timestamp: 'desc' },
  });
}

/**
 * Error handler for usage
 * @param {Error} error - Error to handle
 */
function handleUsageError(error) {
  try {
    console.error('[usage]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
