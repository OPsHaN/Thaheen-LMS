import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Course } from '../../core/models/course.model';
import { CoursesService } from '../../core/services/courses.service';
import { ProgressService } from '../../core/services/progress.service';
import { lessonsOf } from '../../core/utils/course.utils';
@Component({
  standalone: true,
  imports: [RouterLink],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.css',
})
export class CoursesComponent {
  readonly catalog = inject(CoursesService);
  readonly store = inject(ProgressService);
  readonly query = signal('');
  readonly selected = signal('all');
  readonly Math = Math;
  readonly lessonsOf = lessonsOf;
  readonly filters = [
    { id: 'all', label: 'جميع الدورات' },
    { id: 'progress', label: 'قيد التعلّم' },
    { id: 'completed', label: 'المكتملة' },
  ];
  readonly filtered = computed(() =>
    this.catalog.courses().filter((c) => {
      const started = lessonsOf(c).some((l) => this.store.get(c.id, l.id)?.position);
      return (
        `${c.title} ${c.instructor}`.includes(this.query().trim()) &&
        (this.selected() === 'all' ||
          (this.selected() === 'completed'
            ? this.store.percent(c) === 100
            : started && this.store.percent(c) < 100))
      );
    }),
  );
  readonly total = computed(() =>
    this.catalog.courses().reduce((sum, c) => sum + lessonsOf(c).length, 0),
  );
  readonly completed = computed(() =>
    this.catalog
      .courses()
      .reduce(
        (sum, c) => sum + lessonsOf(c).filter((l) => this.store.get(c.id, l.id)?.completed).length,
        0,
      ),
  );
  readonly continuing = computed(
    () =>
      this.catalog
        .courses()
        .flatMap((course) =>
          lessonsOf(course).map((lesson) => ({
            course,
            lesson,
            progress: this.store.get(course.id, lesson.id),
          })),
        )
        .filter(
          (item): item is typeof item & { progress: NonNullable<typeof item.progress> } =>
            !!item.progress &&
            item.progress.position > 0 &&
            !item.progress.completed &&
            this.store.unlocked(item.course, item.lesson.id),
        )
        .sort((a, b) => b.progress.updatedAt - a.progress.updatedAt)[0],
  );
  constructor() {
    void this.catalog.load();
  }
  search(event: Event) {
    this.query.set((event.target as HTMLInputElement).value);
  }
  duration(course: Course) {
    return lessonsOf(course).reduce((sum, l) => sum + l.durationSec, 0);
  }
}
