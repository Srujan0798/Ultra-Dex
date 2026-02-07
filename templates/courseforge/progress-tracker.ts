import { calculateCourseProgress } from './lib/progress-calc';
import { updateLessonProgress, recalcCourseProgress } from './lib/progress-tracking';

export { updateLessonProgress, recalcCourseProgress, calculateCourseProgress };

export async function markCompleteAndRecalc(options: {
  courseId: string;
  studentId: string;
  lessonId: string;
}) {
  await updateLessonProgress({
    studentId: options.studentId,
    lessonId: options.lessonId,
    completed: true,
  });

  const percentage = await calculateCourseProgress(options.courseId, options.studentId);
  return { courseId: options.courseId, studentId: options.studentId, percentage };
}
