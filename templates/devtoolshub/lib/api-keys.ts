/**
 * @fileoverview Api Keys module
 * @module lib/api-keys
 */

import { prisma } from './prisma';
import { createKeyRecord, hashKey } from './key-generator';

export async function createApiKey(options: { workspaceId: string; name?: string; rateLimit?: number }) {
  const { key, prefix, keyHash } = createKeyRecord();

  const record = await prisma.apiKey.create({
    data: {
      workspaceId: options.workspaceId,
      name: options.name,
      prefix,
      keyHash,
      rateLimit: options.rateLimit ?? 100,
    },
  });

  return { record, key };
}

export async function verifyApiKey(rawKey: string) {
  const parts = rawKey.split('_');
  const prefix = parts.slice(0, 2).join('_');
  const record = await prisma.apiKey.findUnique({ where: { prefix } });

  if (!record || record.revokedAt) return null;

  return record.keyHash === hashKey(rawKey) ? record : null;
}

export async function revokeApiKey(apiKeyId: string) {
  return prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { revokedAt: new Date() },
  });
}

export async function rotateApiKey(apiKeyId: string) {
  const { key, prefix, keyHash } = createKeyRecord();

  const record = await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { prefix, keyHash },
  });

  return { record, key };
}

export async function listApiKeys(workspaceId: string) {
  return prisma.apiKey.findMany({
    where: { workspaceId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Error handler for api-keys
 * @param {Error} error - Error to handle
 */
function handleApikeysError(error) {
  try {
    console.error('[api-keys]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
