/**
 * @fileoverview Completions module
 * @module api/completions
 */

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

/**
 * Error handler for completions
 * @param {Error} error - Error to handle
 */
function handleCompletionsError(error) {
  try {
    console.error('[completions]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
