import { prisma } from './prisma';

function floorToMinute(date: Date) {
  const copy = new Date(date);
  copy.setSeconds(0, 0);
  return copy;
}

export async function checkLimit(keyId: string, limit: number) {
  const windowStart = floorToMinute(new Date());
  const record = await prisma.rateLimit.findUnique({
    where: { keyId_windowStart: { keyId, windowStart } },
  });

  const count = record?.count || 0;
  return { allowed: count < limit, count, windowStart };
}

export async function incrementUsage(keyId: string) {
  const windowStart = floorToMinute(new Date());
  return prisma.rateLimit.upsert({
    where: { keyId_windowStart: { keyId, windowStart } },
    update: { count: { increment: 1 } },
    create: { keyId, windowStart, count: 1 },
  });
}
