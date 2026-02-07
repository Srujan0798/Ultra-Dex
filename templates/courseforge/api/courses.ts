import { prisma } from '../lib/prisma';

export async function createCourse(instructorId: string, data: { title: string; description?: string }) {
  if (!data.title?.trim()) {
    throw new Error('Course title is required');
  }

  return prisma.course.create({
    data: {
      title: data.title.trim(),
      description: data.description?.trim(),
      instructorId
    }
  });
}

export async function getCourse(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { order: 'asc' },
        include: { lessons: { orderBy: { order: 'asc' } } }
      },
      enrollments: true
    }
  });

  if (!course) throw new Error('Course not found');

  return course;
}

export async function listCourses(options: { instructorId?: string; studentId?: string } = {}) {
  const where: Record<string, unknown> = {};

  if (options.instructorId) {
    where.instructorId = options.instructorId;
  }

  if (options.studentId) {
    where.enrollments = { some: { studentId: options.studentId } };
  }

  return prisma.course.findMany({
    where,
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateCourse(
  courseId: string,
  instructorId: string,
  data: { title?: string; description?: string }
) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, instructorId }
  });

  if (!course) throw new Error('Course not found or unauthorized');

  return prisma.course.update({
    where: { id: courseId },
    data: {
      title: data.title?.trim() ?? course.title,
      description: data.description?.trim() ?? course.description
    }
  });
}

export async function deleteCourse(courseId: string, instructorId: string) {
  const course = await prisma.course.findFirst({
    where: { id: courseId, instructorId }
  });

  if (!course) throw new Error('Course not found or unauthorized');

  return prisma.course.delete({ where: { id: courseId } });
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
