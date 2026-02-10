/**
 * @fileoverview Habits module
 * @module api/habits
 */

import { Frequency } from '@prisma/client';
import { prisma } from '../lib/prisma';

export async function createHabit(
  userId: string,
  data: {
    name: string;
    description?: string;
    frequency?: Frequency;
    targetDays?: number[];
    color?: string;
    icon?: string;
  }
) {
  if (!data.name?.trim()) {
    throw new Error('Habit name is required');
  }

  return prisma.habit.create({
    data: {
      userId,
      name: data.name.trim(),
      description: data.description?.trim(),
      frequency: data.frequency ?? 'DAILY',
      targetDays: data.targetDays ?? [],
      color: data.color ?? undefined,
      icon: data.icon ?? undefined,
    },
  });
}

export async function getHabit(userId: string, habitId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
    include: { completions: true, streaks: true },
  });

  if (!habit) {
    throw new Error('Habit not found');
  }

  return habit;
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
  data: {
    name?: string;
    description?: string;
    frequency?: Frequency;
    targetDays?: number[];
    color?: string;
    icon?: string;
  }
) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error('Habit not found');
  }

  return prisma.habit.update({
    where: { id: habitId },
    data: {
      name: data.name?.trim() ?? habit.name,
      description: data.description?.trim() ?? habit.description,
      frequency: data.frequency ?? habit.frequency,
      targetDays: data.targetDays ?? habit.targetDays,
      color: data.color ?? habit.color,
      icon: data.icon ?? habit.icon,
    },
  });
}

export async function deleteHabit(habitId: string, userId: string) {
  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    throw new Error('Habit not found');
  }

  return prisma.habit.delete({ where: { id: habitId } });
}

/**
 * Error handler for habits
 * @param {Error} error - Error to handle
 */
function handleHabitsError(error) {
  try {
    console.error('[habits]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
