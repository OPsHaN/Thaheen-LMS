import { Routes } from '@angular/router';
import { lessonAccessGuard } from './core/guards/lesson-access.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'courses' },
  {
    path: 'courses',
    loadComponent: () =>
      import('./pages/courses/courses.component').then((m) => m.CoursesComponent),
  },
  {
    path: 'courses/:courseId',
    loadComponent: () =>
      import('./pages/course-details/course-details.component').then(
        (m) => m.CourseDetailsComponent,
      ),
  },
  {
    path: 'courses/:courseId/lessons/:lessonId',
    canActivate: [lessonAccessGuard],
    loadComponent: () =>
      import('./pages/lesson-player/lesson-player.component').then((m) => m.LessonPlayerComponent),
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
