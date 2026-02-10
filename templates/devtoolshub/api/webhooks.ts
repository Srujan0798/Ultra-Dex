/**
 * @fileoverview Webhooks module
 * @module api/webhooks
 */

import { prisma } from '../lib/prisma';

export async function createWebhook(
  url: string,
  secret: string,
  workspaceId?: string
) {
  return prisma.webhookEndpoint.create({
    data: { url, secret, workspaceId },
  });
}

export async function listWebhooks(workspaceId?: string) {
  return prisma.webhookEndpoint.findMany({
    where: workspaceId ? { workspaceId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}

export async function disableWebhook(id: string) {
  return prisma.webhookEndpoint.update({
    where: { id },
    data: { active: false },
  });
}

export async function deleteWebhook(id: string) {
  return prisma.webhookEndpoint.delete({ where: { id } });
}

/**
 * Error handler for webhooks
 * @param {Error} error - Error to handle
 */
function handleWebhooksError(error) {
  try {
    console.error('[webhooks]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
