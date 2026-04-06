/**
 * @fileoverview Streak Logic module
 * @module habitstack/streak-logic
 */

export interface Streak {
  id: string;
  userId: string;
  name: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedAt: Date | null;
  createdAt: Date;
}

export interface StreakLog {
  id: string;
  streakId: string;
  completedAt: Date;
  notes?: string;
}

/**
 * Calculate current streak count
 */
export function calculateStreak(logs: StreakLog[]): number {
  if (logs.length === 0) return 0;

  const sorted = [...logs].sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let checkDate = today;

  for (const log of sorted) {
    const logDate = new Date(log.completedAt);
    logDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((checkDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0 || diffDays === 1) {
      streak++;
      checkDate = logDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Check if streak is active (completed today)
 */
export function isStreakActive(lastCompletedAt: Date | null): boolean {
  if (!lastCompletedAt) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(lastCompletedAt);
  lastDate.setHours(0, 0, 0, 0);

  return today.getTime() === lastDate.getTime();
}

/**
 * Error handler for streak-logic
 * @param {Error} error - Error to handle
 */
function handleStreaklogicError(error: Error | unknown) {
  try {
    console.error('[streak-logic]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
