/**
 * @fileoverview Keys module
 * @module api/keys
 */

import { prisma } from '../lib/prisma';
import { createKeyRecord, hashKey } from '../lib/key-generator';

export async function createApiKey(workspaceId: string, name: string, rateLimit = 100) {
  const { key, prefix, keyHash } = createKeyRecord();

  const record = await prisma.apiKey.create({
    data: {
      workspaceId,
      name,
      keyHash,
      prefix,
      rateLimit,
    },
  });

  return { key, record };
}

export async function listApiKeys(workspaceId: string) {
  return prisma.apiKey.findMany({
    where: { workspaceId, revokedAt: null },
    orderBy: { createdAt: 'desc' },
  });
}

export async function revokeApiKey(id: string, workspaceId: string) {
  const key = await prisma.apiKey.findFirst({
    where: { id, workspaceId, revokedAt: null },
  });
  if (!key) throw new Error('Key not found or unauthorized');

  return prisma.apiKey.update({
    where: { id },
    data: { revokedAt: new Date() },
  });
}

export async function rotateApiKey(id: string, workspaceId: string) {
  const key = await prisma.apiKey.findFirst({
    where: { id, workspaceId, revokedAt: null },
  });
  if (!key) throw new Error('Key not found or unauthorized');

  const { key: newKey, prefix, keyHash } = createKeyRecord();

  const record = await prisma.apiKey.update({
    where: { id },
    data: { keyHash, prefix, revokedAt: null },
  });

  return { key: newKey, record };
}

export async function validateApiKey(rawKey: string) {
  const prefix = rawKey.split('_').slice(0, 2).join('_');
  const keyHash = hashKey(rawKey);
  const apiKey = await prisma.apiKey.findFirst({
    where: { prefix, keyHash, revokedAt: null },
  });

  if (!apiKey) return null;

  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsed: new Date() },
    })
    .catch(() => {});

  return apiKey;
}
