import { Course } from '../models/course.model';
import { LessonProgress, ProgressMap } from '../models/progress.model';
import { lessonsOf } from './course.utils';
export const progressKey = (courseId: string, lessonId: string): string =>
  `${courseId}/${lessonId}`;
export function recordPosition(
  previous: LessonProgress | undefined,
  position: number,
  duration: number,
  now: number,
): LessonProgress {
  const validDuration = Number.isFinite(duration) && duration > 0;
  const safePosition = Number.isFinite(position)
    ? Math.max(0, validDuration ? Math.min(position, duration) : position)
    : 0;
  return {
    position: safePosition,
    completed: !!previous?.completed || (validDuration && safePosition / duration >= 0.9),
    updatedAt: now,
  };
}
export function isUnlocked(course: Course, lessonId: string, progress: ProgressMap): boolean {
  const lessons = lessonsOf(course);
  const index = lessons.findIndex((l) => l.id === lessonId);
  return (
    index === 0 ||
    (index > 0 && !!progress[progressKey(course.id, lessons[index - 1].id)]?.completed)
  );
}
export function coursePercent(course: Course, progress: ProgressMap): number {
  const lessons = lessonsOf(course);
  return lessons.length
    ? Math.round(
        (100 * lessons.filter((l) => progress[progressKey(course.id, l.id)]?.completed).length) /
          lessons.length,
      )
    : 0;
}
