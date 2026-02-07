import { prisma } from './lib/prisma';
import { calculateCourseProgress } from './lib/progress-calc';
import { updateLessonProgress } from './lib/progress-tracking';

export async function trackLessonComplete(userId: string, lessonId: string) {
  const progress = await updateLessonProgress({
    studentId: userId,
    lessonId,
    completed: true,
  });

  return progress;
}

export async function getCourseProgress(userId: string, courseId: string) {
  const percentage = await calculateCourseProgress(courseId, userId);
  return { courseId, studentId: userId, percentage };
}

export async function generateCertificate(userId: string, courseId: string) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { studentId: userId, courseId },
  });

  if (!enrollment) {
    throw new Error('Student is not enrolled in this course');
  }

  const progress = await calculateCourseProgress(courseId, userId);
  if (progress < 100) {
    throw new Error('Course not completed');
  }

  const existing = await prisma.certificate.findFirst({
    where: { enrollmentId: enrollment.id },
  });

  if (existing) {
    return existing;
  }

  const certificate = await prisma.certificate.create({
    data: {
      enrollmentId: enrollment.id,
      studentId: userId,
      courseId,
    },
  });

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { completedAt: new Date() },
  });

  return certificate;
}

export async function markCompleteAndRecalc(options: {
  courseId: string;
  studentId: string;
  lessonId: string;
}) {
  await trackLessonComplete(options.studentId, options.lessonId);
  const percentage = await calculateCourseProgress(options.courseId, options.studentId);
  return { courseId: options.courseId, studentId: options.studentId, percentage };
}

export { calculateCourseProgress, updateLessonProgress };
