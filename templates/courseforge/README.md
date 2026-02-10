# CourseForge Template

CourseForge is a learning management system (LMS) template with courses, modules, lessons, enrollments, and progress tracking.

## Included
- Prisma schema for Course, Module, Lesson, Enrollment, Progress, Certificate
- Course and module CRUD helpers
- Lesson management helpers
- Progress tracking and completion tracking
- Certificate generation on completion

## Directory

```text
templates/courseforge/
  schema.prisma
  api/
    courses.ts
    lessons.ts
    enrollments.ts
    progress.ts
    certificates.ts
  lib/
    prisma.ts
    progress-calc.ts
    progress-tracking.ts
    progress-tracker.ts
```

## Data Model
- Course: top-level course definition with modules and lessons.
- Module: ordered grouping for lessons.
- Lesson: content unit with duration and type.
- Enrollment: student enrollment record.
- Progress: per-lesson completion status.
- Certificate: issued when course reaches 100 percent completion.

## Setup

1. Copy template into your project.
2. Install Prisma dependencies:

```bash
npm install prisma @prisma/client
```

3. Configure database:

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/courseforge"
```

4. Generate client and run migration:

```bash
npx prisma generate
npx prisma migrate dev --name init_courseforge
```

## Core APIs

### Courses and Modules
- createCourse(instructorId, data)
- getCourse(courseId)
- listCourses({ instructorId, studentId })
- updateCourse(courseId, instructorId, data)
- deleteCourse(courseId, instructorId)
- addModule(courseId, title, order)
- addLesson(moduleId, title, content, order)

### Lessons
- createLesson(moduleId, data)
- updateLesson(lessonId, data)
- deleteLesson(lessonId)
- listLessons(moduleId)

### Progress
- markLessonComplete(studentId, lessonId)
- markLessonIncomplete(studentId, lessonId)
- getStudentProgress(courseId, studentId)
- listProgress(studentId)

### Certificates
- issueCertificate(studentId, courseId)
- getCertificate(certificateId)
- listCertificates(studentId)

## Progress Tracking

`lib/progress-tracker.ts` provides:
- trackLessonComplete(userId, lessonId)
- getCourseProgress(userId, courseId)
- generateCertificate(userId, courseId)

The tracker uses the progress table to compute completion percentage and issues a certificate once the course reaches 100 percent.

## Production Notes
- Enforce instructor ownership for authoring routes.
- Use transaction boundaries for completion updates if exposed via HTTP route handlers.
- Add idempotency keys for clients that retry completion updates.
