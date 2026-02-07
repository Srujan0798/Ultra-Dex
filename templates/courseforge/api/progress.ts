import { prisma } from '../lib/prisma';
import { calculateCourseProgress } from '../lib/progress-calc';
import { updateLessonProgress } from '../lib/progress-tracking';

export async function markLessonComplete(studentId: string, lessonId: string) {
  return updateLessonProgress({ studentId, lessonId, completed: true });
}

export async function markLessonIncomplete(studentId: string, lessonId: string) {
  return updateLessonProgress({ studentId, lessonId, completed: false });
}

export async function getStudentProgress(courseId: string, studentId: string) {
  const percentage = await calculateCourseProgress(courseId, studentId);
  return { courseId, studentId, percentage };
}

export async function listProgress(studentId: string) {
  return prisma.progress.findMany({
    where: { studentId },
    include: { lesson: true },
    orderBy: { updatedAt: 'desc' },
  });
}
