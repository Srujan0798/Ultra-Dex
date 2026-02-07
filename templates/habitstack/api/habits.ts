import { Frequency } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function createHabit(
  userId: string,
  data: {
    name: string;
    description?: string;
    frequency?: Frequency;
    targetDays?: number[];
  }
) {
  return prisma.habit.create({
    data: {
      userId,
      name: data.name,
      description: data.description,
      frequency: data.frequency ?? 'DAILY',
      targetDays: data.targetDays ?? [],
    },
  });
}

export async function listHabits(userId: string) {
  return prisma.habit.findMany({
    where: { userId },
    include: { completions: true, streaks: true },
    orderBy: { createdAt: 'desc' },
  });
}

export async function updateHabit(
  habitId: string,
  userId: string,
  data: { name?: string; description?: string; color?: string; icon?: string }
) {
  return prisma.habit.updateMany({
    where: { id: habitId, userId },
    data,
  });
}
