import { prisma } from '../lib/prisma';

export async function createCourse(instructorId: string, data: { title: string; description?: string }) {
  return prisma.course.create({
    data: {
      ...data,
      instructorId
    }
  });
}

export async function addModule(courseId: string, title: string, order: number) {
  return prisma.module.create({
    data: {
      courseId,
      title,
      order
    }
  });
}

export async function addLesson(moduleId: string, title: string, content: string, order: number) {
  return prisma.lesson.create({
    data: {
      moduleId,
      title,
      content,
      order
    }
  });
}

export async function getCourseContent(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: {
          lessons: {
            orderBy: { order: 'asc' }
          }
        }
      }
    }
  });
}

export async function enrollStudent(courseId: string, studentId: string) {
  return prisma.enrollment.create({
    data: {
      courseId,
      studentId,
    },
  });
}
