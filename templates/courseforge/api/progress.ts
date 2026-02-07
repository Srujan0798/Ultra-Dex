import { prisma } from '../lib/prisma';
import { updateLessonProgress } from '../lib/progress-tracking';
import { getCourseProgress, trackLessonComplete } from '../progress-tracker';

export async function markLessonComplete(studentId: string, lessonId: string) {
  return trackLessonComplete(studentId, lessonId);
}

export async function markLessonIncomplete(studentId: string, lessonId: string) {
  return updateLessonProgress({ studentId, lessonId, completed: false });
}

export async function getStudentProgress(courseId: string, studentId: string) {
  return getCourseProgress(studentId, courseId);
}

export async function listProgress(studentId: string) {
  return prisma.progress.findMany({
    where: { studentId },
    include: { lesson: true },
    orderBy: { updatedAt: 'desc' },
  });
}
