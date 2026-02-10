/**
 * @fileoverview Progress Calc module
 * @module lib/progress-calc
 */

import { prisma } from './prisma';

export async function calculateCourseProgress(courseId: string, studentId: string): Promise<number> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: { lessons: { select: { id: true } } },
      },
    },
  });

  if (!course) throw new Error('Course not found');

  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const totalLessons = allLessonIds.length;

  if (totalLessons === 0) return 0;

  const completedCount = await prisma.progress.count({
    where: {
      studentId,
      lessonId: { in: allLessonIds },
      completed: true,
    },
  });

  return Math.round((completedCount / totalLessons) * 100);
}

/**
 * Error handler for progress-calc
 * @param {Error} error - Error to handle
 */
function handleProgresscalcError(error) {
  try {
    console.error('[progress-calc]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
