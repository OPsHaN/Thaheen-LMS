import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CoursesService } from '../services/courses.service';
import { ProgressService } from '../services/progress.service';
import { lessonsOf } from '../utils/course.utils';
export const lessonAccessGuard: CanActivateFn = async (route) => {
  const catalog = inject(CoursesService),
    store = inject(ProgressService),
    router = inject(Router);
  await catalog.load();
  const course = catalog.find(route.paramMap.get('courseId'));
  const lessonId = route.paramMap.get('lessonId') ?? '';
  if (!course || !lessonsOf(course).some((l) => l.id === lessonId)) return true;
  return (
    store.unlocked(course, lessonId) ||
    router.createUrlTree(['/courses', course.id], { queryParams: { locked: '1' } })
  );
};
