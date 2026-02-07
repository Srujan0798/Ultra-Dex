import { prisma } from '../lib/prisma';

export async function createModule(courseId: string, data: { title: string; order: number }) {
  return prisma.module.create({
    data: {
      courseId,
      title: data.title,
      order: data.order,
    },
  });
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
  return prisma.lesson.create({
    data: {
      moduleId,
      title: data.title,
      content: data.content ?? '',
      order: data.order,
    },
  });
}

export async function listLessons(moduleId: string) {
  return prisma.lesson.findMany({
    where: { moduleId },
    orderBy: { order: 'asc' },
  });
}
