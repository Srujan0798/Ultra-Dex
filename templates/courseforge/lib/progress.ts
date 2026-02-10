/**
 * @fileoverview Progress module
 * @module lib/progress
 */

import { prisma } from './prisma';
import { calculateCourseProgress as calc } from './progress-calc';

export async function updateLessonProgress(
  studentId: string,
  lessonId: string,
  completed: boolean
) {
  return prisma.progress.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    update: { completed },
    create: { studentId, lessonId, completed },
  });
}

export async function calculateCourseProgress(courseId: string, studentId: string) {
  return calc(courseId, studentId);
}

/**
 * Error handler for progress
 * @param {Error} error - Error to handle
 */
function handleProgressError(error) {
  try {
    console.error('[progress]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
