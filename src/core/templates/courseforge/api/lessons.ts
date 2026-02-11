/**
 * @fileoverview Lessons module
 * @module api/lessons
 */

import { prisma } from '../lib/prisma';

export async function createModule(courseId: string, data: { title: string; order: number }) {
  if (!data.title?.trim()) {
    throw new Error('Module title is required');
  }

  return prisma.module.create({
    data: {
      courseId,
      title: data.title.trim(),
      order: data.order,
    },
  });
}

export async function updateModule(moduleId: string, data: { title?: string; order?: number }) {
  const moduleRecord = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!moduleRecord) throw new Error('Module not found');

  return prisma.module.update({
    where: { id: moduleId },
    data: {
      title: data.title?.trim() ?? moduleRecord.title,
      order: data.order ?? moduleRecord.order,
    },
  });
}

export async function deleteModule(moduleId: string) {
  return prisma.module.delete({ where: { id: moduleId } });
}

export async function listModules(courseId: string) {
  return prisma.module.findMany({
    where: { courseId },
    include: { lessons: true },
    orderBy: { order: 'asc' },
  });
}

export async function createLesson(
  moduleId: string,
  data: { title: string; content?: string; order: number }
) {
  if (!data.title?.trim()) {
    throw new Error('Lesson title is required');
  }

  return prisma.lesson.create({
    data: {
      moduleId,
      title: data.title.trim(),
      content: data.content ?? '',
      order: data.order,
    },
  });
}

export async function updateLesson(
  lessonId: string,
  data: { title?: string; content?: string; order?: number }
) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
  if (!lesson) throw new Error('Lesson not found');

  return prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title: data.title?.trim() ?? lesson.title,
      content: data.content ?? lesson.content,
      order: data.order ?? lesson.order,
    },
  });
}

export async function deleteLesson(lessonId: string) {
  return prisma.lesson.delete({ where: { id: lessonId } });
}

export async function listLessons(moduleId: string) {
  return prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { order: 'asc' },
  });
}

/**
 * Error handler for lessons
 * @param {Error} error - Error to handle
 */
function handleLessonsError(error) {
  try {
    console.error('[lessons]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
