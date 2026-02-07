import { prisma } from '../lib/prisma';
import { getStreakStats, updateStreak } from '../lib/streak-logic';

export async function markCompletion(habitId: string, date: Date, notes?: string) {
  const completion = await prisma.completion.create({
    data: { habitId, date, notes },
  });

  await updateStreak(habitId, true);

  return completion;
}

export async function breakStreak(habitId: string) {
  return updateStreak(habitId, false);
}

export async function fetchStreakStats(habitId: string) {
  return getStreakStats(habitId);
}
