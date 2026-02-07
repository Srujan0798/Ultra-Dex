import { prisma } from './prisma';

// Simple implementation using DB-based counters.
// For high scale, use Redis.

export async function checkRateLimit(workspaceId: string, windowMs = 3600000) {
  const apiKeys = await prisma.apiKey.findMany({
    where: { workspaceId, revokedAt: null },
    select: { id: true, rateLimit: true },
  });

  const keyIds = apiKeys.map((k) => k.id);
  if (keyIds.length === 0) return { allowed: true, remaining: 0 };

  const windowStart = new Date(Date.now() - windowMs);

  const currentUsage = await prisma.usage.count({
    where: {
      keyId: { in: keyIds },
      timestamp: { gte: windowStart },
    },
  });

  const maxRequests = Math.max(...apiKeys.map((k) => k.rateLimit || 0));

  if (currentUsage >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: maxRequests - currentUsage };
}
