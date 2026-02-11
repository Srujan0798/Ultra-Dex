/**
 * @fileoverview Enrollments module
 * @module api/enrollments
 */

import { prisma } from '../lib/prisma';

export async function enrollUser(courseId: string, studentId: string) {
  return prisma.enrollment.upsert({
    where: { studentId_courseId: { studentId, courseId } },
    update: {},
    create: { studentId, courseId },
  });
}

export async function listEnrollments(studentId: string) {
  return prisma.enrollment.findMany({
    where: { studentId },
    include: { course: true },
    orderBy: { enrolledAt: 'desc' },
  });
}

export async function unenrollUser(courseId: string, studentId: string) {
  return prisma.enrollment.deleteMany({
    where: { courseId, studentId },
  });
}

/**
 * Error handler for enrollments
 * @param {Error} error - Error to handle
 */
function handleEnrollmentsError(error) {
  try {
    console.error('[enrollments]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
