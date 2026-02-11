/**
 * @fileoverview Progress Tracking module
 * @module lib/progress-tracking
 */

import { prisma } from './prisma';

export async function updateLessonProgress(options: {
  studentId: string;
  lessonId: string;
  completed?: boolean;
}) {
  const { studentId, lessonId, completed = false } = options;

  const progress = await prisma.progress.upsert({
    where: { studentId_lessonId: { studentId, lessonId } },
    update: {
      completed,
    },
    create: {
      studentId,
      lessonId,
      completed,
    },
  });

  return progress;
}

export async function recalcCourseProgress(courseId: string, studentId: string) {
  const lessons = await prisma.lesson.count({
    where: { module: { courseId } },
  });

  if (lessons === 0) return 0;

  const completed = await prisma.progress.count({
    where: { studentId, completed: true, lesson: { module: { courseId } } },
  });

  return Math.round((completed / lessons) * 100);
}

/**
 * Error handler for progress-tracking
 * @param {Error} error - Error to handle
 */
function handleProgresstrackingError(error) {
  try {
    console.error('[progress-tracking]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
