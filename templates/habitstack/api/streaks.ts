import { prisma } from '../lib/prisma';
import {
  calculateStreak,
  updateStreak,
  getStreakHistory,
  checkAchievements,
} from '../lib/streak-logic';

function normalizeDate(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

export async function markCompletion(
  userId: string,
  habitId: string,
  date: Date = new Date(),
  notes?: string
) {
  const normalizedDate = normalizeDate(date);
  await prisma.completion.upsert({
    where: {
      habitId_date: {
        habitId,
        date: normalizedDate,
      },
    },
    update: { notes: notes ?? undefined },
    create: { habitId, date: normalizedDate, notes },
  });

  const streak = await updateStreak(userId, habitId, true);
  const achievements = await checkAchievements(userId);

  return { streak, achievements };
}

export async function unmarkCompletion(userId: string, habitId: string, date: Date = new Date()) {
  const normalizedDate = normalizeDate(date);
  await prisma.completion.deleteMany({
    where: { habitId, date: normalizedDate },
  });

  const streak = await updateStreak(userId, habitId, false);
  return { streak };
}

export async function getHabitStreak(userId: string, habitId: string) {
  return calculateStreak(userId, habitId);
}

export async function history(userId: string) {
  return getStreakHistory(userId);
}
