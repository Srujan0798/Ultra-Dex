import { prisma } from '../lib/prisma';

export async function logCompletion(
  habitId: string,
  date: Date,
  notes?: string
) {
  return prisma.completion.create({
    data: {
      habitId,
      date,
      notes,
    },
  });
}

export async function listCompletions(habitId: string) {
  return prisma.completion.findMany({
    where: { habitId },
    orderBy: { date: 'desc' },
  });
}
