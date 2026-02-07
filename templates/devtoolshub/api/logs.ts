import { prisma } from '../lib/prisma';

export async function logUsage(
  keyId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number
) {
  return prisma.usage.create({
    data: {
      keyId,
      endpoint: `${method.toUpperCase()} ${endpoint}`,
      statusCode,
      responseTime,
    },
  });
}

export async function getUsageStats(keyId: string) {
  const logs = await prisma.usage.groupBy({
    by: ['statusCode'],
    where: { keyId },
    _count: { statusCode: true },
  });

  return logs.map((entry) => ({ status: entry.statusCode, count: entry._count.statusCode }));
}
