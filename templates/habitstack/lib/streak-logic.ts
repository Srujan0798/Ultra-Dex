import { prisma } from './prisma';

const ONE_DAY = 24 * 60 * 60 * 1000;

function normalize(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toKey(date: Date) {
  return normalize(date).toISOString().slice(0, 10);
}

function isTargetDay(date: Date, targetDays?: number[]) {
  if (!targetDays || targetDays.length === 0) return true;
  const day = normalize(date).getDay();
  return targetDays.includes(day);
}

export function calculateStreak(
  completions: Date[],
  targetDays?: number[],
  reference: Date = new Date()
): number {
  if (completions.length === 0) return 0;

  const completionSet = new Set(completions.map((date) => toKey(date)));

  let current = normalize(reference);

  // If today is not a target day, walk back to the most recent target day
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

export async function updateStreak(habitId: string, completed: boolean, reference = new Date()) {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { completions: true, streaks: true },
  });

  if (!habit) throw new Error('Habit not found');

  const completionDates = habit.completions.map((c) => c.date);
  const currentStreak = calculateStreak(completionDates, habit.targetDays, reference);

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

export async function getStreakStats(habitId: string) {
  const habit = await prisma.habit.findUnique({
    where: { id: habitId },
    include: { completions: true, streaks: true },
  });

  if (!habit) throw new Error('Habit not found');

  const completionDates = habit.completions.map((c) => c.date);
  const current = calculateStreak(completionDates, habit.targetDays);
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
    current,
    longest,
    total,
    thisWeek,
    thisMonth,
  };
}
