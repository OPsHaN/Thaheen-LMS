import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CoursesService } from '../../core/services/courses.service';
import { ProgressService } from '../../core/services/progress.service';
import { lessonsOf } from '../../core/utils/course.utils';
import { NotFoundComponent } from '../not-found/not-found.component';
@Component({
  standalone: true,
  imports: [RouterLink, NotFoundComponent],
  templateUrl: './course-details.component.html',
  styleUrl: './course-details.component.css',
})
export class CourseDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  readonly params = toSignal(this.route.paramMap);
  readonly query = toSignal(this.route.queryParamMap);
  readonly catalog = inject(CoursesService);
  readonly store = inject(ProgressService);
  readonly lessonsOf = lessonsOf;
  readonly course = computed(() => this.catalog.find(this.params()?.get('courseId') ?? null));
  readonly firstAvailable = computed(() => {
    const c = this.course();
    return c
      ? (lessonsOf(c).find(
          (l) => !this.store.get(c.id, l.id)?.completed && this.store.unlocked(c, l.id),
        ) ?? lessonsOf(c)[0])
      : undefined;
  });
  constructor() {
    void this.catalog.load();
  }
  time(sec: number) {
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  }
}
