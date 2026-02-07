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
