/**
 * @fileoverview Streak Logic module
 * @module lib/streak-logic
 */

import { prisma } from './prisma';

const ONE_DAY = 24 * 60 * 60 * 1000;

function normalize(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function toKey(date: Date) {
  return normalize(date).toISOString().slice(0, 10);
}

function isTargetDay(date: Date, targetDays?: number[]) {
  if (!targetDays || targetDays.length === 0) return true;
  const day = normalize(date).getDay();
  return targetDays.includes(day);
}

function computeStreak(completions: Date[], targetDays?: number[], reference = new Date()) {
  if (completions.length === 0) return 0;

  const completionSet = new Set(completions.map((date) => toKey(date)));
  let current = normalize(reference);

  while (!isTargetDay(current, targetDays)) {
    current = new Date(current.getTime() - ONE_DAY);
  }

  let streak = 0;
  let safety = 0;
  while (safety < 400) {
    safety += 1;

    if (!isTargetDay(current, targetDays)) {
      current = new Date(current.getTime() - ONE_DAY);
      continue;
    }

    if (completionSet.has(toKey(current))) {
      streak += 1;
      current = new Date(current.getTime() - ONE_DAY);
      continue;
    }

    break;
  }

  return streak;
}

export async function calculateStreak(userId: string, habitId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    include: { completions: true, streaks: true },
  });

  if (!habit) throw new Error('Habit not found');

  const completionDates = habit.completions.map((c) => c.date);
  const current = computeStreak(completionDates, habit.targetDays);
  const longest = habit.streaks.reduce((max, streak) => Math.max(max, streak.currentDays), current);

  const total = habit.completions.length;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisWeek = habit.completions.filter((c) => c.date >= startOfWeek).length;
  const thisMonth = habit.completions.filter((c) => c.date >= startOfMonth).length;

  return {
    habitId,
    current,
    longest,
    total,
    thisWeek,
    thisMonth,
  };
}

export async function updateStreak(userId: string, habitId: string, completed: boolean, reference = new Date()) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    include: { completions: true, streaks: true },
  });

  if (!habit) throw new Error('Habit not found');

  const completionDates = habit.completions.map((c) => c.date);
  const currentStreak = computeStreak(completionDates, habit.targetDays, reference);

  const activeStreak = habit.streaks.find((s) => !s.endDate);

  if (!completed && currentStreak === 0 && activeStreak) {
    await prisma.streak.update({
      where: { id: activeStreak.id },
      data: { endDate: normalize(reference), currentDays: activeStreak.currentDays },
    });
  }

  if (currentStreak > 0) {
    const startDate = normalize(new Date(reference.getTime() - ONE_DAY * (currentStreak - 1)));
    if (activeStreak) {
      await prisma.streak.update({
        where: { id: activeStreak.id },
        data: { currentDays: currentStreak, startDate, endDate: null },
      });
    } else {
      await prisma.streak.create({
        data: {
          habitId,
          startDate,
          currentDays: currentStreak,
        },
      });
    }
  }

  return currentStreak;
}

export async function getStreakHistory(userId: string) {
  const streaks = await prisma.streak.findMany({
    where: { habit: { userId } },
    include: { habit: true },
    orderBy: { startDate: 'desc' },
  });

  return streaks.map((streak) => ({
    habitId: streak.habitId,
    habitName: streak.habit.name,
    startDate: streak.startDate,
    endDate: streak.endDate,
    currentDays: streak.currentDays,
  }));
}

export async function checkAchievements(userId: string) {
  const completions = await prisma.completion.findMany({
    where: { habit: { userId } },
  });
  const streaks = await prisma.streak.findMany({
    where: { habit: { userId } },
  });
  const existing = await prisma.achievement.findMany({
    where: { userId },
  });

  const existingTypes = new Set(existing.map((a) => a.type));
  const longestStreak = streaks.reduce((max, streak) => Math.max(max, streak.currentDays), 0);

  const definitions = [
    { type: 'first-completion', name: 'First Step', condition: completions.length >= 1, xp: 10 },
    { type: 'streak-7', name: 'Seven Day Streak', condition: longestStreak >= 7, xp: 25 },
    { type: 'streak-30', name: 'Thirty Day Streak', condition: longestStreak >= 30, xp: 100 },
    { type: 'completions-100', name: 'Centurion', condition: completions.length >= 100, xp: 150 },
  ];

  const unlocked = [];

  for (const def of definitions) {
    if (def.condition && !existingTypes.has(def.type)) {
      const achievement = await prisma.achievement.create({
        data: {
          userId,
          type: def.type,
          name: def.name,
          xp: def.xp,
        },
      });
      unlocked.push(achievement);
    }
  }

  return {
    unlocked,
    total: existing.length + unlocked.length,
    longestStreak,
    completions: completions.length,
  };
}

/**
 * Error handler for streak-logic
 * @param {Error} error - Error to handle
 */
function handleStreaklogicError(error) {
  try {
    console.error('[streak-logic]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
